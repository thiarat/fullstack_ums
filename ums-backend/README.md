# UMS Backend API

University Management System — Express.js REST API

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase)
- **Auth**: JWT (Access + Refresh Token)
- **Docs**: Swagger / OpenAPI 3.0
- **Logger**: Winston + DailyRotateFile

---

## Project Structure

```
ums-backend/
├── src/
│   ├── config/
│   │   ├── database.js      # PostgreSQL pool (pg)
│   │   ├── logger.js        # Winston logger
│   │   └── swagger.js       # Swagger / OpenAPI config
│   ├── middlewares/
│   │   ├── auth.middleware.js    # JWT verify + Role check
│   │   ├── logger.middleware.js  # HTTP request logger
│   │   └── error.middleware.js   # Global error + 404 handler
│   ├── routes/
│   │   ├── auth.routes.js   # POST /api/auth/login, /refresh, /logout
│   │   └── admin.routes.js  # /api/admin/* (Admin only)
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── admin.controller.js
│   ├── services/
│   │   ├── auth.service.js        # Login logic, token generation
│   │   ├── admin.service.js       # Admin CRUD operations
│   │   └── systemLog.service.js   # DB activity logging
│   └── server.js            # App entry point
├── logs/                    # Auto-created, log files here
├── seed.sql                 # Seed data for Supabase
├── .env.example             # Environment variables template
└── package.json
```

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 3. Setup Supabase Database
1. Go to your Supabase project → SQL Editor
2. Run `University_system.sql` (schema)
3. Run `seed.sql` (test data)

### 4. Start development server
```bash
npm run dev
```

---

## API Endpoints

### Auth (Public)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login (auto-detect Student/Staff) |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user info |
| POST | `/api/auth/logout` | Logout |

### Admin (Role: Admin)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/dashboard` | Dashboard stats |
| GET | `/api/admin/students` | List students |
| GET | `/api/admin/students/:id` | Get student detail |
| PATCH | `/api/admin/students/:id/status` | Toggle active status |
| GET | `/api/admin/professors` | List professors |
| GET/POST | `/api/admin/departments` | List / Create departments |
| PUT/DELETE | `/api/admin/departments/:id` | Update / Delete department |
| GET/POST | `/api/admin/courses` | List / Create courses |
| PUT/DELETE | `/api/admin/courses/:id` | Update / Delete course |
| GET | `/api/admin/logs` | View system activity logs |

---

## API Documentation
Access Swagger UI at: `http://localhost:3000/api-docs`

---

## Test Accounts (after seed)
| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `Admin@1234` |
| Professor | `prof_somchai` | `Admin@1234` |
| Student | `6601234567891` | `Admin@1234` |

> ⚠️ Change all passwords before deploying to production!

---

## Login Flow

```
Student  → username: 13-digit student ID  → password: last 6 digits (bcrypt in DB)
Prof/Admin → username: as registered       → password: bcrypt in DB
```

## Response Format
```json
{
  "success": true | false,
  "message": "...",
  "data": { ... }
}
```

---

## Next Steps (Step 3)
- Angular Frontend: Project setup + Auth module (login page, JWT interceptor, route guards)
- Angular: Admin dashboard module
- Angular: Student + Professor portals
