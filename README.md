# OMs — Office Management & Notification System

> A comprehensive, role-based office management platform built with React, TypeScript, and Lovable Cloud (Supabase). OMs streamlines employee management, task tracking, leave workflows, attendance, document management, internal messaging, and company-wide announcements — all in one unified interface.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Software Requirements Specification (SRS)](#software-requirements-specification-srs)
   - [Introduction](#1-introduction)
   - [System Description](#2-system-description)
   - [Functional Requirements](#3-functional-requirements)
   - [Non-Functional Requirements](#4-non-functional-requirements)
   - [User Roles & Permissions](#5-user-roles--permissions)
   - [Database Schema](#6-database-schema)
   - [System Architecture](#7-system-architecture)
3. [Tech Stack](#tech-stack)
4. [Getting Started](#getting-started)
5. [Deployment on Vercel](#deployment-on-vercel)
6. [Environment Variables](#environment-variables)
7. [Project Structure](#project-structure)
8. [Testing](#testing)
9. [License](#license)

---

## Project Overview

OMs (Office Management & Notification System) is a full-stack web application designed for small-to-medium organizations to manage their daily office operations digitally. It features a modern, responsive UI with real-time updates, role-based access control, and a comprehensive suite of HR and productivity tools.

**Live URL**: [https://ispoms.lovable.app](https://ispoms.lovable.app)

---

## Software Requirements Specification (SRS)

### 1. Introduction

#### 1.1 Purpose
This document describes the software requirements for OMs, an office management system that digitalizes employee management, attendance tracking, leave management, task management, document management, internal communication, and company announcements.

#### 1.2 Scope
OMs is a browser-based SPA (Single Page Application) that provides:
- Role-based dashboard with KPIs
- Employee directory and management
- Department organization
- Task management with Kanban board
- Attendance tracking (clock in/out)
- Leave request and approval workflows
- Document management with version control
- Real-time internal messaging (channels & DMs)
- Company-wide announcements with targeting and scheduling
- Admin analytics and user management

#### 1.3 Definitions & Acronyms
| Term | Definition |
|------|-----------|
| SPA | Single Page Application |
| RLS | Row-Level Security |
| RBAC | Role-Based Access Control |
| CRUD | Create, Read, Update, Delete |
| KPI | Key Performance Indicator |
| DM | Direct Message |

#### 1.4 References
- React 18 Documentation: https://react.dev
- Supabase Documentation: https://supabase.com/docs
- Tailwind CSS: https://tailwindcss.com/docs
- Vite: https://vitejs.dev

---

### 2. System Description

#### 2.1 System Perspective
OMs is a client-side React application backed by Lovable Cloud (Supabase) for authentication, database, real-time subscriptions, file storage, and edge functions. The system follows a serverless architecture with PostgreSQL as the primary database.

#### 2.2 System Features Summary

| Module | Description |
|--------|-------------|
| **Authentication** | Email/password signup & login, password reset, email verification |
| **Dashboard** | Role-specific KPIs, recent activity, quick actions, upcoming leave |
| **Employee Management** | CRUD operations, department assignment, status tracking |
| **Department Management** | CRUD operations, manager assignment (admin only) |
| **Task Management** | Kanban board, drag-and-drop, priority/status/assignment, department tagging |
| **Attendance** | Clock in/out with location, daily records, team attendance view |
| **Leave Management** | Request submission, admin approval, refer-to-super-admin workflow |
| **Document Management** | Upload, version control, access control (view/edit/admin), department scope |
| **Messaging** | Real-time channels, direct conversations, reply threading |
| **Announcements** | Priority levels, department targeting, scheduling, read tracking, pinning |
| **Admin Panel** | Analytics charts, user management, role assignment |

---

### 3. Functional Requirements

#### 3.1 Authentication (FR-AUTH)
| ID | Requirement |
|----|-------------|
| FR-AUTH-01 | Users shall register with email and password |
| FR-AUTH-02 | Users shall verify email before accessing the system |
| FR-AUTH-03 | Users shall log in with email and password |
| FR-AUTH-04 | Users shall be able to request a password reset via email |
| FR-AUTH-05 | Session management shall use JWT tokens with automatic refresh |
| FR-AUTH-06 | Unauthenticated users shall be redirected to the login page |

#### 3.2 Dashboard (FR-DASH)
| ID | Requirement |
|----|-------------|
| FR-DASH-01 | Display KPI cards: total employees, active tasks, pending leave, today's attendance |
| FR-DASH-02 | Show recent activity feed from all modules |
| FR-DASH-03 | Display quick action buttons for common operations |
| FR-DASH-04 | Show upcoming leave schedule |
| FR-DASH-05 | Display task overview with status breakdown |

#### 3.3 Employee Management (FR-EMP)
| ID | Requirement |
|----|-------------|
| FR-EMP-01 | Admins shall create, edit, and delete employee records |
| FR-EMP-02 | All users shall view the employee directory |
| FR-EMP-03 | Employees shall be filterable by department and status |
| FR-EMP-04 | Employee records shall include: name, email, department, job title, status, hire date, location, phone |
| FR-EMP-05 | Managers shall update employees within their department |

#### 3.4 Department Management (FR-DEPT)
| ID | Requirement |
|----|-------------|
| FR-DEPT-01 | Admins shall create, edit, and delete departments |
| FR-DEPT-02 | Departments shall have a name, description, and optional manager |
| FR-DEPT-03 | Real-time updates for department changes |

#### 3.5 Task Management (FR-TASK)
| ID | Requirement |
|----|-------------|
| FR-TASK-01 | Users shall create tasks with title, description, priority, status, due date, assignee |
| FR-TASK-02 | Tasks shall be displayed in a Kanban board (To Do, In Progress, In Review, Completed) |
| FR-TASK-03 | Users shall drag-and-drop tasks between columns |
| FR-TASK-04 | Tasks shall support priority levels: low, medium, high, urgent |
| FR-TASK-05 | Tasks shall be filterable and searchable |
| FR-TASK-06 | Real-time task updates across all connected clients |

#### 3.6 Attendance (FR-ATT)
| ID | Requirement |
|----|-------------|
| FR-ATT-01 | Employees shall clock in and out with optional location capture |
| FR-ATT-02 | Attendance status types: present, late, remote, half_day, absent |
| FR-ATT-03 | Users shall view their attendance history |
| FR-ATT-04 | Admins/managers shall view team attendance |
| FR-ATT-05 | Attendance records shall include notes |

#### 3.7 Leave Management (FR-LEAVE)
| ID | Requirement |
|----|-------------|
| FR-LEAVE-01 | Employees shall submit leave requests with type, date range, and reason |
| FR-LEAVE-02 | Leave types: Annual, Sick, Personal, etc. (configurable by admin) |
| FR-LEAVE-03 | Admins shall approve or reject leave requests |
| FR-LEAVE-04 | Admins shall refer leave requests to Super Admin for final decision |
| FR-LEAVE-05 | Employees shall view their leave balances and request history |
| FR-LEAVE-06 | Leave status workflow: Pending → Approved/Rejected/Referred |
| FR-LEAVE-07 | Super Admins shall view and act on referred requests |

#### 3.8 Document Management (FR-DOC)
| ID | Requirement |
|----|-------------|
| FR-DOC-01 | Users shall upload documents with title, description, and category |
| FR-DOC-02 | Documents shall support version history |
| FR-DOC-03 | Access control: view, edit, admin levels per user |
| FR-DOC-04 | Documents shall be scoped to departments or marked public |
| FR-DOC-05 | Document status: draft, published, archived |

#### 3.9 Messaging (FR-MSG)
| ID | Requirement |
|----|-------------|
| FR-MSG-01 | Users shall create and join chat channels |
| FR-MSG-02 | Users shall send direct messages to other users |
| FR-MSG-03 | Messages shall update in real-time |
| FR-MSG-04 | Messages shall support reply threading |
| FR-MSG-05 | Channel types: public (visible to all) and private (members only) |

#### 3.10 Announcements (FR-ANN)
| ID | Requirement |
|----|-------------|
| FR-ANN-01 | Admins/managers shall create announcements |
| FR-ANN-02 | Announcements shall have priority: low, normal, high, urgent |
| FR-ANN-03 | Announcements shall target all employees or specific departments |
| FR-ANN-04 | Announcements shall support scheduling (publish at future date) |
| FR-ANN-05 | Announcements shall support expiration dates |
| FR-ANN-06 | Announcements shall be pinnable |
| FR-ANN-07 | Read tracking per user with unread badge count in sidebar |
| FR-ANN-08 | Real-time announcement delivery |

#### 3.11 Admin Panel (FR-ADMIN)
| ID | Requirement |
|----|-------------|
| FR-ADMIN-01 | Display analytics charts (employee distribution, task status, attendance trends) |
| FR-ADMIN-02 | User management table with role assignment |
| FR-ADMIN-03 | Recent activity log across all modules |

---

### 4. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-01 | Performance | Pages shall load within 3 seconds on standard broadband |
| NFR-02 | Scalability | System shall support up to 500 concurrent users |
| NFR-03 | Security | All data access shall be governed by RLS policies |
| NFR-04 | Security | Passwords shall be hashed using bcrypt (handled by Supabase Auth) |
| NFR-05 | Security | Role checks shall use server-side SECURITY DEFINER functions |
| NFR-06 | Availability | 99.9% uptime via Lovable Cloud infrastructure |
| NFR-07 | Usability | Responsive design supporting desktop (1024px+) and mobile (320px+) |
| NFR-08 | Real-time | Changes shall propagate to connected clients within 2 seconds |
| NFR-09 | Browser | Support Chrome, Firefox, Safari, Edge (latest 2 versions) |
| NFR-10 | Accessibility | WCAG 2.1 Level AA compliance for core workflows |

---

### 5. User Roles & Permissions

| Permission | Employee | Admin | Super Admin |
|------------|----------|-------|-------------|
| View dashboard | ✅ | ✅ | ✅ |
| View employees | ✅ | ✅ | ✅ |
| Manage employees | ❌ | ✅ | ✅ |
| Manage departments | ❌ | ✅ | ✅ |
| Create tasks | ✅ | ✅ | ✅ |
| Manage all tasks | ❌ | ✅ | ✅ |
| Submit leave requests | ✅ | ✅ | ✅ |
| Approve leave requests | ❌ | ✅ | ✅ |
| Refer leave to Super Admin | ❌ | ✅ | ❌ |
| Act on referred leave | ❌ | ❌ | ✅ |
| Upload documents | ✅ | ✅ | ✅ |
| Manage all documents | ❌ | ✅ | ✅ |
| Create announcements | ❌ | ✅ | ✅ |
| View admin panel | ❌ | ✅ | ✅ |
| Manage user roles | ❌ | ✅ | ✅ |

---

### 6. Database Schema

#### Tables Overview

| Table | Purpose |
|-------|---------|
| `profiles` | User profile data (name, email, avatar, department) |
| `user_roles` | Role assignments (super_admin, admin, employee) |
| `departments` | Department definitions with manager reference |
| `employees` | Employee records linked to profiles and departments |
| `tasks` | Task items with status, priority, assignment |
| `attendance_records` | Daily clock in/out records |
| `leave_types` | Configurable leave categories |
| `leave_balances` | Per-user leave balance tracking |
| `leave_requests` | Leave request lifecycle with approval workflow |
| `documents` | Document metadata and storage references |
| `document_versions` | Document version history |
| `document_access` | Per-user document access grants |
| `chat_channels` | Chat channel definitions |
| `chat_channel_members` | Channel membership |
| `chat_conversations` | Direct message conversations |
| `chat_conversation_participants` | DM participants |
| `chat_messages` | All chat messages (channels & DMs) |
| `announcements` | Company announcements with targeting |
| `announcement_reads` | Per-user read tracking |

#### Key Enums
- `app_role`: super_admin, admin, employee
- `task_status`: todo, in_progress, in_review, completed
- `task_priority`: low, medium, high, urgent
- `leave_status`: pending, approved, rejected, cancelled
- `attendance_status`: present, late, remote, half_day, absent
- `document_status`: draft, published, archived
- `employee_status`: active, on_leave, inactive
- `announcement_priority`: low, normal, high, urgent
- `access_level`: view, edit, admin

#### Security Functions
- `has_role(_user_id, _role)` — Check if user has a specific role
- `is_admin()` — Check if current user is admin or super_admin
- `is_manager()` — Check if current user manages a department
- `is_staff()` — Check if current user is staff
- `can_access_document(_doc_id, _user_id)` — Document access check
- `can_edit_document(_doc_id, _user_id)` — Document edit check
- `can_view_announcement(_ann_id, _user_id)` — Announcement visibility check
- `can_view_attendance(_record_user_id, _user_id)` — Attendance visibility check
- `get_user_department_id()` — Get current user's department

---

### 7. System Architecture

```
┌─────────────────────────────────────────────────┐
│                   Client (Browser)               │
│  ┌─────────────────────────────────────────────┐ │
│  │         React 18 + TypeScript SPA           │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐│ │
│  │  │  Pages   │ │Components│ │    Hooks      ││ │
│  │  │ (Routes) │ │   (UI)   │ │(Data/Logic)  ││ │
│  │  └────┬─────┘ └────┬─────┘ └──────┬───────┘│ │
│  │       └─────────────┼──────────────┘        │ │
│  │              ┌──────┴──────┐                 │ │
│  │              │  Supabase   │                 │ │
│  │              │   Client    │                 │ │
│  │              └──────┬──────┘                 │ │
│  └─────────────────────┼───────────────────────┘ │
└────────────────────────┼─────────────────────────┘
                         │ HTTPS / WSS
┌────────────────────────┼─────────────────────────┐
│              Lovable Cloud (Supabase)             │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │   Auth   │ │ Realtime │ │    PostgreSQL     │  │
│  │  (JWT)   │ │   (WSS)  │ │  (RLS Policies)  │  │
│  └──────────┘ └──────────┘ └──────────────────┘  │
│  ┌──────────┐ ┌──────────────────────────────┐   │
│  │ Storage  │ │      Edge Functions          │   │
│  │ (Files)  │ │   (Serverless Logic)         │   │
│  └──────────┘ └──────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui, Radix UI |
| **State Management** | TanStack React Query |
| **Routing** | React Router DOM v6 |
| **Drag & Drop** | @hello-pangea/dnd |
| **Charts** | Recharts |
| **Backend** | Lovable Cloud (Supabase) |
| **Database** | PostgreSQL with RLS |
| **Auth** | Supabase Auth (JWT) |
| **Real-time** | Supabase Realtime (WebSocket) |
| **Storage** | Supabase Storage |
| **Deployment** | Lovable / Vercel |

---

## Getting Started

### Prerequisites
- Node.js 18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- npm or bun

### Installation

```bash
# 1. Clone the repository
git clone <YOUR_GIT_URL>

# 2. Navigate to the project
cd <YOUR_PROJECT_NAME>

# 3. Install dependencies
npm install

# 4. Create .env file (see Environment Variables section)
cp .env.example .env

# 5. Start development server
npm run dev
```

The app will be available at `http://localhost:8080`.

---

## Deployment on Vercel

### Step 1: Push to GitHub
Ensure your code is pushed to a GitHub repository.

### Step 2: Import Project on Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Select your GitHub repository
4. Vercel will auto-detect Vite as the framework

### Step 3: Configure Build Settings

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |
| **Node.js Version** | 18.x or 20.x |

### Step 4: Set Environment Variables
In the Vercel dashboard, go to **Settings → Environment Variables** and add:

```
VITE_SUPABASE_URL=https://bytgkbnwzbumxelrhqrs.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ Only use **publishable/anon** keys. Never expose service role keys in frontend environment variables.

### Step 5: Deploy
Click **"Deploy"**. Vercel will:
1. Install dependencies
2. Run `npm run build`
3. Deploy the `dist` folder to their CDN
4. Assign a `.vercel.app` URL

### Step 6: Configure SPA Routing
Create a `vercel.json` file in the project root:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This ensures client-side routing works correctly for all paths.

### Step 7: Custom Domain (Optional)
1. Go to **Settings → Domains** in Vercel
2. Add your custom domain
3. Configure DNS records as instructed by Vercel
4. SSL certificate is provisioned automatically

### Automatic Deployments
Vercel automatically deploys on every push to the `main` branch. Pull requests get preview deployments with unique URLs.

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | ✅ |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | ✅ |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project reference ID | Optional |

---

## Project Structure

```
src/
├── components/
│   ├── admin/          # Admin dashboard components
│   ├── announcements/  # Announcement cards, dialogs
│   ├── attendance/     # Clock in/out, history tables
│   ├── auth/           # Protected route wrapper
│   ├── chat/           # Messaging components
│   ├── dashboard/      # KPI cards, quick actions
│   ├── departments/    # Department CRUD dialogs
│   ├── documents/      # Document management UI
│   ├── employees/      # Employee CRUD dialogs
│   ├── layout/         # DashboardLayout, Header, Sidebar
│   ├── leave/          # Leave request/review components
│   ├── tasks/          # Task cards, Kanban columns, dialogs
│   └── ui/             # shadcn/ui base components
├── contexts/
│   └── AuthContext.tsx  # Authentication state & role management
├── hooks/
│   ├── useAnnouncements.ts  # Announcement CRUD + realtime
│   ├── useAttendance.ts     # Attendance tracking
│   ├── useChat.ts           # Messaging logic
│   ├── useDashboardStats.ts # Dashboard KPI data
│   ├── useDepartments.ts    # Department CRUD + realtime
│   ├── useDocuments.ts      # Document management
│   ├── useEmployees.ts      # Employee CRUD
│   ├── useLeaveManagement.ts # Leave workflow
│   ├── useNotifications.ts  # Notification system
│   ├── useTasks.ts          # Task CRUD + drag-and-drop
│   └── useUserManagement.ts # User role management
├── integrations/
│   └── supabase/
│       ├── client.ts   # Supabase client (auto-generated)
│       └── types.ts    # Database types (auto-generated)
├── pages/              # Route-level page components
├── lib/                # Utility functions
└── main.tsx            # App entry point
```

---

## Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npx vitest --watch
```

---

## License

This project is proprietary software. All rights reserved.
