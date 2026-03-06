-- ================================================================
--  UMS — University Management System
--  Database Setup (All-in-One)
--
--  วิธีใช้:
--    Supabase → SQL Editor → วางทั้งไฟล์ → Run
--    หรือ psql -U postgres -d postgres -f ums_database_setup.sql
--
--  ไฟล์นี้ประกอบด้วย:
--    1. Extensions
--    2. Schema (Tables, Views, Triggers, Functions)
--    3. Seed Data (Test Users, Courses, Books, Enrollments)
--
--  Test Accounts:
--    Admin      → admin         / Admin@1234
--    Professor  → prof_somchai  / Prof@1234
--    Professor  → prof_wanida   / Prof@1234
--    Student    → 6601234567891 / 567891  (6 หลักท้าย)
--    Student    → 6601234567892 / 567892
--    Student    → 6601234567893 / 567893
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- SECTION 1: EXTENSIONS
-- ────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- bcrypt hashing


-- ────────────────────────────────────────────────────────────────
-- SECTION 2: SCHEMA
-- ────────────────────────────────────────────────────────────────

-- 2.1  Departments, Roles, Users
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
    dept_id  SERIAL PRIMARY KEY,
    name     VARCHAR(100) NOT NULL,
    location VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS roles (
    role_id   SERIAL PRIMARY KEY,
    role_name VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    user_id         SERIAL PRIMARY KEY,
    username        VARCHAR(50)  UNIQUE NOT NULL,
    password_secure TEXT         NOT NULL,
    email           VARCHAR(100) UNIQUE NOT NULL,
    role_id         INT REFERENCES roles(role_id),
    is_active       BOOLEAN   DEFAULT TRUE,
    last_login      TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (role_name) VALUES ('Admin'), ('Student'), ('Professor')
ON CONFLICT DO NOTHING;


-- 2.2  Professors & Students
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS professors (
    prof_id       SERIAL PRIMARY KEY,
    user_id       INT UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    first_name    VARCHAR(50) NOT NULL,
    last_name     VARCHAR(50) NOT NULL,
    profile_image VARCHAR(255) DEFAULT 'default_prof.png',
    dept_id       INT REFERENCES departments(dept_id)
);

CREATE TABLE IF NOT EXISTS students (
    student_id    SERIAL PRIMARY KEY,
    user_id       INT UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    first_name    VARCHAR(50) NOT NULL,
    last_name     VARCHAR(50) NOT NULL,
    profile_image VARCHAR(255) DEFAULT 'default_std.png',
    enrollment_date DATE DEFAULT CURRENT_DATE
);


-- 2.3  Books & Library
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS books (
    book_id         SERIAL PRIMARY KEY,
    isbn            VARCHAR(20) UNIQUE NOT NULL,
    title           VARCHAR(255) NOT NULL,
    author          VARCHAR(100),
    total_copies    INT DEFAULT 1 CHECK (total_copies    >= 0),
    available_copies INT DEFAULT 1 CHECK (available_copies >= 0)
);

CREATE TABLE IF NOT EXISTS library_settings (
    setting_id    SERIAL PRIMARY KEY,
    max_days_limit INT            DEFAULT 7,
    fine_per_day   DECIMAL(10, 2) DEFAULT 5.00
);

INSERT INTO library_settings (max_days_limit, fine_per_day)
VALUES (7, 5.00) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS library_records (
    record_id   SERIAL PRIMARY KEY,
    student_id  INT REFERENCES students(student_id) ON DELETE CASCADE,
    book_id     INT REFERENCES books(book_id),
    borrow_date DATE           DEFAULT CURRENT_DATE,
    due_date    DATE           NOT NULL,
    return_date DATE,
    fine_amount DECIMAL(10, 2) DEFAULT 0,
    status      VARCHAR(20)    DEFAULT 'Borrowed'
);


-- 2.4  Courses, Schedules, Exams, Enrollments
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
    course_id   SERIAL PRIMARY KEY,
    course_code VARCHAR(10) UNIQUE NOT NULL,
    title       VARCHAR(100) NOT NULL,
    credits     INT DEFAULT 3 CHECK (credits > 0),
    dept_id     INT REFERENCES departments(dept_id)
);

CREATE TABLE IF NOT EXISTS class_schedules (
    schedule_id SERIAL PRIMARY KEY,
    course_id   INT REFERENCES courses(course_id) ON DELETE CASCADE,
    prof_id     INT REFERENCES professors(prof_id),
    day_of_week VARCHAR(10),
    start_time  TIME,
    end_time    TIME,
    room_number VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS exam_schedules (
    exam_id     SERIAL PRIMARY KEY,
    course_id   INT REFERENCES courses(course_id) ON DELETE CASCADE,
    exam_type   VARCHAR(20) DEFAULT 'Final',   -- Midterm | Final
    exam_date   DATE NOT NULL,
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    room_number VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    student_id    INT REFERENCES students(student_id) ON DELETE CASCADE,
    course_id     INT REFERENCES courses(course_id)   ON DELETE CASCADE,
    grade         VARCHAR(2) CHECK (grade IN ('A','B+','B','C+','C','D+','D','F','W','I')),
    semester      VARCHAR(20)
);


-- 2.5  System Logs
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_logs (
    log_id     SERIAL PRIMARY KEY,
    user_id    INT REFERENCES users(user_id),
    action     TEXT NOT NULL,
    table_name VARCHAR(50),
    record_id  INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 2.6  Trigger: Auto-calculate library fine on return
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION calculate_library_fine()
RETURNS TRIGGER AS $$
DECLARE
    fine_rate DECIMAL(10, 2);
BEGIN
    SELECT fine_per_day INTO fine_rate FROM library_settings LIMIT 1;

    IF NEW.return_date IS NOT NULL AND OLD.return_date IS NULL THEN
        IF NEW.return_date > OLD.due_date THEN
            NEW.fine_amount := (NEW.return_date - OLD.due_date) * fine_rate;
            NEW.status      := 'Returned (Late)';
        ELSE
            NEW.fine_amount := 0;
            NEW.status      := 'Returned';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_fine ON library_records;
CREATE TRIGGER trg_calculate_fine
BEFORE UPDATE ON library_records
FOR EACH ROW
EXECUTE FUNCTION calculate_library_fine();


-- 2.7  Views
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_user_profiles AS
SELECT
    u.user_id,
    u.username,
    r.role_name,
    COALESCE(s.first_name, p.first_name, 'System')   AS first_name,
    COALESCE(s.last_name,  p.last_name,  'Admin')    AS last_name,
    COALESCE(s.profile_image, p.profile_image, 'admin_icon.png') AS profile_image,
    u.is_active,
    u.last_login
FROM users u
JOIN roles r          ON u.role_id  = r.role_id
LEFT JOIN students s  ON u.user_id  = s.user_id
LEFT JOIN professors p ON u.user_id = p.user_id;

CREATE OR REPLACE VIEW v_library_status AS
SELECT
    lr.record_id,
    s.first_name || ' ' || s.last_name AS student_name,
    b.title                             AS book_title,
    lr.borrow_date,
    lr.due_date,
    lr.return_date,
    CASE
        WHEN lr.return_date IS NULL AND CURRENT_DATE > lr.due_date
        THEN (CURRENT_DATE - lr.due_date) *
             (SELECT fine_per_day FROM library_settings LIMIT 1)
        ELSE lr.fine_amount
    END AS current_fine,
    lr.status
FROM library_records lr
JOIN students s   ON lr.student_id = s.student_id
LEFT JOIN books b ON lr.book_id    = b.book_id;


-- ────────────────────────────────────────────────────────────────
-- SECTION 3: SEED DATA
-- ────────────────────────────────────────────────────────────────

-- 3.1  Departments
-- ─────────────────────────────────────────────────────────────────
INSERT INTO departments (name, location) VALUES
  ('Computer Science',        'Building A, Floor 3'),
  ('Information Technology',  'Building B, Floor 2'),
  ('Mathematics',             'Building C, Floor 1'),
  ('Business Administration', 'Building D, Floor 4'),
  ('Engineering',             'Building E, Floor 2')
ON CONFLICT DO NOTHING;


-- 3.2  Admin
-- ─────────────────────────────────────────────────────────────────
--   username: admin
--   password: Admin@1234
INSERT INTO users (username, password_secure, email, role_id, is_active)
VALUES (
  'admin',
  crypt('Admin@1234', gen_salt('bf', 10)),
  'admin@ums.ac.th',
  (SELECT role_id FROM roles WHERE role_name = 'Admin'),
  true
) ON CONFLICT (username) DO UPDATE
  SET password_secure = crypt('Admin@1234', gen_salt('bf', 10));


-- 3.3  Professors
-- ─────────────────────────────────────────────────────────────────
--   password (ทุกคน): Prof@1234
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


-- 3.4  Students
-- ─────────────────────────────────────────────────────────────────
--   username = รหัสนักศึกษา 13 หลัก
--   password = 6 หลักท้ายของรหัส
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


-- 3.5  Courses
-- ─────────────────────────────────────────────────────────────────
INSERT INTO courses (course_code, title, credits, dept_id) VALUES
  ('CS101',   'Introduction to Programming',    3, (SELECT dept_id FROM departments WHERE name = 'Computer Science')),
  ('CS201',   'Data Structures and Algorithms', 3, (SELECT dept_id FROM departments WHERE name = 'Computer Science')),
  ('CS301',   'Database Systems',               3, (SELECT dept_id FROM departments WHERE name = 'Computer Science')),
  ('CS401',   'Web Application Development',    3, (SELECT dept_id FROM departments WHERE name = 'Computer Science')),
  ('IT101',   'Network Fundamentals',           3, (SELECT dept_id FROM departments WHERE name = 'Information Technology')),
  ('IT201',   'Cybersecurity Basics',           3, (SELECT dept_id FROM departments WHERE name = 'Information Technology')),
  ('MATH101', 'Calculus I',                     3, (SELECT dept_id FROM departments WHERE name = 'Mathematics')),
  ('MATH201', 'Linear Algebra',                 3, (SELECT dept_id FROM departments WHERE name = 'Mathematics'))
ON CONFLICT (course_code) DO NOTHING;


-- 3.6  Class Schedules
-- ─────────────────────────────────────────────────────────────────
INSERT INTO class_schedules (course_id, prof_id, day_of_week, start_time, end_time, room_number)
SELECT c.course_id, p.prof_id, 'Monday', '09:00', '12:00', 'A301'
FROM courses c, professors p
WHERE c.course_code = 'CS101' AND p.last_name = 'ใจดี'
ON CONFLICT DO NOTHING;

INSERT INTO class_schedules (course_id, prof_id, day_of_week, start_time, end_time, room_number)
SELECT c.course_id, p.prof_id, 'Wednesday', '13:00', '16:00', 'A302'
FROM courses c, professors p
WHERE c.course_code = 'CS201' AND p.last_name = 'ใจดี'
ON CONFLICT DO NOTHING;

INSERT INTO class_schedules (course_id, prof_id, day_of_week, start_time, end_time, room_number)
SELECT c.course_id, p.prof_id, 'Tuesday', '09:00', '12:00', 'B201'
FROM courses c, professors p
WHERE c.course_code = 'CS301' AND p.last_name = 'รักเรียน'
ON CONFLICT DO NOTHING;

INSERT INTO class_schedules (course_id, prof_id, day_of_week, start_time, end_time, room_number)
SELECT c.course_id, p.prof_id, 'Thursday', '13:00', '16:00', 'B202'
FROM courses c, professors p
WHERE c.course_code = 'IT101' AND p.last_name = 'รักเรียน'
ON CONFLICT DO NOTHING;


-- 3.7  Exam Schedules
-- ─────────────────────────────────────────────────────────────────
INSERT INTO exam_schedules (course_id, exam_type, exam_date, start_time, end_time, room_number)
SELECT course_id, 'Midterm', '2025-09-15', '09:00', '12:00', 'HALL-A'
FROM courses WHERE course_code = 'CS101';

INSERT INTO exam_schedules (course_id, exam_type, exam_date, start_time, end_time, room_number)
SELECT course_id, 'Final', '2025-11-20', '09:00', '12:00', 'HALL-A'
FROM courses WHERE course_code = 'CS101';

INSERT INTO exam_schedules (course_id, exam_type, exam_date, start_time, end_time, room_number)
SELECT course_id, 'Final', '2025-11-22', '13:00', '16:00', 'HALL-B'
FROM courses WHERE course_code = 'CS301';


-- 3.8  Enrollments
-- ─────────────────────────────────────────────────────────────────
INSERT INTO enrollments (student_id, course_id, semester)
SELECT s.student_id, c.course_id, '1/2567'
FROM students s
JOIN users u ON s.user_id = u.user_id
CROSS JOIN courses c
WHERE u.username = '6601234567891'
  AND c.course_code IN ('CS101', 'CS201', 'CS301')
ON CONFLICT DO NOTHING;

INSERT INTO enrollments (student_id, course_id, semester)
SELECT s.student_id, c.course_id, '1/2567'
FROM students s
JOIN users u ON s.user_id = u.user_id
CROSS JOIN courses c
WHERE u.username = '6601234567892'
  AND c.course_code IN ('CS101', 'IT101')
ON CONFLICT DO NOTHING;

INSERT INTO enrollments (student_id, course_id, semester)
SELECT s.student_id, c.course_id, '1/2567'
FROM students s
JOIN users u ON s.user_id = u.user_id
CROSS JOIN courses c
WHERE u.username = '6601234567893'
  AND c.course_code IN ('MATH101', 'IT101')
ON CONFLICT DO NOTHING;


-- 3.9  Books
-- ─────────────────────────────────────────────────────────────────
INSERT INTO books (isbn, title, author, total_copies, available_copies) VALUES
  ('978-0-13-468599-1', 'Clean Code',                   'Robert C. Martin',    5, 4),
  ('978-0-13-235088-4', 'The Pragmatic Programmer',     'Andrew Hunt',         3, 3),
  ('978-0-201-63361-0', 'Design Patterns',              'Gang of Four',        4, 4),
  ('978-1-491-95038-0', 'JavaScript: The Good Parts',   'Douglas Crockford',   6, 5),
  ('978-0-596-51774-8', 'Learning Python',              'Mark Lutz',           4, 3),
  ('978-0-13-110362-7', 'The C Programming Language',   'Kernighan & Ritchie', 3, 3)
ON CONFLICT (isbn) DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- SECTION 4: VERIFY  (แสดงผลหลัง run เสร็จ)
-- ────────────────────────────────────────────────────────────────
SELECT
  table_name,
  row_count
FROM (
  SELECT 'users'          AS table_name, COUNT(*) AS row_count FROM users        UNION ALL
  SELECT 'professors',                   COUNT(*)              FROM professors    UNION ALL
  SELECT 'students',                     COUNT(*)              FROM students      UNION ALL
  SELECT 'departments',                  COUNT(*)              FROM departments   UNION ALL
  SELECT 'courses',                      COUNT(*)              FROM courses       UNION ALL
  SELECT 'class_schedules',              COUNT(*)              FROM class_schedules UNION ALL
  SELECT 'exam_schedules',               COUNT(*)              FROM exam_schedules UNION ALL
  SELECT 'enrollments',                  COUNT(*)              FROM enrollments   UNION ALL
  SELECT 'books',                        COUNT(*)              FROM books         UNION ALL
  SELECT 'library_settings',             COUNT(*)              FROM library_settings
) summary
ORDER BY table_name;
