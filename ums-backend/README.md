# UMS Backend — Express.js API

## วิธีรัน Local

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. สร้างไฟล์ .env จาก template
cp .env.example .env

# 3. แก้ไข .env — ใส่ DATABASE_URL จาก Supabase
# Supabase Dashboard → Settings → Database → Transaction pooler → Copy URL

# 4. รัน dev server (port 3000)
npm run dev
```

API Docs: **http://localhost:3000/api-docs**  
Health:   **http://localhost:3000/health**

---

## Environment Variables (.env)

| ตัวแปร | ค่าตัวอย่าง | หมายเหตุ |
|--------|------------|---------|
| `PORT` | `3000` | port ของ server |
| `DATABASE_URL` | `postgresql://...` | Supabase Transaction Pooler URL |
| `JWT_SECRET` | `random_string` | ใส่ string ยาวๆ |
| `JWT_REFRESH_SECRET` | `random_string` | ใส่ string ยาวๆ คนละตัวกับ JWT_SECRET |
| `FRONTEND_URL` | `http://localhost:4200` | CORS origin |

---

## Test Accounts

| Role      | Username       | Password   |
|-----------|----------------|------------|
| Admin     | admin          | Admin@1234 |
| Professor | prof_somchai   | Prof@1234  |
| Student   | 6601234567891  | 567891     |

---

## API Routes

| Prefix | Role | หมายเหตุ |
|--------|------|---------|
| `/api/auth` | Public | login, refresh, me, logout |
| `/api/admin` | Admin | dashboard, students, professors, departments, courses, logs |
| `/api/student` | Student | enrollments, schedule, grades, library |
| `/api/professor` | Professor | courses, grades, schedule, exams |
| `/api/library` | Admin | books, borrow, return, records, settings |
