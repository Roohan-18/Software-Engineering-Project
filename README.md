# System Health Dashboard

A real-time system monitoring dashboard built with React, TypeScript, and Node.js.

## 👥 Team Members
- Roohan (Admin)
- Manahil (Viewer)

## 🚀 Live Links
- **Frontend (Vercel):** https://software-engineering-project-ruddy.vercel.app
- **Backend (Railway):** https://software-engineering-project-production-baa4.up.railway.app
- **GitHub:** https://github.com/Roohan-18/Software-Engineering-Project

## 🛠️ Technologies Used
- React + TypeScript (Frontend)
- Node.js + Express (Backend)
- SQLite (Database)
- Vite (Build Tool)
- JWT Authentication

## ⚙️ How to Run Locally
1. Install dependencies: `npm install`
2. Set `GEMINI_API_KEY` in `.env.local`
3. Run: `npm run dev`

## 🧪 Test Cases (SQA)
| Test | Expected | Status |
|------|----------|--------|
| Login with valid credentials | Dashboard opens | ✅ Pass |
| Login with wrong password | Error message | ✅ Pass |
| View system stats | CPU/Memory shown | ✅ Pass |
| Admin can resolve alerts | Alert removed | ✅ Pass |
| CSV report download | File downloads | ✅ Pass |