# UMS Frontend — Angular 17

University Management System Frontend

## Tech Stack
- **Framework**: Angular 17 (Standalone Components)
- **Styling**: SCSS + Bootstrap 5
- **Icons**: Bootstrap Icons
- **Auth**: JWT (stored in localStorage + auto-refresh interceptor)
- **State**: Angular Signals

---

## Project Structure

```
src/app/
├── core/
│   ├── guards/          auth.guard.ts (authGuard, adminGuard, professorGuard, studentGuard, guestGuard)
│   ├── interceptors/    jwt.interceptor.ts (auto attach token + refresh on 401)
│   └── services/
│       ├── auth.service.ts          Login, logout, user signal
│       ├── api.service.ts           Base HTTP methods
│       ├── admin-api.service.ts     Dashboard, students, professors, departments, courses, logs
│       ├── student-api.service.ts   Enrollments, schedule, grades, library
│       ├── professor-api.service.ts Courses, grades, schedule
│       └── library-api.service.ts  Books, borrow, return, settings
├── shared/
│   ├── components/
│   │   ├── sidebar/     Role-aware navigation sidebar
│   │   └── topbar/      Page title + user chip
│   └── models/          TypeScript interfaces (index.ts)
├── auth/
│   └── login/           Login page (auto-detect Student vs Staff login)
├── admin/               (Role: Admin)
│   ├── dashboard/       Stats cards + recent logs
│   ├── students/        Search, pagination, toggle status
│   ├── professors/      List with search
│   ├── departments/     Card grid + CRUD modal
│   ├── courses/         Table + CRUD modal with dept filter
│   ├── library/         Books CRUD + Borrow/Return + Records
│   └── logs/            System activity logs table
├── student/             (Role: Student)
│   ├── dashboard/       Stats + upcoming exams
│   ├── enrollments/     My courses + enroll new + withdraw
│   ├── schedule/        Weekly timetable grid
│   ├── grades/          GPA + grade table
│   └── library/         Book search + borrowed books
└── professor/           (Role: Professor)
    ├── dashboard/       Stats + upcoming exams
    ├── courses/         My courses + student list
    ├── schedule/        Weekly teaching schedule
    └── grades/          Bulk grade entry
```

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure API URL
# Edit: src/environments/environment.ts
# Change: apiUrl: 'http://localhost:3000/api'

# 3. Start dev server
npm start
# → http://localhost:4200
```

---

## Design System

Custom CSS variables in `styles.scss`:

| Token | Value |
|-------|-------|
| `--sidebar-bg` | `#0f172a` (dark navy) |
| `--accent` | `#3b82f6` (blue) |
| `--bg-body` | `#f1f5f9` (slate) |
| Font | Plus Jakarta Sans + DM Mono |

---

## Login Flow

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `Admin@1234` |
| Professor | `prof_somchai` | `Admin@1234` |
| Student | `6601234567891` | `Admin@1234` |

System auto-detects login type:
- **13 digit number** → Student flow
- **Otherwise** → Admin/Professor flow

After login → redirects to role-specific dashboard automatically.

---

## Guards

| Guard | Protection |
|-------|-----------|
| `authGuard` | Redirect to /login if no token |
| `adminGuard` | Block non-Admin from /admin/* |
| `professorGuard` | Block non-Professor from /professor/* |
| `studentGuard` | Block non-Student from /student/* |
| `guestGuard` | Redirect logged-in users away from /login |

## JWT Interceptor

- Auto-attaches `Authorization: Bearer <token>` to all API requests
- On 401 response → tries token refresh automatically
- If refresh fails → logout + redirect to /login
