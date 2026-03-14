# IT PCBA Management System

---

## 1. What is the IT PCBA Management System?
An integrated, end-to-end operational hub engineered natively for the **GIKEN IT Department**. It functions as a complete toolset aiming to optimize internal IT workflows, task prioritization, administrative reporting, and team attendance scaling smoothly using an elegant and dynamic dark-mode enabled interface.

---

## 2. The Problems Solved
Before this system, departments relied heavily on fractured tools—balancing tickets in one app, tracking shifts in massive unmanageable Excel spreadsheets, and losing context across projects and daily reports. 

**This platform unifies everything:**
- Need to approve PTO? Done. 
- Check who is operating Shift 2 today? Visible instantly.
- Calculate complex Overtime Multiplier metrics against 12 variables per grade? Automated and exportable in PDF/Excel format.
- Track stale Helpdesk tickets > 24 Hours? Flagged loudly in Red.

---

## 3. High-Level Architectural Features

* **Sleek & Professional UX:** Deep Dual-Mode Glassmorphism styling creates readable, interactive tables, charts, and data points natively. The login flow immediately reflects a split-pane, brand-compliant internal tool experience. 
* **Data Locality:** Everything is managed cohesively avoiding complex database orchestration overhead, leveraging optimized `better-sqlite3` operations embedded physically alongside the Next.js API boundaries.
* **Bi-directional Mapping:** No more duplicate data entry. If a Project timeline goes live, its duration automatically mirrors across the central Schedule system.

---

## 4. Key Sub-System Spotlights

### 🕒 The Attendance Engine
Arguably the powerhouse of the app. It supports standard timekeeping alongside **Indonesian National Holidays (2026 preloaded)**, manual leave/vacation tracking governed by manager approvals, and an extreme edge-case capable Overtime Tracker translating physical "Jam Mati" hours into compensated "Jam Hidup" structures based exactly on the member's specific structural Grade (e.g. 1.5x, 2.0x multipliers vs Flat 1.0x).

### 🛠️ The Helpdesk Kanban (Tickets & Tasks)
A visual drag/drop interface to oversee ticket status. It features advanced tooling:
*   File attachments + Problem Resolution text fields enabling an interactive knowledge base. 
*   "Daily Filter" auto-locking the display view to today's operations + any uncompleted past incidents.

### 👥 Team & Job Operations 
Interactive profiling mechanisms featuring expandable Modal views holding detailed organizational profiles alongside historically-traced explicit Job Descriptions. 

### 🖨️ Complete Export Authority 
Generate real-time `PDF` and `Excel` operational summaries literally from anywhere—from individual Overtime Tracking records localized cleanly to a specific employee across a 30-day cutout, down to generic ticket outputs.

---

## 5. Technology Foundation
*   **Next.js 14:** Powers the frontend presentation routing and secure backend API connections natively.
*   **Tailwind CSS:** Fully dynamic styling constraints adapting flawlessly between pure-black elements, white backgrounds, and custom gradient overlays via Root variable insertions.
*   **Framer Motion:** Handling micro-transitions natively allowing page-routing jumps to feel native.

---

## 6. Closing Note
The **IT PCBA System** drives a modern narrative inside the corporate sphere—proving that Internal Tooling can be as flawlessly styled, heavily interactive, and computationally powerful as the external systems we create for wide consumer usage. It's a cohesive engine capable of growing endlessly alongside the team.
