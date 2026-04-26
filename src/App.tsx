import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  LayoutDashboard, 
  Bell, 
  ClipboardList, 
  Settings, 
  LogOut, 
  Cpu, 
  Database, 
  HardDrive, 
  ShieldAlert,
  ArrowUpRight,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Menu,
  X,
  Users as UsersIcon,
  Plus,
  Trash2,
  Edit2,
  Sun,
  Moon,
  History,
  ShieldCheck
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- Types ---
interface SystemStats {
  cpu: number;
  memory: number;
  disk: number;
  healthScore: number;
  uptime: number;
  platform: string;
  timestamp: string;
  cpuModel?: string;
  cpuSpeed?: string;
  totalMem?: number;
  totalDisk?: number;
}

interface Alert {
  id: number;
  type: string;
  message: string;
  severity: 'Warning' | 'Critical' | 'Healthy';
  timestamp: string;
}

interface Log {
  id: number;
  cpu: number;
  memory: number;
  disk: number;
  status: string;
  timestamp: string;
}

interface User {
  username: string;
  role: string;
}

interface AuditLog {
  id: number;
  timestamp: string;
  username: string;
  action: string;
  details: string;
}

// --- Components ---

const Card = ({ children, className, title, icon: Icon, theme }: { children: React.ReactNode, className?: string, title?: string, icon?: any, theme?: 'dark' | 'light' }) => (
  <div className={cn(
    "border rounded-xl p-4 transition-all duration-200", 
    theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm",
    className
  )}>
    {title && (
      <div className={cn("flex items-center justify-between mb-4 border-b pb-3", theme === 'dark' ? "border-slate-800" : "border-slate-100")}>
        <h3 className={cn("text-xs font-bold uppercase tracking-widest flex items-center gap-2", theme === 'dark' ? "text-white" : "text-slate-800")}>
          {Icon && <Icon className="w-3.5 h-3.5 text-emerald-500" />}
          {title}
        </h3>
        <ArrowUpRight className="w-3 h-3 text-slate-600" />
      </div>
    )}
    {children}
  </div>
);

const StatCard = ({ label, value, unit, icon: Icon, colorClass, trend, subtitle, theme }: { label: string, value: number, unit: string, icon: any, colorClass: string, trend?: string, subtitle?: string, theme?: 'dark' | 'light' }) => (
  <div className={cn("border p-4 rounded-xl", theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm")}>
    <div className="flex justify-between items-start mb-2">
      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{label}</p>
      <span className={cn("text-xs font-bold", colorClass)}>{value}%</span>
    </div>
    <div className={cn("text-2xl font-bold mb-2 tracking-tighter flex items-center gap-2", theme === 'dark' ? "text-white" : "text-slate-900")}>
      <Icon className={cn("w-4 h-4 opacity-50", colorClass)} />
      {subtitle || `${value}${unit}`}
    </div>
    <div className="w-full h-1.5 bg-slate-800/20 rounded-full overflow-hidden">
      <motion.div 
        className={cn("h-full", colorClass.replace('text-', 'bg-'))}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
    {trend && (
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[9px] text-slate-500 uppercase font-bold">Trend</span>
        <span className="text-[9px] text-emerald-500 font-bold">{trend}</span>
      </div>
    )}
  </div>
);

const SidebarItem = ({ icon: Icon, label, active, onClick, count }: { icon: any, label: string, active: boolean, onClick: () => void, count?: number }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center px-3 py-2 rounded-md transition-all duration-200 group text-sm font-medium",
      active 
        ? "bg-slate-800 text-emerald-400 border-l-2 border-emerald-500" 
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    )}
  >
    <Icon className={cn("w-4 h-4 mr-3 opacity-80", active ? "text-emerald-400" : "group-hover:text-emerald-400 transition-colors")} />
    {label}
    {count !== undefined && count > 0 && (
      <span className="ml-auto bg-amber-500/20 text-amber-500 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
        {count} Active
      </span>
    )}
  </button>
);

const UserManagementView = ({ users, onRefresh, setNotification, theme }: { users: any[], onRefresh: () => void, setNotification: any, theme: 'dark' | 'light' }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'viewer' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';
    
    // For editing, only send password if it was typed
    const payload = editingUser && !formData.password 
      ? { username: formData.username, role: formData.role }
      : formData;

    const res = await fetch(url, {
      method: method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      setIsAdding(false);
      setEditingUser(null);
      setFormData({ username: '', password: '', role: 'viewer' });
      onRefresh();
      setNotification({ message: editingUser ? 'User updated!' : 'User created!', type: 'success' });
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({ username: user.username, password: '', role: user.role });
    setIsAdding(true);
  };

  const deleteUser = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    await fetch(`/api/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    onRefresh();
    setNotification({ message: 'User deleted!', type: 'success' });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={cn("text-xl font-black italic uppercase", theme === 'dark' ? "text-white" : "text-slate-900")}>Users</h1>
          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-1">Manage system accounts and roles</p>
        </div>
        <button 
          onClick={() => {
            if (isAdding) {
              setEditingUser(null);
              setFormData({ username: '', password: '', role: 'viewer' });
            }
            setIsAdding(!isAdding);
          }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {isAdding && (
        <Card theme={theme} className="max-w-md mx-auto" title={editingUser ? "Edit User Authority" : "New Operator Protocol"} icon={editingUser ? Edit2 : Plus}>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Username</label>
              <input 
                type="text" 
                required
                className={cn(
                  "w-full border rounded px-3 py-2 text-sm outline-none focus:border-emerald-500 transition-colors font-mono",
                  theme === 'dark' ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
                )}
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {editingUser ? "New Password (Leave blank to keep current)" : "Password"}
              </label>
              <input 
                type="password" 
                required={!editingUser}
                className={cn(
                  "w-full border rounded px-3 py-2 text-sm outline-none focus:border-emerald-500 transition-colors font-mono",
                  theme === 'dark' ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
                )}
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Access Role</label>
              <select 
                className={cn(
                  "w-full border rounded px-3 py-2 text-sm outline-none focus:border-emerald-500 transition-colors appearance-none",
                  theme === 'dark' ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
                )}
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
              >
                <option value="viewer">Viewer (Read Only)</option>
                <option value="admin">Administrator (Full Access)</option>
              </select>
            </div>
            <button className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded font-black text-white uppercase text-[10px] tracking-widest mt-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
               {editingUser ? 'Commit Changes' : 'Initialize Account'}
            </button>
          </form>
        </Card>
      )}

      <div className={cn(
        "border rounded-xl overflow-hidden shadow-2xl shadow-slate-950/50",
        theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
      )}>
        <table className="w-full text-left">
          <thead>
            <tr className={cn("text-[10px] font-black uppercase text-slate-500 border-b", theme === 'dark' ? "bg-slate-800/50 border-slate-800" : "bg-slate-50 border-slate-100")}>
              <th className="px-6 py-3">Identity</th>
              <th className="px-6 py-3">Classification</th>
              <th className="px-6 py-3 text-right">Operations</th>
            </tr>
          </thead>
          <tbody className={cn("divide-y text-xs", theme === 'dark' ? "divide-slate-800/40 text-slate-300" : "divide-slate-100 text-slate-700")}>
            {users.map(u => (
              <tr key={u.id} className={cn("transition-colors", theme === 'dark' ? "hover:bg-slate-800/20" : "hover:bg-slate-50/50")}>
                <td className="px-6 py-4">
                   <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black", u.role === 'admin' ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20" : "bg-slate-800 text-slate-400")}>
                         {u.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-sm tracking-tight">{u.username}</span>
                   </div>
                </td>
                <td className="px-6 py-4">
                   <span className={cn(
                     "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                     u.role === 'admin' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-slate-800/50 text-slate-500 border border-slate-800"
                   )}>
                     {u.role}
                   </span>
                </td>
                <td className="px-6 py-4 text-right">
                   <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(u)}
                        className="p-2 text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"
                        title="Edit User"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => deleteUser(u.id)}
                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Revoke Access"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};
const SystemScoreGauge = ({ score, theme }: { score: number, theme: 'dark' | 'light' }) => {
  const getDescriptor = (s: number) => {
    if (s > 90) return { label: 'EXCELLENT', color: 'text-emerald-400' };
    if (s > 70) return { label: 'GOOD', color: 'text-emerald-500' };
    if (s > 40) return { label: 'STABLE', color: 'text-amber-500' };
    return { label: 'CRITICAL', color: 'text-red-500' };
  };
  
  const desc = getDescriptor(score);
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={cn(
      "border p-4 rounded-xl flex items-center shadow-xl transition-all",
      theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
    )}>
      <div className="relative w-20 h-20">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" className={theme === 'dark' ? "text-slate-800" : "text-slate-100"} />
          <circle 
            cx="40" cy="40" r="36" 
            stroke="currentColor" strokeWidth="6" 
            fill="transparent" 
            strokeDasharray={circumference} 
            strokeDashoffset={offset} 
            className="text-emerald-500 transition-all duration-1000"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-xl font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>{score}</span>
        </div>
      </div>
      <div className="ml-4">
        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Health Score</p>
        <p className={cn("text-lg font-bold uppercase italic tracking-tighter", desc.color)}>{desc.label}</p>
        <p className={cn("text-xs font-medium", theme === 'dark' ? "text-slate-600" : "text-slate-400")}>Global Health</p>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'logs' | 'alerts' | 'settings' | 'users'>('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [history, setHistory] = useState<SystemStats[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [thresholds, setThresholds] = useState({ cpu: 80, mem: 85, disk: 90 });
  const [notification, setNotification] = useState<{message: string, type: string} | null>(null);

  // New States for Features
  const [processes, setProcesses] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // User Management State
  const [usersList, setUsersList] = useState<any[]>([]);

  // Auth Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setIsLoggedIn(true);
        localStorage.setItem('token', data.token);
      } else {
        alert('Wrong username or password');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
  };

  // Data Fetching
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchData = async () => {
      try {
        const statsRes = await fetch('/api/system/stats');
        const statsData = await statsRes.json();
        setStats(statsData);
        setHistory(prev => [...prev.slice(-19), statsData]);

        const alertsRes = await fetch('/api/alerts');
        setAlerts(await alertsRes.json());

        const procRes = await fetch('/api/system/processes');
        if (procRes.ok) setProcesses(await procRes.json());
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  useEffect(() => {
    if (currentPage === 'logs' && isLoggedIn) {
      fetch('/api/logs').then(res => res.json()).then(setLogs);
    }
    if (currentPage === 'users' && isLoggedIn && user?.role === 'admin') {
      fetchUsers();
    }
    if (currentPage === 'settings' && isLoggedIn) {
        fetch('/api/settings').then(res => res.json()).then(data => {
            const mapped = data.reduce((acc: any, curr: any) => ({...acc, [curr.key.split('_')[0]]: curr.value}), {});
            setThresholds({ cpu: parseInt(mapped.cpu), mem: parseInt(mapped.mem), disk: parseInt(mapped.disk) });
        });
    }
    if (currentPage === 'audit' && isLoggedIn && user?.role === 'admin') {
      fetch('/api/audit-logs', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => res.json()).then(setAuditLogs);
    }
  }, [currentPage, isLoggedIn]);

  const resolveAlert = async (id: number) => {
    await fetch('/api/alerts/resolve', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ id })
    });
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setUsersList(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const saveSettings = async () => {
      await fetch('/api/settings', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
              cpu_threshold: thresholds.cpu,
              mem_threshold: thresholds.mem,
              disk_threshold: thresholds.disk
          })
      });
      setNotification({ message: 'Settings saved successfully!', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const res = await fetch('/api/system/backup', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        setNotification({ message: 'System backup completed!', type: 'success' });
      }
    } catch (err) {
      setNotification({ message: 'Backup failed!', type: 'error' });
    } finally {
      setIsBackingUp(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-emerald-500/30">
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-slate-900 border border-slate-800 p-8 rounded-xl shadow-2xl relative overflow-hidden"
        >
          {/* Decorative scanner line simulation */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
          
          <div className="flex flex-col items-center mb-8 gap-4">
            <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
              <ShieldAlert className="w-8 h-8 text-emerald-500" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-black text-white uppercase italic tracking-tighter">Login</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1 border-t border-slate-800 pt-1">Please enter your details to continue</p>
            </div>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-2.5 text-xs text-white focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-700 font-mono"
                placeholder="Your username"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-2.5 text-xs text-white focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-700 font-mono"
                placeholder="Your password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded text-[11px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
            >
              Sign In
            </button>
            <div className="flex justify-between items-center text-[9px] text-slate-600 uppercase font-black tracking-tighter mt-4">
                <span>Roohan (Admin) / Manahil (Viewer)</span>
                <span className="text-slate-800">|</span>
                <span>Port: 3000</span>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  const getHealthScore = () => {
    if (!stats) return { label: 'Analyzing...', color: 'text-slate-400' };
    const avg = (stats.cpu + stats.memory + stats.disk) / 3;
    if (avg > 80) return { label: 'Critical', color: 'text-red-500', icon: XCircle };
    if (avg > 60) return { label: 'Warning', color: 'text-amber-500', icon: AlertTriangle };
    return { label: 'Optimal', color: 'text-emerald-400', icon: CheckCircle2 };
  };

  const health = getHealthScore();

  const formatBytes = (bytes: number | undefined) => {
    if (bytes === undefined || bytes === null || isNaN(bytes) || bytes < 0) return '---';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.max(0, Math.floor(Math.log(bytes) / Math.log(k)));
    if (i >= sizes.length) return '---';
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={cn(
      "min-h-screen flex overflow-hidden selection:bg-emerald-500/30 transition-colors duration-300",
      theme === 'dark' ? "bg-slate-950 text-slate-200" : "bg-slate-50 text-slate-900"
    )}>
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside 
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            className={cn(
              "w-60 border-r flex flex-col h-screen sticky top-0 z-50 transition-all duration-300",
              theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xl"
            )}
          >
            <div className={cn("p-6 border-b", theme === 'dark' ? "border-slate-800" : "border-slate-100")}>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center text-slate-950 font-black shadow-[0_0_15px_rgba(16,185,129,0.3)]">Σ</div>
                <span className={cn("text-lg font-bold tracking-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>System<span className="text-amber-500 font-medium">Health</span></span>
              </div>
            </div>

            <nav className="flex-1 py-4 px-3 space-y-1">
              <SidebarItem 
                icon={LayoutDashboard} 
                label="Dashboard" 
                active={currentPage === 'dashboard'} 
                onClick={() => setCurrentPage('dashboard')} 
              />
              <SidebarItem 
                icon={History} 
                label="Audit Trail" 
                active={currentPage === 'audit'} 
                onClick={() => setCurrentPage('audit')} 
              />
              <SidebarItem 
                icon={ClipboardList} 
                label="Logs" 
                active={currentPage === 'logs'} 
                onClick={() => setCurrentPage('logs')} 
              />
              <SidebarItem 
                icon={Bell} 
                label="Alerts" 
                active={currentPage === 'alerts'} 
                onClick={() => setCurrentPage('alerts')}
                count={alerts.length}
              />
              {user?.role === 'admin' && (
                <SidebarItem 
                  icon={UsersIcon} 
                  label="Manage Users" 
                  active={currentPage === 'users'} 
                  onClick={() => setCurrentPage('users')} 
                />
              )}
              <SidebarItem 
                icon={Settings} 
                label="Settings" 
                active={currentPage === 'settings'} 
                onClick={() => setCurrentPage('settings')} 
              />
            </nav>

            <div className="p-4 border-t border-slate-800">
              <div className="flex items-center bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/30 mb-3">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex-shrink-0 flex items-center justify-center text-slate-900 font-bold shadow-lg shadow-amber-500/10">
                  {user?.username[0].toUpperCase()}
                </div>
                <div className="ml-3 overflow-hidden">
                  <p className="text-sm font-semibold text-white truncate">{user?.username || 'Admin User'}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{user?.role || 'Root Authority'}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all font-bold text-[10px] uppercase tracking-widest border border-transparent hover:border-red-400/20"
              >
                <LogOut className="w-3.5 h-3.5" />
                Terminate Session
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className={cn(
          "h-16 border-b flex items-center justify-between px-8 z-40 backdrop-blur-sm",
          theme === 'dark' ? "bg-slate-900/50 border-slate-800" : "bg-white/80 border-slate-200"
        )}>
          <div className="flex items-center space-x-8">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={cn("p-1.5 rounded transition-colors", theme === 'dark' ? "hover:bg-slate-800 text-slate-500" : "hover:bg-slate-100 text-slate-600")}
            >
              {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className={cn("w-2 h-2 rounded-full", health.label === 'Optimal' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500 animate-pulse")}></div>
                <span className={cn("text-[10px] font-bold uppercase tracking-widest", (health.label === 'Optimal' && theme === 'dark') ? "text-emerald-500" : (health.label === 'Optimal' ? "text-emerald-600" : "text-amber-500"))}>
                  Server: {health.label === 'Optimal' ? 'Online' : health.label}
                </span>
              </div>
              <div className={cn("text-[10px] uppercase font-bold tracking-widest", theme === 'dark' ? "text-slate-500" : "text-slate-400")}>
                Uptime: <span className={cn("font-normal", theme === 'dark' ? "text-slate-300" : "text-slate-600")}>{(stats?.uptime ? stats.uptime / 3600 : 0).toFixed(1)}h</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={cn(
                "p-2 rounded-lg transition-all active:scale-95",
                theme === 'dark' ? "bg-slate-800 text-amber-500 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
             <a 
               href={`/api/reports/csv?token=${localStorage.getItem('token')}`} 
               className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black rounded transition-all active:scale-95 shadow-lg shadow-emerald-600/10 uppercase tracking-widest"
             >
              Download Report (CSV)
            </a>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              {currentPage === 'dashboard' && (
                <motion.div 
                  key="dashboard"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-6"
                >
                  {/* Top Row: Global Health & Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <SystemScoreGauge theme={theme} score={stats ? Math.round(stats.healthScore) : 92} />
                    <StatCard theme={theme} label="CPU Usage" value={stats?.cpu || 0} unit="%" icon={Cpu} colorClass="text-emerald-500" subtitle={stats ? `${stats.cpuModel} (${stats.cpuSpeed} GHz)` : "Analyzing..."} />
                    <StatCard theme={theme} label="Memory (RAM)" value={stats?.memory || 0} unit="%" icon={Database} colorClass="text-amber-500" subtitle={stats && stats.totalMem ? `${formatBytes((stats.memory * stats.totalMem) / 100)} / ${formatBytes(stats.totalMem)}` : "Analyzing..."} />
                    <StatCard theme={theme} label="Disk Storage" value={stats?.disk || 0} unit="%" icon={HardDrive} colorClass="text-emerald-500" subtitle={stats && stats.totalDisk && stats.totalDisk > 0 ? `${formatBytes((stats.disk * stats.totalDisk) / 100)} / ${formatBytes(stats.totalDisk)}` : "Ephemeral/Overlay Storage"} />
                  </div>

                  {/* Mid Row: Trend & Alerts */}
                  <div className="grid grid-cols-3 gap-6">
                    <Card theme={theme} className="col-span-2 p-6 flex flex-col">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className={cn("text-[10px] font-black tracking-widest uppercase italic", theme === 'dark' ? "text-white" : "text-slate-800")}>Performance and Health History</h2>
                        <div className="flex items-center space-x-4 text-[9px] uppercase font-bold tracking-tighter">
                          <span className="flex items-center text-emerald-400 opacity-80"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div> CPU</span>
                          <span className="flex items-center text-amber-500 opacity-80"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5 shadow-[0_0_5px_rgba(245,158,11,0.5)]"></div> RAM</span>
                          <span className="flex items-center text-purple-500 opacity-80"><div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5 shadow-[0_0_5px_rgba(168,85,247,0.5)]"></div> Health</span>
                        </div>
                      </div>
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={history}>
                            <defs>
                              <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" strokeOpacity={0.4} />
                            <XAxis dataKey="timestamp" hide />
                            <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '4px', fontSize: '10px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                              itemStyle={{ color: '#f8fafc', padding: '1px 0' }}
                            />
                            <Area type="monotone" dataKey="cpu" name="CPU" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" animationDuration={1500} />
                            <Area type="monotone" dataKey="memory" name="RAM" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorMem)" animationDuration={1500} />
                            <Area type="monotone" dataKey="healthScore" name="Health" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorHealth)" animationDuration={1500} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-between mt-4 text-[9px] text-slate-600 uppercase font-bold tracking-widest border-t border-slate-800 pt-3">
                        <span>Past 60 Seconds</span><span className="text-emerald-500">Live</span>
                      </div>
                    </Card>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-full shadow-xl">
                      <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
                         <h2 className="text-[10px] font-black text-white uppercase tracking-widest italic">Critical Incidents</h2>
                         <span className="text-[9px] text-slate-500 font-bold">NODE: S-07</span>
                      </div>
                      <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
                        {alerts.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full opacity-30 p-8 text-center">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Sector Silent</p>
                          </div>
                        ) : (
                          alerts.map(alert => (
                            <div key={alert.id} className={cn(
                              "border-l-2 p-3 rounded transition-colors group relative",
                              alert.severity === 'Critical' ? "bg-red-500/10 border-red-500" : "bg-amber-500/10 border-amber-500"
                            )}>
                              <div className="flex justify-between items-start">
                                <p className={cn("text-[10px] font-black uppercase tracking-tighter", alert.severity === 'Critical' ? "text-red-400" : "text-amber-400")}>
                                  {alert.type} Fault
                                </p>
                                <span className="text-[8px] text-slate-600 font-mono italic">{new Date(alert.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>
                              <p className="text-[11px] text-slate-300 mt-1 leading-tight">{alert.message}</p>
                              <button 
                                onClick={() => resolveAlert(alert.id)}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 p-1 rounded border border-slate-800 hover:text-emerald-400"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Advanced Insights */}
                  <div className="grid grid-cols-3 gap-6">
                       {/* Process Monitor (Intermediate 5) */}
                       <Card theme={theme} className="col-span-2 p-0 overflow-hidden flex flex-col">
                          <div className={cn("px-4 py-3 border-b flex justify-between items-center", theme === 'dark' ? "bg-slate-800/20 border-slate-800" : "bg-slate-50 border-slate-100")}>
                             <h2 className={cn("text-[10px] font-black uppercase tracking-widest italic", theme === 'dark' ? "text-white" : "text-slate-800")}>Top Processes</h2>
                             <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Live Load</span>
                          </div>
                          <div className="flex-1 overflow-x-auto custom-scrollbar">
                             <table className="w-full text-left">
                                <thead className={cn("text-[8px] uppercase font-bold tracking-[0.2em] border-b", theme === 'dark' ? "text-slate-500 border-slate-800" : "text-slate-400 border-slate-100")}>
                                   <tr>
                                      <th className="px-6 py-2">Process Name</th>
                                      <th className="px-4 py-2">PID</th>
                                      <th className="px-4 py-2">Status</th>
                                      <th className="px-4 py-2 text-right">CPU %</th>
                                      <th className="px-4 py-2 text-right">MEM %</th>
                                   </tr>
                                </thead>
                                <tbody className={cn("text-[10px] divide-y leading-none", theme === 'dark' ? "divide-slate-800/40" : "divide-slate-100")}>
                                   {processes.map((p, i) => (
                                      <tr key={i} className={cn("transition-colors", theme === 'dark' ? "hover:bg-slate-800/10" : "hover:bg-slate-50")}>
                                         <td className="px-6 py-2.5 font-bold text-emerald-500">{p.name || 'System Task'}</td>
                                         <td className="px-4 py-2.5 font-mono text-slate-500">{p.pid}</td>
                                         <td className="px-4 py-2.5">
                                            <span className="px-1.5 py-0.5 rounded-[2px] bg-emerald-500/10 text-emerald-500 text-[8px] uppercase font-black">Active</span>
                                         </td>
                                         <td className={cn("px-4 py-2.5 text-right font-mono", theme === 'dark' ? "text-slate-300" : "text-slate-600")}>{(p.cpu ?? 0).toFixed(1)}%</td>
                                         <td className={cn("px-4 py-2.5 text-right font-mono", theme === 'dark' ? "text-slate-300" : "text-slate-600")}>{(p.mem ?? 0).toFixed(1)}%</td>
                                      </tr>
                                   ))}
                                   {processes.length === 0 && (
                                     <tr>
                                       <td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic opacity-50">Polling process table...</td>
                                     </tr>
                                   )}
                                </tbody>
                             </table>
                          </div>
                       </Card>

                       {/* Recent Activity Summary */}
                       <div className={cn("border rounded-xl shadow-xl flex flex-col", theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm")}>
                          <div className={cn("px-4 py-3 border-b flex justify-between items-center", theme === 'dark' ? "bg-slate-800/20 border-slate-800" : "bg-slate-100 border-slate-100")}>
                             <h2 className={cn("text-[10px] font-black uppercase tracking-widest italic", theme === 'dark' ? "text-white" : "text-slate-800")}>Global Activity</h2>
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                          </div>
                          <div className="flex-1 p-4 space-y-3 overflow-hidden">
                             {logs.slice(0, 5).map(log => (
                               <div key={log.id} className={cn("flex items-center justify-between border-b pb-2 last:border-0", theme === 'dark' ? "border-slate-800/50" : "border-slate-100")}>
                                  <div className="overflow-hidden">
                                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter truncate">{new Date(log.timestamp).toLocaleTimeString()}</p>
                                     <p className={cn("text-[11px] font-medium truncate", theme === 'dark' ? "text-slate-300" : "text-slate-700")}>Log-ID: {log.id}</p>
                                  </div>
                                  <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest flex-shrink-0", log.status === 'Warning' ? "text-amber-500 bg-amber-500/10" : "text-emerald-500 bg-emerald-500/10")}>
                                     {log.status === 'Warning' ? 'A-ALERT' : 'NORMAL'}
                                  </span>
                               </div>
                             ))}
                          </div>
                          <button onClick={() => setCurrentPage('logs')} className={cn("p-3 text-[9px] uppercase font-black transition-colors border-t", theme === 'dark' ? "text-slate-500 hover:text-emerald-500 border-slate-800/50" : "text-slate-400 hover:text-emerald-600 border-slate-100")}>Access Journal</button>
                       </div>
                  </div>
                </motion.div>
              )}

            {currentPage === 'logs' && (
              <motion.div 
                key="logs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className={cn("text-xl font-black italic tracking-tighter uppercase", theme === 'dark' ? "text-white" : "text-slate-900")}>Telemetry Journal</h1>
                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] mt-1">Immutable ledger of state transitions</p>
                    </div>
                </div>
                <div className={cn(
                  "border rounded-xl overflow-hidden shadow-2xl shadow-slate-950/50",
                  theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                )}>
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={cn("text-[10px] font-black uppercase tracking-widest border-b", theme === 'dark' ? "bg-slate-800/50 text-slate-500 border-slate-800" : "bg-slate-50 text-slate-400 border-slate-100")}>
                          <th className="px-6 py-3 font-mono">ID</th>
                          <th className="px-6 py-3">Core Load</th>
                          <th className="px-6 py-3">Memory Res</th>
                          <th className="px-6 py-3 text-center">Descriptor</th>
                          <th className="px-6 py-3 text-right">Anchor Time</th>
                        </tr>
                      </thead>
                      <tbody className={cn("divide-y text-xs", theme === 'dark' ? "divide-slate-800/40 text-slate-300" : "divide-slate-100 text-slate-700")}>
                        {logs.map((log) => (
                          <tr key={log.id} className={cn("transition-colors", theme === 'dark' ? "hover:bg-slate-800/20" : "hover:bg-slate-50")}>
                            <td className="px-6 py-3 font-mono text-slate-500 text-[10px]">{log.id.toString().padStart(5, '0')}</td>
                            <td className="px-6 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1 bg-slate-800/20 rounded-full overflow-hidden">
                                    <div className={cn("h-full", log.cpu > 80 ? "bg-red-500" : "bg-emerald-500")} style={{width: `${log.cpu}%`}}></div>
                                  </div>
                                  <span className={cn("font-bold text-[10px]", log.cpu > 80 ? "text-red-500" : (theme === 'dark' ? "text-emerald-400" : "text-emerald-600"))}>
                                      {log.cpu}%
                                  </span>
                                </div>
                            </td>
                            <td className={cn("px-6 py-3 font-medium", theme === 'dark' ? "text-slate-400" : "text-slate-500")}>{log.memory}%</td>
                            <td className="px-6 py-3 text-center">
                                <span className={cn(
                                    "px-2 py-0.5 rounded-[2px] text-[8px] font-black uppercase tracking-widest",
                                    log.status === 'Warning' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                )}>
                                    {log.status}
                                </span>
                            </td>
                            <td className="px-6 py-3 text-[10px] text-slate-500 font-mono text-right italic">{new Date(log.timestamp).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {currentPage === 'alerts' && (
              <motion.div 
                key="alerts"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div>
                    <h1 className={cn("text-xl font-black italic tracking-tighter uppercase", theme === 'dark' ? "text-white" : "text-slate-900")}>Anomalies Detected</h1>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] mt-1">Real-time alerts requiring immediate attention</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {alerts.length === 0 ? (
                    <div className={cn(
                      "border border-dashed rounded-xl p-16 flex flex-col items-center justify-center text-center",
                      theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"
                    )}>
                        <CheckCircle2 className="w-10 h-10 text-emerald-500/30 mb-4" />
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Sector Nominal</h3>
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <motion.div
                        layout
                        key={alert.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                            "group p-4 rounded-xl border flex items-center justify-between transition-all duration-300 relative overflow-hidden",
                            alert.severity === 'Critical' 
                                ? (theme === 'dark' ? "bg-red-500/5 border-red-500/20" : "bg-red-50 border-red-100")
                                : (theme === 'dark' ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50 border-amber-100")
                        )}
                      >
                        <div className="flex items-center gap-5">
                            <div className={cn("p-2.5 rounded-lg shadow-inner", alert.severity === 'Critical' ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500")}>
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={cn("text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded", alert.severity === 'Critical' ? "bg-red-500/20 text-red-500" : "bg-amber-500/20 text-amber-500")}>
                                        {alert.severity} FAULT
                                    </span>
                                    <span className="text-[9px] text-slate-500 font-mono italic">{new Date(alert.timestamp).toLocaleString()}</span>
                                </div>
                                <h3 className={cn("text-sm font-bold uppercase tracking-tight", theme === 'dark' ? "text-slate-100" : "text-slate-800")}>{alert.message}</h3>
                            </div>
                        </div>
                        <button 
                          onClick={() => resolveAlert(alert.id)}
                          className={cn(
                            "border hover:border-emerald-500 hover:text-emerald-500 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl",
                            theme === 'dark' ? "bg-slate-950 border-slate-800 text-slate-500 shadow-slate-950/50" : "bg-white border-slate-200 text-slate-400 shadow-slate-200/50"
                          )}
                        >
                          Resolve Node
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {currentPage === 'users' && user?.role === 'admin' && (
              <UserManagementView 
                users={usersList} 
                onRefresh={() => fetchUsers()} 
                setNotification={setNotification}
                theme={theme}
              />
            )}

            {currentPage === 'audit' && user?.role === 'admin' && (
              <motion.div 
                key="audit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div>
                    <h1 className={cn("text-xl font-black italic tracking-tighter uppercase", theme === 'dark' ? "text-white" : "text-slate-900")}>Audit Trail</h1>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] mt-1">Immutable ledger of user actions and system changes</p>
                </div>
                <div className={cn(
                  "border rounded-xl overflow-hidden shadow-2xl",
                  theme === 'dark' ? "bg-slate-900 border-slate-800 shadow-slate-950/50" : "bg-white border-slate-200"
                )}>
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={cn("text-[10px] font-black uppercase tracking-widest border-b", theme === 'dark' ? "bg-slate-800/50 text-slate-500 border-slate-800" : "bg-slate-50 text-slate-400 border-slate-100")}>
                          <th className="px-6 py-3 font-mono">Timestamp</th>
                          <th className="px-6 py-3">Operator</th>
                          <th className="px-6 py-3">Action</th>
                          <th className="px-6 py-3">Outcome / Details</th>
                        </tr>
                      </thead>
                      <tbody className={cn("divide-y text-xs", theme === 'dark' ? "divide-slate-800/40 text-slate-300" : "divide-slate-100 text-slate-700")}>
                        {auditLogs.length === 0 ? (
                           <tr>
                             <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic opacity-50">No security events recorded.</td>
                           </tr>
                        ) : (
                          auditLogs.map((log) => (
                            <tr key={log.id} className={cn("transition-colors", theme === 'dark' ? "hover:bg-slate-800/20" : "hover:bg-slate-50")}>
                              <td className="px-6 py-3 font-mono text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                              <td className="px-6 py-3 font-bold flex items-center gap-2">
                                 <div className={cn("w-6 h-6 rounded flex items-center justify-center text-[10px] font-black", log.username === 'System' ? "bg-slate-800 text-slate-500 border border-slate-700" : "bg-emerald-500 text-slate-950")}>
                                    {log.username.charAt(0)}
                                 </div>
                                 {log.username}
                              </td>
                              <td className="px-6 py-3 font-medium">
                                 <span className={cn(
                                   "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                                   log.action === 'User login' ? "text-emerald-400 bg-emerald-500/10" : 
                                   log.action === 'Backup performed' ? "text-blue-400 bg-blue-500/10" :
                                   log.action === 'Settings changed' ? "text-amber-400 bg-amber-500/10" :
                                   "text-slate-400 bg-slate-500/10"
                                 )}>
                                   {log.action}
                                 </span>
                              </td>
                              <td className="px-6 py-3 text-slate-400 text-[10px] italic">{log.details}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

             {currentPage === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-2xl mx-auto space-y-8 pb-12"
              >
                <div>
                    <h1 className={cn("text-xl font-black italic tracking-tighter uppercase", theme === 'dark' ? "text-white" : "text-slate-900")}>Settings</h1>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] mt-1">Control how the system works</p>
                </div>
                
                <div className="space-y-6">
                    <Card theme={theme} title="Thresholds" icon={Settings}>
                        <div className="space-y-8 pt-4">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                                        CPU Alert Limit
                                    </label>
                                    <span className="text-xs font-mono text-emerald-500 border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 rounded">{thresholds.cpu}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="50" max="95" step="1"
                                    value={thresholds.cpu}
                                    onChange={(e) => setThresholds({...thresholds, cpu: parseInt(e.target.value)})}
                                    className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                />
                                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tight italic">Sends a high priority alert when CPU goes over this limit.</p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]"></div>
                                        Memory Alert Limit
                                    </label>
                                    <span className="text-xs font-mono text-amber-500 border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 rounded">{thresholds.mem}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="50" max="95" step="1"
                                    value={thresholds.mem}
                                    onChange={(e) => setThresholds({...thresholds, mem: parseInt(e.target.value)})}
                                    className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                />
                                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tight italic">Sends a warning when memory usage is too high.</p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                                        Disk Space Alert
                                    </label>
                                    <span className="text-xs font-mono text-slate-400 border border-slate-700 bg-slate-800/50 px-2 py-0.5 rounded">{thresholds.disk}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="70" max="98" step="1"
                                    value={thresholds.disk}
                                    onChange={(e) => setThresholds({...thresholds, disk: parseInt(e.target.value)})}
                                    className="w-full accent-slate-600 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                />
                                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tight italic">Notifies when disk space is running low.</p>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
                            <span className="text-[8px] text-slate-600 font-black uppercase tracking-[0.3em]">Pending Sync: {thresholds.cpu}-{thresholds.mem}-{thresholds.disk}</span>
                            <button 
                                onClick={saveSettings}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-2 rounded text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
                            >
                                Save Settings
                            </button>
                        </div>
                    </Card>

                    <Card title="Security" icon={ShieldAlert} theme={theme}>
                        <div className="flex items-center justify-between py-2 border-b border-slate-800 pb-4 mb-4">
                           <div>
                              <p className={cn("text-[11px] font-bold uppercase", theme === 'dark' ? "text-slate-100" : "text-slate-800")}>System Maintenance Backup</p>
                              <p className="text-[10px] text-slate-500 italic mt-1">Snapshot of current system state and databases</p>
                           </div>
                           <button 
                             onClick={handleBackup}
                             disabled={isBackingUp}
                             className={cn(
                               "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                               isBackingUp ? "opacity-50 cursor-wait" : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg active:scale-95 shadow-emerald-900/20"
                             )}
                           >
                             {isBackingUp ? 'Backing up...' : 'Perform Backup'}
                           </button>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded border border-slate-800">
                                <span className={cn("text-[10px] font-bold uppercase tracking-wider", theme === 'dark' ? "text-slate-400" : "text-slate-600")}>Login Security</span>
                                <div className="w-8 h-4 bg-emerald-600/20 border border-emerald-500/30 rounded-full relative">
                                    <div className="absolute right-0.5 top-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded border border-slate-800 opacity-50">
                                <span className={cn("text-[10px] font-bold uppercase tracking-wider", theme === 'dark' ? "text-slate-400" : "text-slate-600")}>Daily Log Cleanup</span>
                                <div className="w-8 h-4 bg-slate-800 rounded-full relative">
                                    <div className="absolute left-0.5 top-0.5 w-2.5 h-2.5 bg-slate-600 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Global Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="fixed bottom-8 right-8 bg-emerald-500 text-slate-900 font-bold px-6 py-4 rounded-3xl shadow-2xl z-[100] flex items-center gap-3 border border-emerald-400/50"
            >
              <CheckCircle2 className="w-6 h-6" />
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
