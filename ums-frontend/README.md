# UMS Frontend — Angular 17

## วิธีรัน Local

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. รัน dev server (port 4200)
npm start
```

เปิดเบราเซอร์: **http://localhost:4200**

> ต้องรัน Backend (`ums-backend`) ก่อนที่ port 3000

---

## Test Accounts

| Role      | Username       | Password   |
|-----------|----------------|------------|
| Admin     | admin          | Admin@1234 |
| Professor | prof_somchai   | Prof@1234  |
| Student   | 6601234567891  | 567891     |
| Student   | 6601234567892  | 567892     |

---

## Project Structure

```
src/app/
├── core/
│   ├── guards/          Route protection (auth, admin, professor, student)
│   ├── interceptors/    JWT auto-attach + refresh interceptor
│   └── services/        API services สำหรับทุก module
├── shared/
│   ├── components/      Sidebar, Topbar (shared ทุก role)
│   └── models/          TypeScript interfaces
├── auth/login/          หน้า Login
├── admin/               Admin module (7 หน้า)
├── student/             Student module (6 หน้า)
└── professor/           Professor module (4 หน้า)
```
