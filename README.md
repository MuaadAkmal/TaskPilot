# TaskPilot ✈️

**TaskPilot** is an enterprise multi-project incident resolution, task management, and operational knowledge copilot platform.

## Features

- 📁 **Multi-Project Workspaces**: Select projects (`CMS VAL&FS`, `ASR`, `CIAS`) from the global header selector.
- ⚡ **Inline Resolution Form**: Top-of-table incident capture with **`Ctrl + Enter`** shortcut.
- 📊 **Interactive Data Table**: 8 records per page, sorting, multi-column search, date filtering, and row edit modals.
- 📄 **Export Engine**: Instant CSV download (Filtered / All) and formatted PDF Incident Reports.
- 🤖 **Google ADK Diagnostic Studio (`/agent`)**: Dedicated AI reasoning assistant that searches historical resolutions and SOPs scoped strictly to the selected project.
- 💬 **Copilot Side-Drawer**: Quick floating assistant on the main dashboard.
- 📬 **Team Email Broadcasts**: Resend API alerts sent to project team members upon new task creation.
- 🔐 **Authentication & DB**: Clerk Auth + Supabase (PostgreSQL with `pgvector`) & Prisma ORM.

## Quick Start

### 1. Web Application (Next.js 16)

```bash
cd apps/web
npm install
npm run dev
```

Visit `http://localhost:3000`

### 2. Google ADK Agent Microservice (Python)

```bash
cd apps/agent-service
pip install -r requirements.txt
python server.py
```
