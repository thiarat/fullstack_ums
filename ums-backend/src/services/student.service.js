const db = require('../config/database');

// ─── DASHBOARD ─────────────────────────────────────────────────
const getStudentDashboard = async (studentId) => {
  const [profile, enrollments, upcomingExams, borrowedBooks] = await Promise.all([
    // Profile
    db.query(
      `SELECT s.student_id, s.first_name, s.last_name, s.profile_image, s.enrollment_date,
              u.username, u.email, u.last_login
       FROM students s JOIN users u ON s.user_id = u.user_id
       WHERE s.student_id = $1`,
      [studentId]
    ),
    // Active enrollments count
    db.query(
      `SELECT COUNT(*) FROM enrollments WHERE student_id = $1`,
      [studentId]
    ),
    // Upcoming exams (next 30 days)
    db.query(
      `SELECT e.exam_type, e.exam_date, e.start_time, e.end_time, e.room_number,
              c.course_code, c.title as course_title
       FROM exam_schedules e
       JOIN courses c ON e.course_id = c.course_id
       JOIN enrollments en ON c.course_id = en.course_id
       WHERE en.student_id = $1
         AND e.exam_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
       ORDER BY e.exam_date, e.start_time`,
      [studentId]
    ),
    // Borrowed books
    db.query(
      `SELECT COUNT(*) FROM library_records
       WHERE student_id = $1 AND status = 'Borrowed'`,
      [studentId]
    ),
  ]);

  if (profile.rows.length === 0) throw { statusCode: 404, message: 'Student not found.' };

  return {
    profile: profile.rows[0],
    stats: {
      enrolledCourses: parseInt(enrollments.rows[0].count),
      borrowedBooks: parseInt(borrowedBooks.rows[0].count),
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
           p.first_name || ' ' || p.last_name as professor_name
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
  // Courses not yet enrolled in current semester
  const result = await db.query(
    `SELECT c.course_id, c.course_code, c.title, c.credits,
            d.name as department,
            p.first_name || ' ' || p.last_name as professor_name,
            cs.day_of_week, cs.start_time, cs.end_time, cs.room_number,
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
              cs.day_of_week, cs.start_time, cs.end_time, cs.room_number
     ORDER BY c.course_code`,
    [studentId]
  );
  return result.rows;
};

const enrollCourse = async (studentId, courseId, semester) => {
  // Check already enrolled
  const existing = await db.query(
    'SELECT enrollment_id FROM enrollments WHERE student_id = $1 AND course_id = $2 AND semester = $3',
    [studentId, courseId, semester]
  );
  if (existing.rows.length > 0) {
    throw { statusCode: 409, message: 'Already enrolled in this course for this semester.' };
  }

  // Check course exists
  const course = await db.query('SELECT course_id FROM courses WHERE course_id = $1', [courseId]);
  if (course.rows.length === 0) throw { statusCode: 404, message: 'Course not found.' };

  const result = await db.query(
    'INSERT INTO enrollments (student_id, course_id, semester) VALUES ($1, $2, $3) RETURNING *',
    [studentId, courseId, semester]
  );
  return result.rows[0];
};

const withdrawCourse = async (studentId, enrollmentId) => {
  const result = await db.query(
    `UPDATE enrollments SET grade = 'W'
     WHERE enrollment_id = $1 AND student_id = $2
     RETURNING *`,
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
     WHERE e.student_id = $1
     ORDER BY CASE cs.day_of_week
       WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
       WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5
       WHEN 'Saturday' THEN 6 WHEN 'Sunday' THEN 7 END,
       cs.start_time`,
    [studentId]
  );
  return result.rows;
};

// ─── EXAM SCHEDULE ─────────────────────────────────────────────
const getMyExamSchedule = async (studentId) => {
  const result = await db.query(
    `SELECT es.exam_id, es.exam_type, es.exam_date, es.start_time, es.end_time, es.room_number,
            c.course_code, c.title as course_title
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
  const result = await db.query(
    `SELECT e.enrollment_id, e.grade, e.semester,
            c.course_code, c.title, c.credits
     FROM enrollments e
     JOIN courses c ON e.course_id = c.course_id
     WHERE e.student_id = $1
     ORDER BY e.semester DESC, c.course_code`,
    [studentId]
  );

  // Calculate GPA
  const gradePoints = { 'A': 4.0, 'B+': 3.5, 'B': 3.0, 'C+': 2.5, 'C': 2.0, 'D+': 1.5, 'D': 1.0, 'F': 0.0 };
  let totalCredits = 0, totalPoints = 0;
  result.rows.forEach(row => {
    if (row.grade && gradePoints[row.grade] !== undefined) {
      totalCredits += row.credits;
      totalPoints += gradePoints[row.grade] * row.credits;
    }
  });

  const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : null;
  return { grades: result.rows, gpa, totalCredits };
};

// ─── LIBRARY ───────────────────────────────────────────────────
const getMyBorrowedBooks = async (studentId) => {
  const result = await db.query(
    `SELECT lr.record_id, lr.borrow_date, lr.due_date, lr.return_date,
            lr.fine_amount, lr.status,
            b.isbn, b.title, b.author,
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

const searchBooks = async ({ search = '', page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const result = await db.query(
    `SELECT book_id, isbn, title, author, total_copies, available_copies,
            CASE WHEN available_copies > 0 THEN true ELSE false END as is_available
     FROM books
     WHERE title ILIKE $1 OR author ILIKE $1 OR isbn ILIKE $1
     ORDER BY title LIMIT $2 OFFSET $3`,
    [`%${search}%`, limit, offset]
  );
  return result.rows;
};

module.exports = {
  getStudentDashboard,
  getMyEnrollments, getAvailableCourses, enrollCourse, withdrawCourse,
  getMySchedule,
  getMyExamSchedule,
  getMyGrades,
  getMyBorrowedBooks, searchBooks,
};
