-- ================================================================
-- UMS Seed Data (Fixed — ใช้ pgcrypto hash โดยตรงใน Supabase)
-- Run AFTER University_system.sql
-- ================================================================

-- Enable pgcrypto (Supabase มีให้อยู่แล้ว)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Departments ──────────────────────────────────────────────
INSERT INTO departments (name, location) VALUES
  ('Computer Science',       'Building A, Floor 3'),
  ('Information Technology', 'Building B, Floor 2'),
  ('Mathematics',            'Building C, Floor 1'),
  ('Business Administration','Building D, Floor 4'),
  ('Engineering',            'Building E, Floor 2')
ON CONFLICT DO NOTHING;

-- ─── Admin ────────────────────────────────────────────────────
-- Login: admin / Admin@1234
INSERT INTO users (username, password_secure, email, role_id, is_active)
VALUES (
  'admin',
  crypt('Admin@1234', gen_salt('bf', 10)),
  'admin@ums.ac.th',
  (SELECT role_id FROM roles WHERE role_name = 'Admin'),
  true
) ON CONFLICT (username) DO UPDATE
  SET password_secure = crypt('Admin@1234', gen_salt('bf', 10));

-- ─── Professors ───────────────────────────────────────────────
-- Login: prof_somchai / Prof@1234
INSERT INTO users (username, password_secure, email, role_id, is_active) VALUES
  ('prof_somchai', crypt('Prof@1234', gen_salt('bf', 10)), 'somchai@ums.ac.th',
   (SELECT role_id FROM roles WHERE role_name = 'Professor'), true),
  ('prof_wanida',  crypt('Prof@1234', gen_salt('bf', 10)), 'wanida@ums.ac.th',
   (SELECT role_id FROM roles WHERE role_name = 'Professor'), true),
  ('prof_anon',    crypt('Prof@1234', gen_salt('bf', 10)), 'anon@ums.ac.th',
   (SELECT role_id FROM roles WHERE role_name = 'Professor'), true)
ON CONFLICT (username) DO UPDATE
  SET password_secure = crypt('Prof@1234', gen_salt('bf', 10));

INSERT INTO professors (user_id, first_name, last_name, dept_id)
SELECT u.user_id, 'สมชาย', 'ใจดี',
  (SELECT dept_id FROM departments WHERE name = 'Computer Science')
FROM users u WHERE u.username = 'prof_somchai'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO professors (user_id, first_name, last_name, dept_id)
SELECT u.user_id, 'วนิดา', 'รักเรียน',
  (SELECT dept_id FROM departments WHERE name = 'Information Technology')
FROM users u WHERE u.username = 'prof_wanida'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO professors (user_id, first_name, last_name, dept_id)
SELECT u.user_id, 'อนนท์', 'สุขใจ',
  (SELECT dept_id FROM departments WHERE name = 'Mathematics')
FROM users u WHERE u.username = 'prof_anon'
ON CONFLICT (user_id) DO NOTHING;

-- ─── Students ─────────────────────────────────────────────────
-- Login: username = รหัส 13 หลัก, password = 6 หลักท้าย
-- 6601234567891 / 567891
-- 6601234567892 / 567892
-- 6601234567893 / 567893
INSERT INTO users (username, password_secure, email, role_id, is_active) VALUES
  ('6601234567891', crypt('567891', gen_salt('bf', 10)), 'std001@student.ums.ac.th',
   (SELECT role_id FROM roles WHERE role_name = 'Student'), true),
  ('6601234567892', crypt('567892', gen_salt('bf', 10)), 'std002@student.ums.ac.th',
   (SELECT role_id FROM roles WHERE role_name = 'Student'), true),
  ('6601234567893', crypt('567893', gen_salt('bf', 10)), 'std003@student.ums.ac.th',
   (SELECT role_id FROM roles WHERE role_name = 'Student'), true)
ON CONFLICT (username) DO UPDATE
  SET password_secure = EXCLUDED.password_secure;

INSERT INTO students (user_id, first_name, last_name, enrollment_date)
SELECT u.user_id, 'สมหญิง', 'ดีมาก', '2023-06-01'
FROM users u WHERE u.username = '6601234567891'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO students (user_id, first_name, last_name, enrollment_date)
SELECT u.user_id, 'ประสิทธิ์', 'เก่งมาก', '2023-06-01'
FROM users u WHERE u.username = '6601234567892'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO students (user_id, first_name, last_name, enrollment_date)
SELECT u.user_id, 'มานะ', 'ตั้งใจ', '2024-06-01'
FROM users u WHERE u.username = '6601234567893'
ON CONFLICT (user_id) DO NOTHING;

-- ─── Courses ──────────────────────────────────────────────────
INSERT INTO courses (course_code, title, credits, dept_id) VALUES
  ('CS101',  'Introduction to Programming',    3, (SELECT dept_id FROM departments WHERE name = 'Computer Science')),
  ('CS201',  'Data Structures and Algorithms', 3, (SELECT dept_id FROM departments WHERE name = 'Computer Science')),
  ('CS301',  'Database Systems',               3, (SELECT dept_id FROM departments WHERE name = 'Computer Science')),
  ('CS401',  'Web Application Development',    3, (SELECT dept_id FROM departments WHERE name = 'Computer Science')),
  ('IT101',  'Network Fundamentals',           3, (SELECT dept_id FROM departments WHERE name = 'Information Technology')),
  ('IT201',  'Cybersecurity Basics',           3, (SELECT dept_id FROM departments WHERE name = 'Information Technology')),
  ('MATH101','Calculus I',                     3, (SELECT dept_id FROM departments WHERE name = 'Mathematics')),
  ('MATH201','Linear Algebra',                 3, (SELECT dept_id FROM departments WHERE name = 'Mathematics'))
ON CONFLICT (course_code) DO NOTHING;

-- ─── Class Schedules ──────────────────────────────────────────
INSERT INTO class_schedules (course_id, prof_id, day_of_week, start_time, end_time, room_number)
SELECT c.course_id, p.prof_id, 'Monday', '09:00', '12:00', 'A301'
FROM courses c, professors p WHERE c.course_code = 'CS101' AND p.last_name = 'ใจดี';

INSERT INTO class_schedules (course_id, prof_id, day_of_week, start_time, end_time, room_number)
SELECT c.course_id, p.prof_id, 'Wednesday', '13:00', '16:00', 'A302'
FROM courses c, professors p WHERE c.course_code = 'CS201' AND p.last_name = 'ใจดี';

INSERT INTO class_schedules (course_id, prof_id, day_of_week, start_time, end_time, room_number)
SELECT c.course_id, p.prof_id, 'Tuesday', '09:00', '12:00', 'B201'
FROM courses c, professors p WHERE c.course_code = 'CS301' AND p.last_name = 'รักเรียน';

INSERT INTO class_schedules (course_id, prof_id, day_of_week, start_time, end_time, room_number)
SELECT c.course_id, p.prof_id, 'Thursday', '13:00', '16:00', 'B202'
FROM courses c, professors p WHERE c.course_code = 'IT101' AND p.last_name = 'รักเรียน';

-- ─── Exam Schedules ───────────────────────────────────────────
INSERT INTO exam_schedules (course_id, exam_type, exam_date, start_time, end_time, room_number)
SELECT course_id, 'Midterm', '2025-09-15', '09:00', '12:00', 'HALL-A' FROM courses WHERE course_code = 'CS101';
INSERT INTO exam_schedules (course_id, exam_type, exam_date, start_time, end_time, room_number)
SELECT course_id, 'Final',   '2025-11-20', '09:00', '12:00', 'HALL-A' FROM courses WHERE course_code = 'CS101';
INSERT INTO exam_schedules (course_id, exam_type, exam_date, start_time, end_time, room_number)
SELECT course_id, 'Final',   '2025-11-22', '13:00', '16:00', 'HALL-B' FROM courses WHERE course_code = 'CS301';

-- ─── Enrollments ──────────────────────────────────────────────
INSERT INTO enrollments (student_id, course_id, semester)
SELECT s.student_id, c.course_id, '1/2567'
FROM students s JOIN users u ON s.user_id = u.user_id, courses c
WHERE u.username = '6601234567891' AND c.course_code IN ('CS101','CS201','CS301')
ON CONFLICT DO NOTHING;

INSERT INTO enrollments (student_id, course_id, semester)
SELECT s.student_id, c.course_id, '1/2567'
FROM students s JOIN users u ON s.user_id = u.user_id, courses c
WHERE u.username = '6601234567892' AND c.course_code IN ('CS101','IT101')
ON CONFLICT DO NOTHING;

INSERT INTO enrollments (student_id, course_id, semester)
SELECT s.student_id, c.course_id, '1/2567'
FROM students s JOIN users u ON s.user_id = u.user_id, courses c
WHERE u.username = '6601234567893' AND c.course_code IN ('MATH101','IT101')
ON CONFLICT DO NOTHING;

-- ─── Books ────────────────────────────────────────────────────
INSERT INTO books (isbn, title, author, total_copies, available_copies) VALUES
  ('978-0-13-468599-1', 'Clean Code',                 'Robert C. Martin',   5, 4),
  ('978-0-13-235088-4', 'The Pragmatic Programmer',   'Andrew Hunt',        3, 3),
  ('978-0-201-63361-0', 'Design Patterns',            'Gang of Four',       4, 4),
  ('978-1-491-95038-0', 'JavaScript: The Good Parts', 'Douglas Crockford',  6, 5),
  ('978-0-596-51774-8', 'Learning Python',            'Mark Lutz',          4, 3),
  ('978-0-13-110362-7', 'The C Programming Language', 'Kernighan & Ritchie',3, 3)
ON CONFLICT (isbn) DO NOTHING;

-- ─── Verify ───────────────────────────────────────────────────
SELECT 'users'       AS table_name, COUNT(*) AS rows FROM users
UNION ALL SELECT 'professors',  COUNT(*) FROM professors
UNION ALL SELECT 'students',    COUNT(*) FROM students
UNION ALL SELECT 'courses',     COUNT(*) FROM courses
UNION ALL SELECT 'enrollments', COUNT(*) FROM enrollments
UNION ALL SELECT 'books',       COUNT(*) FROM books;
