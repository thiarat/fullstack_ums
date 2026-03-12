-- ============================================================
--  University Management System — Database Schema (Fixed)
--  แก้ไขจุดบกพร่องทั้งหมดจากการตรวจสอบ
-- ============================================================

-- 1. Departments, Roles, Users
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

-- 2. ข้อมูลบุคลากร (Professors, Students)
CREATE TABLE IF NOT EXISTS professors (
    prof_id       SERIAL PRIMARY KEY,
    user_id       INT UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    first_name    VARCHAR(50)  NOT NULL,
    last_name     VARCHAR(50)  NOT NULL,
    profile_image VARCHAR(255) DEFAULT 'default_prof.png',
    dept_id       INT REFERENCES departments(dept_id)
);

CREATE TABLE IF NOT EXISTS students (
    student_id      SERIAL PRIMARY KEY,
    user_id         INT UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    first_name      VARCHAR(50)  NOT NULL,
    last_name       VARCHAR(50)  NOT NULL,
    profile_image   VARCHAR(255) DEFAULT 'default_std.png',
    enrollment_date DATE DEFAULT CURRENT_DATE
);

-- 3. ระบบจัดการหนังสือ (Books & Library)
CREATE TABLE IF NOT EXISTS books (
    book_id          SERIAL PRIMARY KEY,
    isbn             VARCHAR(20)    UNIQUE NOT NULL,
    title            VARCHAR(255)   NOT NULL,
    author           VARCHAR(100),
    total_copies     INT DEFAULT 1  CHECK (total_copies >= 0),
    available_copies INT DEFAULT 1  CHECK (available_copies >= 0),
    -- [FIX] available_copies ต้องไม่เกิน total_copies
    CONSTRAINT chk_copies CHECK (available_copies <= total_copies)
);

-- [FIX] library_settings: เพิ่ม UNIQUE constraint เพื่อให้ ON CONFLICT ทำงานถูกต้อง
--       และล็อกให้มีได้แค่ 1 row เสมอ (singleton pattern)
CREATE TABLE IF NOT EXISTS library_settings (
    setting_id    SERIAL PRIMARY KEY,
    singleton     BOOLEAN UNIQUE DEFAULT TRUE,          -- บังคับให้มีได้ 1 row
    max_days_limit INT     DEFAULT 7,
    fine_per_day   DECIMAL(10, 2) DEFAULT 5.00,
    CONSTRAINT chk_singleton CHECK (singleton = TRUE)   -- ค่าต้องเป็น TRUE เสมอ
);

INSERT INTO library_settings (singleton, max_days_limit, fine_per_day)
VALUES (TRUE, 7, 5.00)
ON CONFLICT (singleton) DO NOTHING;   -- [FIX] ON CONFLICT ทำงานได้แล้ว

CREATE TABLE IF NOT EXISTS library_records (
    record_id   SERIAL PRIMARY KEY,
    student_id  INT REFERENCES students(student_id) ON DELETE CASCADE,
    book_id     INT REFERENCES books(book_id),
    borrow_date DATE DEFAULT CURRENT_DATE,
    due_date    DATE NOT NULL,
    return_date DATE,
    fine_amount DECIMAL(10, 2) DEFAULT 0,
    status      VARCHAR(20) DEFAULT 'Borrowed'
);

-- [FIX] กันยืมหนังสือเล่มเดิมซ้ำในขณะที่ยังไม่คืน (Partial Unique Index)
CREATE UNIQUE INDEX IF NOT EXISTS uix_active_borrow
    ON library_records (student_id, book_id)
    WHERE status = 'Borrowed';

-- 4. ระบบการเรียนและตารางสอบ (Courses, Schedules, Exams)
CREATE TABLE IF NOT EXISTS courses (
    course_id   SERIAL PRIMARY KEY,
    course_code VARCHAR(10)  UNIQUE NOT NULL,
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
    room_number VARCHAR(20),
    -- [FIX] บังคับให้ start_time < end_time
    CONSTRAINT chk_schedule_time CHECK (start_time < end_time)
);

-- [FIX] Unique index กันห้องชนกัน (ห้อง + วัน + เวลาซ้อนกัน)
--       ใช้ Exclusion Constraint (ต้องติดตั้ง btree_gist extension)
-- หากไม่ต้องการใช้ extension ให้ลบบรรทัดนี้และ handle ใน application แทน
-- CREATE EXTENSION IF NOT EXISTS btree_gist;
-- ALTER TABLE class_schedules
--     ADD CONSTRAINT excl_room_overlap
--     EXCLUDE USING gist (
--         room_number WITH =,
--         day_of_week WITH =,
--         tsrange(
--             ('2000-01-01'::date + start_time)::timestamp,
--             ('2000-01-01'::date + end_time)::timestamp
--         ) WITH &&
--     );

CREATE TABLE IF NOT EXISTS exam_schedules (
    exam_id     SERIAL PRIMARY KEY,
    course_id   INT REFERENCES courses(course_id) ON DELETE CASCADE,
    -- [FIX] เพิ่ม prof_id เพื่อระบุผู้คุมสอบ
    prof_id     INT REFERENCES professors(prof_id),
    exam_type   VARCHAR(20) DEFAULT 'Final',  -- Midterm, Final
    exam_date   DATE NOT NULL,
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    room_number VARCHAR(20),
    -- [FIX] บังคับให้ start_time < end_time
    CONSTRAINT chk_exam_time CHECK (start_time < end_time)
);

-- [FIX] กันนักศึกษาลงทะเบียนวิชาเดิมซ้ำในภาคการศึกษาเดียวกัน
CREATE TABLE IF NOT EXISTS enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    student_id    INT REFERENCES students(student_id) ON DELETE CASCADE,
    course_id     INT REFERENCES courses(course_id)   ON DELETE CASCADE,
    grade         VARCHAR(2) CHECK (grade IN ('A','B+','B','C+','C','D+','D','F','W','I')),
    semester      VARCHAR(20),
    -- [FIX] UNIQUE constraint กันลงทะเบียนซ้ำ
    CONSTRAINT uix_enrollment UNIQUE (student_id, course_id, semester)
);

-- 5. ระบบบันทึกและฟังก์ชัน

-- [FIX] Trigger อัปเดต available_copies เมื่อยืม / คืนหนังสือ
CREATE OR REPLACE FUNCTION update_book_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- ยืมหนังสือ → ลด available_copies
    IF TG_OP = 'INSERT' THEN
        UPDATE books
        SET available_copies = available_copies - 1
        WHERE book_id = NEW.book_id
          AND available_copies > 0;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'หนังสือไม่มีในคลัง (book_id: %)', NEW.book_id;
        END IF;

    -- คืนหนังสือ → เพิ่ม available_copies
    ELSIF TG_OP = 'UPDATE'
      AND NEW.return_date IS NOT NULL
      AND OLD.return_date IS NULL THEN
        UPDATE books
        SET available_copies = available_copies + 1
        WHERE book_id = NEW.book_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_availability
AFTER INSERT OR UPDATE ON library_records
FOR EACH ROW
EXECUTE FUNCTION update_book_availability();

-- Trigger คำนวณค่าปรับเมื่อคืนหนังสือ (เดิม — คงไว้)
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

CREATE TRIGGER trg_calculate_fine
BEFORE UPDATE ON library_records
FOR EACH ROW
EXECUTE FUNCTION calculate_library_fine();

CREATE TABLE IF NOT EXISTS system_logs (
    log_id     SERIAL PRIMARY KEY,
    user_id    INT REFERENCES users(user_id),
    action     TEXT         NOT NULL,
    table_name VARCHAR(50),
    record_id  INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. วิวแสดงข้อมูล

-- [FIX] v_user_profiles: Admin ที่ไม่มีแถวใน students/professors
--       จะแสดงเป็น NULL แทนการ hardcode 'System' / 'Admin'
CREATE OR REPLACE VIEW v_user_profiles AS
SELECT
    u.user_id,
    u.username,
    r.role_name,
    COALESCE(s.first_name,  p.first_name)  AS first_name,
    COALESCE(s.last_name,   p.last_name)   AS last_name,
    COALESCE(s.profile_image, p.profile_image, 'admin_icon.png') AS profile_image,
    u.is_active,
    u.last_login
FROM users u
JOIN  roles      r ON u.role_id  = r.role_id
LEFT JOIN students   s ON u.user_id  = s.user_id
LEFT JOIN professors p ON u.user_id  = p.user_id;

-- v_library_status (เดิม — คงไว้ ใช้งานได้ถูกต้องแล้ว)
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
        THEN (CURRENT_DATE - lr.due_date)
             * (SELECT fine_per_day FROM library_settings LIMIT 1)
        ELSE lr.fine_amount
    END AS current_fine,
    lr.status
FROM library_records lr
JOIN  students s ON lr.student_id = s.student_id
LEFT JOIN books b ON lr.book_id   = b.book_id;
