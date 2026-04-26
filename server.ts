import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import os from "os";
import si from "systeminformation";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Load .env.local first (local dev), then fall back to .env
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const db = new Database("system_health.db");
const JWT_SECRET = process.env.JWT_SECRET || "dashboard-secret-key-123";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'viewer'
  );
  
  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cpu REAL,
    memory REAL,
    disk REAL,
    status TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    message TEXT,
    severity TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved INTEGER DEFAULT 0
  );
  
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
  
  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER,
    username TEXT,
    action TEXT,
    details TEXT
  );
`);

// Logging Helper
const audit = (req: any, action: string, details: string = "") => {
  const token = req.headers.authorization?.split(" ")[1];
  let userId = null;
  let username = "System";
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      userId = decoded.id;
      username = decoded.username;
    } catch (e) {}
  }
  db.prepare("INSERT INTO audit_logs (user_id, username, action, details) VALUES (?, ?, ?, ?)").run(userId, username, action, details);
};

// Seed initial users if not exists
const usersToSeed = [
  { username: "Roohan", password: "admin123", role: "admin" },
  { username: "Manahil", password: "user123", role: "viewer" }
];

usersToSeed.forEach(u => {
  const exists = db.prepare("SELECT * FROM users WHERE username = ?").get(u.username);
  if (!exists) {
    const hash = bcrypt.hashSync(u.password, 10);
    db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run(u.username, hash, u.role);
  }
});

// Seed initial settings if not exists
const defaultSettings = [
  { key: 'cpu_threshold', value: '80' },
  { key: 'mem_threshold', value: '85' },
  { key: 'disk_threshold', value: '90' }
];

defaultSettings.forEach(s => {
  const exists = db.prepare("SELECT * FROM settings WHERE key = ?").get(s.key);
  if (!exists) {
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(s.key, s.value);
  }
});

// Middleware for admin check
const adminOnly = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'admin') return res.status(403).json({ error: "Admin only" });
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);

  app.use(express.json());

  // --- API Routes ---

  // User Management (Admin Only)
  app.get("/api/users", adminOnly, (req, res) => {
    const users = db.prepare("SELECT id, username, role FROM users").all();
    res.json(users);
  });

  app.post("/api/users", adminOnly, (req, res) => {
    const { username, password, role } = req.body;
    try {
      const hash = bcrypt.hashSync(password, 10);
      db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run(username, hash, role);
      audit(req, "User created", `Username: ${username}, Role: ${role}`);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.put("/api/users/:id", adminOnly, (req, res) => {
    const { username, password, role } = req.body;
    const { id } = req.params;
    try {
      if (password) {
        const hash = bcrypt.hashSync(password, 10);
        db.prepare("UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?").run(username, hash, role, id);
        audit(req, "User updated", `ID: ${id}, Username: ${username}, Role: ${role} (Password changed)`);
      } else {
        db.prepare("UPDATE users SET username = ?, role = ? WHERE id = ?").run(username, role, id);
        audit(req, "User updated", `ID: ${id}, Username: ${username}, Role: ${role}`);
      }
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: "Username already exists or update failed" });
    }
  });

  app.delete("/api/users/:id", adminOnly, (req, res) => {
    try {
      const userToDelete = db.prepare("SELECT username, role FROM users WHERE id = ?").get(req.params.id) as any;
      if (!userToDelete) return res.status(404).json({ error: "User not found" });
      
      // Prevent deleting the last admin
      if (userToDelete.role === 'admin') {
        const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get() as any;
        if (adminCount.count <= 1) {
          return res.status(400).json({ error: "Cannot delete the last administrator" });
        }
      }

      db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
      audit(req, "User deleted", `ID: ${req.params.id}, Username: ${userToDelete?.username}`);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Deletion failed" });
    }
  });

  // Auth
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;
    
    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
      audit(req, "User login", `Username: ${username}`);
      res.json({ token, user: { username: user.username, role: user.role } });
    } else {
      audit(req, "Failed login attempt", `Username: ${username}`);
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // System Stats
  app.get("/api/system/stats", async (req, res) => {
    try {
      const [cpuLoad, cpuInfo, mem, disk] = await Promise.all([
        si.currentLoad(),
        si.cpu(),
        si.mem(),
        si.fsSize()
      ]);
      
      const cpuAvg = Math.round(cpuLoad.currentLoad || 0);
      const memAvg = Math.round((mem.active / mem.total) * 100) || 0;
      
      // Better Disk Detection: Look for / or /app or valid size
      const primaryDisk = disk.find(d => d.mount === '/' || d.mount === '/app') || disk.find(d => d.size > 0) || disk[0] || { use: 0, size: 0 };
      const diskAvg = Math.round(primaryDisk.use || 0);
      
      // Health Score Calculation
      const healthScore = Math.max(0, 100 - (cpuAvg + memAvg) / 2);

      // CPU Info Fallback for Cloud Containers
      const osCpus = os.cpus();
      const cpuBrand = cpuInfo.brand || (osCpus.length > 0 ? osCpus[0].model : "Standard Virtual CPU");
      const cpuSpeed = cpuInfo.speed || (osCpus.length > 0 ? (osCpus[0].speed / 1000).toFixed(1) : "?.?");

      const stats = {
        cpu: cpuAvg,
        memory: memAvg,
        disk: diskAvg,
        healthScore: Math.round(healthScore),
        uptime: os.uptime(),
        platform: os.platform(),
        timestamp: new Date().toISOString(),
        cpuModel: cpuBrand,
        cpuSpeed: cpuSpeed,
        totalMem: mem.total,
        totalDisk: primaryDisk.size || 0
      };

      // Logging
      db.prepare("INSERT INTO logs (cpu, memory, disk, status) VALUES (?, ?, ?, ?)").run(
          stats.cpu, stats.memory, stats.disk, stats.healthScore > 40 ? 'Healthy' : 'Warning'
      );

      // Check for alerts
      let thresholds = { cpu: 80, mem: 85, disk: 90 };
      try {
        const cpuSet = db.prepare("SELECT value FROM settings WHERE key = ?").get("cpu_threshold") as any;
        const memSet = db.prepare("SELECT value FROM settings WHERE key = ?").get("mem_threshold") as any;
        const diskSet = db.prepare("SELECT value FROM settings WHERE key = ?").get("disk_threshold") as any;
        
        if (cpuSet) thresholds.cpu = parseInt(cpuSet.value) || 80;
        if (memSet) thresholds.mem = parseInt(memSet.value) || 85;
        if (diskSet) thresholds.disk = parseInt(diskSet.value) || 90;
      } catch (e) {
        console.error("Failed to load thresholds:", e);
      }

      if (stats.cpu > thresholds.cpu) {
        db.prepare("INSERT INTO alerts (type, message, severity) VALUES (?, ?, ?)").run("CPU", `CPU usage is critically high: ${stats.cpu}%`, "Critical");
      }
      if (stats.memory > thresholds.mem) {
        db.prepare("INSERT INTO alerts (type, message, severity) VALUES (?, ?, ?)").run("Memory", `Memory usage is low: ${stats.memory}%`, "Warning");
      }

      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Logs
  app.get("/api/logs", (req, res) => {
    const logs = db.prepare("SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100").all();
    res.json(logs);
  });

  // Top Processes (Intermediate 5)
  app.get("/api/system/processes", async (req, res) => {
    try {
      const procs = await si.processes();
      // Get top 5 by CPU and top 5 by Memory
      const sortedByCpu = [...procs.list].sort((a, b) => b.cpu - a.cpu).slice(0, 5);
      res.json(sortedByCpu);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch processes" });
    }
  });

  // Alerts
  app.get("/api/alerts", (req, res) => {
    const alerts = db.prepare("SELECT * FROM alerts WHERE resolved = 0 ORDER BY timestamp DESC").all();
    res.json(alerts);
  });

  app.post("/api/alerts/resolve", adminOnly, (req, res) => {
    const { id } = req.body;
    db.prepare("UPDATE alerts SET resolved = 1 WHERE id = ?").run(id);
    audit(req, "Alert acknowledged", `Alert ID: ${id}`);
    res.json({ success: true });
  });

  // Reports (CSV Export)
  app.get("/api/reports/csv", (req, res) => {
    const token = req.query.token as string;
    if (!token) return res.status(401).send("Unauthorized: Missing token");
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).send("Unauthorized: Invalid token");
    }
    
    try {
      const logs = db.prepare("SELECT * FROM logs ORDER BY timestamp DESC").all() as any[];
      let csv = "ID,CPU%,Memory%,Disk%,Status,Timestamp\n";
      logs.forEach(l => {
        csv += `${l.id},${l.cpu},${l.memory},${l.disk},${l.status},${l.timestamp}\n`;
      });
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=system_report.csv");
      res.send(csv);
    } catch (err) {
      res.status(500).send("Report generation failed");
    }
  });

  // Settings
  app.get("/api/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all();
    res.json(settings);
  });

  app.post("/api/settings", adminOnly, (req, res) => {
    const { cpu_threshold, mem_threshold, disk_threshold } = req.body;
    try {
      if (cpu_threshold) db.prepare("UPDATE settings SET value = ? WHERE key = 'cpu_threshold'").run(cpu_threshold.toString());
      if (mem_threshold) db.prepare("UPDATE settings SET value = ? WHERE key = 'mem_threshold'").run(mem_threshold.toString());
      if (disk_threshold) db.prepare("UPDATE settings SET value = ? WHERE key = 'disk_threshold'").run(disk_threshold.toString());
      audit(req, "Settings changed", `CPU: ${cpu_threshold}%, MEM: ${mem_threshold}%, DISK: ${disk_threshold}%`);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Audit Logs
  app.get("/api/audit-logs", adminOnly, (req, res) => {
    const logs = db.prepare("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100").all();
    res.json(logs);
  });

  // Backup Service (Simulated)
  app.post("/api/system/backup", adminOnly, (req, res) => {
    audit(req, "Backup performed", "Full system state captured");
    res.json({ success: true, message: "Backup completed successfully" });
  });

  // --- Vite / Static Handling ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 System Health Server running on http://localhost:${PORT}`);
  });
}

startServer();
