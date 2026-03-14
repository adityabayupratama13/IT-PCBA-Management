# IT Management System - Technical Documentation

## Overview
The IT Management System is a comprehensive, internal dashboard application engineered to manage and streamline the operations of the IT department at GIKEN. Designed with a modern, glassmorphism-inspired UI ("Gemini Banana"), the platform centralizes tasks, scheduling, project tracking, asset management, automated attendance, and daily reporting.

---

## 🚀 Key Features and Modules

### 1. Dashboard
- **Real-Time Analytics:** View key metrics such as Open Tickets, Overdue Tasks, Active Projects, and Present Team Members at a glance.
- **Glassmorphism Design:** All metric cards employ a highly legible 'glass' design that operates beautifully across both Dark and Light modes.

### 2. Team Management
- **Member Profiles:** View, add, edit, and delete comprehensive profiles for the IT Staff.
- **Job Profiles Integration:** Interactive data tables displaying member details, which expand (on row click) to reveal linked Position Descriptions.

### 3. Positions (Jabatan)
- **Position Matrix:** Central registry for standard job titles and responsibilities.
- **Job Descriptions Expansion:** Expand rows to examine individual job descriptions complete with auto-tracking timestamps of creation/modification dates.

### 4. Attendance (Shift Roster & Overtime)
- **Automated Scheduling:** Visual, interactive weekly roster to assign physical attendance, off days, leaves, and various shift sequences. Add 'Copy to Next Week' capabilities with Auto-Rotate parameters (Shift 1 -> 2 -> 3).
- **Overtime Tracker:** Accurate computation of 'Jam Mati' (Physical Hours tracked between start and finish) and 'Jam Hidup' (Paid Hours) multiplied conditionally based on organizational hierarchies (Grade M/S vs Grade L).
- **Public Holidays Integration:** Automatic mapping of the Indonesian National Holidays Calendar to shift assignment logic to proactively block normal scheduling.
- **Leave Operations:** Fully governed leave tracker capable of automatically modifying the worker's roster statuses upon approval, rejecting operations automatically based on user roles, and managing rolling vacation thresholds (e.g., fractional 0.5 dates supported). 

### 5. Tickets & Tasks (Kanban)
- **Central IT Ticketing System:** Capture reports from external members/entities with automated routing logic. 
- **Automated Alerts:** Stale task/ticket warnings triggering 🔴 alerts if not resolved within 24 hours.
- **Resolution & Problem Solving Field:** Enhanced textual metadata + file attachments (PDF/Images/Excel) capabilities allowing IT members to deposit root-cause analyses on closed tasks.
- **Daily Check:** A specialized 'Daily Filter' initialized by default to capture all today's assignments + past overdue/stale threads.

### 6. Projects & Schedule
- **Bi-Directional Event Binding:** Whenever an administrator defines a "Project Start" and "End" date in the App, the system automatically translates those data points into dedicated blocks mapped cleanly on the broader IT Calendar (Schedule). 

### 7. Daily & Audit Logs
- **Daily Logs:** Keep a centralized ledger recording manual logging entries, along with programmatic updates synced bidirectionally from the ticketing subsystem.
- **Audit Logging:** System-level tracing ledger highlighting when users CREATE, UPDATE, or DELETE mission-critical components guaranteeing strict internal transparency.

---

## 🛠️ Technology Stack
- **Framework:** [Next.js 14](https://nextjs.org/) (App Router format for optimized API endpoints and frontend chunking)
- **Language:** TypeScript 
- **Styling Framework:** Tailwind CSS with custom CSS variables (Root context definitions permitting zero-Flash Dark/Light switching).
- **Data Persistence:** SQLite locally integrated using `better-sqlite3`.
- **Date Handlers:** `date-fns` and specialized date-picker components for dynamic constraints processing. 
- **Components:** `lucide-react` (iconography), Context API (Authentication wrappers handling secure route protections), `React-Dropzone` (FileUpload interfaces).
- **Export Formats:** Dedicated hooks generating outputs for `.xlsx` utilizing `xlsx` and `.pdf` constructs executing via `jspdf` & `jspdf-autotable`.

---

## 🔐 Authentication & Security Structure
Access is governed fundamentally by a localized authentication system mapping numerical employee **Badge Numbers**. 
- The initial login gate (Split-Pane GIKEN Layout) hides internal module routings leveraging Next.js contexts until authorization is validated.
- **Role Scoping:** Actions such as Overtime Deletions, Leave Approvals, and certain destructive modifications execute strictly against the logged-in user's rank status (`Supervisor`/`Manager` vs `Member`).

---

## 🏗️ Getting Started (Deployment Build)

**1. Install Dependencies:**
```bash
npm install
```

**2. Setup Environment Databases:**
Run the standard Next API to instantiate standard local `data.db` schemas locally:
```bash
npm run dev
```

**3. Build For Production:**
Builds highly compacted static chunks optimizing navigation transitions. (Note: Disable standard eager Next `Link` prefetch triggers to eliminate DB resource starvation on massive matrix views, like `/attendance` and `/team` tables).
```bash
npm run build && npm start
```
