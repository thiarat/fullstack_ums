const db = require('../config/database');

// ─── DASHBOARD ─────────────────────────────────────────────────
const getStudentDashboard = async (studentId) => {
  const [profile, enrollments, upcomingExams, borrowedBooks, gpaResult] = await Promise.all([
    db.query(
      `SELECT s.student_id, s.first_name, s.last_name, s.profile_image, s.enrollment_date,
              u.username, u.email, u.last_login
       FROM students s JOIN users u ON s.user_id = u.user_id
       WHERE s.student_id = $1`,
      [studentId]
    ),
    db.query('SELECT COUNT(*) FROM enrollments WHERE student_id = $1 AND (grade IS NULL OR grade NOT IN (\'W\',\'F\'))', [studentId]),
    // ตารางสอบ: เรียงจากใกล้สุด ไม่จำกัด 30 วัน
    db.query(
      `SELECT e.exam_id, e.exam_type, e.exam_date, e.start_time, e.end_time, e.room_number,
              c.course_code, c.title as course_title,
              (e.exam_date - CURRENT_DATE) as days_until
       FROM exam_schedules e
       JOIN courses c ON e.course_id = c.course_id
       JOIN enrollments en ON c.course_id = en.course_id
       WHERE en.student_id = $1 AND e.exam_date >= CURRENT_DATE
       ORDER BY e.exam_date, e.start_time`,
      [studentId]
    ),
    db.query(`SELECT COUNT(*) FROM library_records WHERE student_id = $1 AND status = 'Borrowed'`, [studentId]),
    // GPA คำนวณ
    db.query(
      `SELECT
         COUNT(*) FILTER (WHERE grade IS NOT NULL AND grade NOT IN ('W','I')) as graded_count,
         ROUND(
           AVG(CASE grade
             WHEN 'A'  THEN 4.0 WHEN 'B+' THEN 3.5 WHEN 'B'  THEN 3.0
             WHEN 'C+' THEN 2.5 WHEN 'C'  THEN 2.0 WHEN 'D+' THEN 1.5
             WHEN 'D'  THEN 1.0 WHEN 'F'  THEN 0.0
           END) FILTER (WHERE grade IS NOT NULL AND grade NOT IN ('W','I')),
         2) as gpa
       FROM enrollments
       WHERE student_id = $1`,
      [studentId]
    ),
  ]);

  if (profile.rows.length === 0) throw { statusCode: 404, message: 'Student not found.' };

  return {
    profile: profile.rows[0],
    stats: {
      enrolledCourses: parseInt(enrollments.rows[0].count),
      borrowedBooks: parseInt(borrowedBooks.rows[0].count),
      gpa: gpaResult.rows[0].gpa ? parseFloat(gpaResult.rows[0].gpa) : null,
    },
    upcomingExams: upcomingExams.rows,
  };
};

// ─── ENROLLMENTS ───────────────────────────────────────────────
const getMyEnrollments = async (studentId, { semester = null }) => {
  let query = `
    SELECT e.enrollment_id, e.grade, e.semester,
           c.course_id, c.course_code, c.title, c.credits,
           d.name as department,
           p.first_name || ' ' || p.last_name as professor_name,
           cs.day_of_week, cs.start_time, cs.end_time, cs.room_number
    FROM enrollments e
    JOIN courses c ON e.course_id = c.course_id
    LEFT JOIN departments d ON c.dept_id = d.dept_id
    LEFT JOIN class_schedules cs ON c.course_id = cs.course_id
    LEFT JOIN professors p ON cs.prof_id = p.prof_id
    WHERE e.student_id = $1
  `;
  const params = [studentId];
  if (semester) { params.push(semester); query += ` AND e.semester = $${params.length}`; }
  query += ' ORDER BY e.semester DESC, c.course_code';

  const result = await db.query(query, params);
  return result.rows;
};

const getAvailableCourses = async (studentId) => {
  const result = await db.query(
    `SELECT c.course_id, c.course_code, c.title, c.credits,
            d.name as department,
            p.first_name || ' ' || p.last_name as professor_name,
            cs.schedule_id, cs.day_of_week, cs.start_time, cs.end_time, cs.room_number,
            COUNT(e.enrollment_id) as enrolled_count
     FROM courses c
     LEFT JOIN departments d ON c.dept_id = d.dept_id
     LEFT JOIN class_schedules cs ON c.course_id = cs.course_id
     LEFT JOIN professors p ON cs.prof_id = p.prof_id
     LEFT JOIN enrollments e ON c.course_id = e.course_id
     WHERE c.course_id NOT IN (
       SELECT course_id FROM enrollments WHERE student_id = $1
     )
     GROUP BY c.course_id, d.name, p.first_name, p.last_name,
              cs.schedule_id, cs.day_of_week, cs.start_time, cs.end_time, cs.room_number
     ORDER BY c.course_code`,
    [studentId]
  );
  return result.rows;
};

const enrollCourse = async (studentId, courseId, semester, scheduleId) => {
  // Check already enrolled in same course+schedule combination
  let existing;
  if (scheduleId) {
    // ถ้ามี schedule_id ให้ตรวจสอบว่าลงทะเบียน schedule เดิมแล้วหรือยัง
    existing = await db.query(
      `SELECT e.enrollment_id FROM enrollments e
       JOIN class_schedules cs ON e.course_id = cs.course_id
       WHERE e.student_id = $1 AND e.course_id = $2 AND e.semester = $3
         AND cs.schedule_id = $4`,
      [studentId, courseId, semester, scheduleId]
    );
  } else {
    existing = await db.query(
      'SELECT enrollment_id FROM enrollments WHERE student_id = $1 AND course_id = $2 AND semester = $3',
      [studentId, courseId, semester]
    );
  }
  if (existing.rows.length > 0) throw { statusCode: 409, message: 'ลงทะเบียนวิชานี้ในเทอมนี้แล้ว' };

  // Check course exists + get schedule by schedule_id or course_id
  let courseInfo;
  if (scheduleId) {
    courseInfo = await db.query(
      `SELECT c.course_id, cs.schedule_id, cs.day_of_week, cs.start_time, cs.end_time
       FROM courses c
       JOIN class_schedules cs ON c.course_id = cs.course_id
       WHERE c.course_id = $1 AND cs.schedule_id = $2`,
      [courseId, scheduleId]
    );
  } else {
    courseInfo = await db.query(
      `SELECT c.course_id, cs.day_of_week, cs.start_time, cs.end_time
       FROM courses c
       LEFT JOIN class_schedules cs ON c.course_id = cs.course_id
       WHERE c.course_id = $1 LIMIT 1`,
      [courseId]
    );
  }
  if (courseInfo.rows.length === 0) throw { statusCode: 404, message: 'ไม่พบรายวิชา' };

  const newCourse = courseInfo.rows[0];

  // Time conflict check — เฉพาะวิชาที่มีตารางเรียน
  if (newCourse.day_of_week && newCourse.start_time && newCourse.end_time) {
    const conflicts = await db.query(
      `SELECT c.course_code, c.title, cs.day_of_week, cs.start_time, cs.end_time
       FROM enrollments e
       JOIN courses c ON e.course_id = c.course_id
       JOIN class_schedules cs ON c.course_id = cs.course_id
       WHERE e.student_id = $1
         AND e.grade IS DISTINCT FROM 'W'
         AND cs.day_of_week = $2
         AND cs.start_time < $4
         AND cs.end_time   > $3`,
      [studentId, newCourse.day_of_week, newCourse.start_time, newCourse.end_time]
    );

    if (conflicts.rows.length > 0) {
      const c = conflicts.rows[0];
      throw {
        statusCode: 409,
        message: `เวลาเรียนทับกับ ${c.course_code} ${c.title} (${c.day_of_week} ${c.start_time}–${c.end_time})`,
        conflict: conflicts.rows,
      };
    }
  }

  const result = await db.query(
    'INSERT INTO enrollments (student_id, course_id, semester) VALUES ($1, $2, $3) RETURNING *',
    [studentId, courseId, semester]
  );
  return result.rows[0];
};

const withdrawCourse = async (studentId, enrollmentId) => {
  const result = await db.query(
    `UPDATE enrollments SET grade = 'W' WHERE enrollment_id = $1 AND student_id = $2 RETURNING *`,
    [enrollmentId, studentId]
  );
  if (result.rows.length === 0) throw { statusCode: 404, message: 'Enrollment not found.' };
  return result.rows[0];
};

// ─── SCHEDULE ──────────────────────────────────────────────────
const getMySchedule = async (studentId) => {
  const result = await db.query(
    `SELECT cs.schedule_id, cs.day_of_week, cs.start_time, cs.end_time, cs.room_number,
            c.course_code, c.title as course_title, c.credits,
            p.first_name || ' ' || p.last_name as professor_name
     FROM class_schedules cs
     JOIN courses c ON cs.course_id = c.course_id
     LEFT JOIN professors p ON cs.prof_id = p.prof_id
     JOIN enrollments e ON c.course_id = e.course_id
     WHERE e.student_id = $1 AND (e.grade IS NULL OR e.grade NOT IN ('W','F'))
     ORDER BY
       CASE cs.day_of_week
         WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
         WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5
         WHEN 'Saturday' THEN 6 WHEN 'Sunday' THEN 7
       END, cs.start_time`,
    [studentId]
  );
  return result.rows;
};

// ─── EXAM SCHEDULE ─────────────────────────────────────────────
const getMyExamSchedule = async (studentId) => {
  const result = await db.query(
    `SELECT es.exam_id, es.exam_type, es.exam_date, es.start_time, es.end_time, es.room_number,
            c.course_code, c.title as course_title,
            (es.exam_date - CURRENT_DATE) as days_until
     FROM exam_schedules es
     JOIN courses c ON es.course_id = c.course_id
     JOIN enrollments e ON c.course_id = e.course_id
     WHERE e.student_id = $1
     ORDER BY es.exam_date, es.start_time`,
    [studentId]
  );
  return result.rows;
};

// ─── GRADES ────────────────────────────────────────────────────
const getMyGrades = async (studentId) => {
  const [grades, gpa] = await Promise.all([
    db.query(
      `SELECT e.enrollment_id, e.grade, e.semester,
              c.course_code, c.title, c.credits,
              d.name as department
       FROM enrollments e
       JOIN courses c ON e.course_id = c.course_id
       LEFT JOIN departments d ON c.dept_id = d.dept_id
       WHERE e.student_id = $1
       ORDER BY e.semester DESC, c.course_code`,
      [studentId]
    ),
    db.query(
      `SELECT
         ROUND(
           AVG(CASE grade
             WHEN 'A'  THEN 4.0 WHEN 'B+' THEN 3.5 WHEN 'B'  THEN 3.0
             WHEN 'C+' THEN 2.5 WHEN 'C'  THEN 2.0 WHEN 'D+' THEN 1.5
             WHEN 'D'  THEN 1.0 WHEN 'F'  THEN 0.0
           END) FILTER (WHERE grade IS NOT NULL AND grade NOT IN ('W','I')),
         2) as gpa,
         SUM(c.credits) FILTER (WHERE e.grade IS NOT NULL AND e.grade NOT IN ('W','I')) as total_credits
       FROM enrollments e
       JOIN courses c ON e.course_id = c.course_id
       WHERE e.student_id = $1`,
      [studentId]
    ),
  ]);
  const gpaRow = gpa.rows[0];
  return { grades: grades.rows, gpa: gpaRow.gpa ? parseFloat(gpaRow.gpa) : null, totalCredits: parseInt(gpaRow.total_credits) || 0 };
};

// ─── LIBRARY ───────────────────────────────────────────────────
const searchBooks = async ({ search = '', dept = '', available = false }) => {
  let query = `
    SELECT b.book_id, b.isbn, b.title, b.author, b.total_copies, b.available_copies,
           d.name as department
    FROM books b
    LEFT JOIN departments d ON b.dept_id = d.dept_id
    WHERE (b.title ILIKE $1 OR b.author ILIKE $1 OR b.isbn ILIKE $1)
  `;
  const params = [`%${search}%`];
  if (dept) {
    params.push(dept);
    query += ` AND d.name = $${params.length}`;
  }
  if (available) query += ' AND b.available_copies > 0';
  query += ' ORDER BY b.title';
  const result = await db.query(query, params);
  return result.rows;
};

const getMyBorrowedBooks = async (studentId) => {
  const result = await db.query(
    `SELECT lr.record_id, lr.borrow_date, lr.due_date, lr.return_date, lr.fine_amount, lr.status,
            b.title as book_title, b.author, b.isbn,
            CASE
              WHEN lr.return_date IS NULL AND CURRENT_DATE > lr.due_date
              THEN (CURRENT_DATE - lr.due_date) * (SELECT fine_per_day FROM library_settings LIMIT 1)
              ELSE lr.fine_amount
            END as current_fine
     FROM library_records lr
     JOIN books b ON lr.book_id = b.book_id
     WHERE lr.student_id = $1
     ORDER BY lr.borrow_date DESC`,
    [studentId]
  );
  return result.rows;
};

module.exports = {
  getStudentDashboard,
  getMyEnrollments, getAvailableCourses, enrollCourse, withdrawCourse,
  getMySchedule, getMyExamSchedule,
  getMyGrades,
  searchBooks, getMyBorrowedBooks,
};
