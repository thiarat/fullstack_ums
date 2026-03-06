const db = require('../config/database');

/**
 * Get dashboard summary statistics
 */
const getDashboardStats = async () => {
  const [students, professors, courses, departments, books, borrowedBooks, logs] = await Promise.all([
    db.query('SELECT COUNT(*) FROM students'),
    db.query('SELECT COUNT(*) FROM professors'),
    db.query('SELECT COUNT(*) FROM courses'),
    db.query('SELECT COUNT(*) FROM departments'),
    db.query('SELECT COUNT(*) FROM books'),
    db.query("SELECT COUNT(*) FROM library_records WHERE status = 'Borrowed'"),
    db.query(`SELECT sl.log_id, sl.action, sl.table_name, sl.record_id, sl.created_at,
                     u.username, r.role_name
              FROM system_logs sl
              LEFT JOIN users u ON sl.user_id = u.user_id
              LEFT JOIN roles r ON u.role_id = r.role_id
              ORDER BY sl.created_at DESC LIMIT 10`),
  ]);

  return {
    counts: {
      students: parseInt(students.rows[0].count),
      professors: parseInt(professors.rows[0].count),
      courses: parseInt(courses.rows[0].count),
      departments: parseInt(departments.rows[0].count),
      books: parseInt(books.rows[0].count),
      borrowedBooks: parseInt(borrowedBooks.rows[0].count),
    },
    recentLogs: logs.rows,
  };
};

// ─── STUDENTS ──────────────────────────────────────────────
const getAllStudents = async ({ page = 1, limit = 20, search = '' }) => {
  const offset = (page - 1) * limit;
  const searchParam = `%${search}%`;

  const [data, count] = await Promise.all([
    db.query(
      `SELECT s.student_id, s.first_name, s.last_name, s.profile_image,
              s.enrollment_date, u.username, u.email, u.is_active, u.last_login
       FROM students s
       JOIN users u ON s.user_id = u.user_id
       WHERE s.first_name ILIKE $1 OR s.last_name ILIKE $1 OR u.username ILIKE $1 OR u.email ILIKE $1
       ORDER BY s.student_id
       LIMIT $2 OFFSET $3`,
      [searchParam, limit, offset]
    ),
    db.query(
      `SELECT COUNT(*) FROM students s JOIN users u ON s.user_id = u.user_id
       WHERE s.first_name ILIKE $1 OR s.last_name ILIKE $1 OR u.username ILIKE $1 OR u.email ILIKE $1`,
      [searchParam]
    ),
  ]);

  return { data: data.rows, total: parseInt(count.rows[0].count), page, limit };
};

const getStudentById = async (studentId) => {
  const result = await db.query(
    `SELECT s.*, u.username, u.email, u.is_active, u.last_login, u.created_at
     FROM students s JOIN users u ON s.user_id = u.user_id
     WHERE s.student_id = $1`,
    [studentId]
  );
  if (result.rows.length === 0) throw { statusCode: 404, message: 'Student not found.' };
  return result.rows[0];
};

const updateStudentStatus = async (studentId, isActive) => {
  const student = await db.query('SELECT user_id FROM students WHERE student_id = $1', [studentId]);
  if (student.rows.length === 0) throw { statusCode: 404, message: 'Student not found.' };

  await db.query('UPDATE users SET is_active = $1 WHERE user_id = $2', [isActive, student.rows[0].user_id]);
  return { student_id: studentId, is_active: isActive };
};

// ─── PROFESSORS ────────────────────────────────────────────
const getAllProfessors = async ({ page = 1, limit = 20, search = '', dept_id = null }) => {
  const offset = (page - 1) * limit;
  const params = [`%${search}%`, limit, offset];
  let deptFilter = '';
  if (dept_id) {
    params.push(dept_id);
    deptFilter = `AND p.dept_id = $${params.length}`;
  }

  const [data, count] = await Promise.all([
    db.query(
      `SELECT p.prof_id, p.first_name, p.last_name, p.profile_image,
              d.name as department, u.username, u.email, u.is_active, u.last_login
       FROM professors p
       JOIN users u ON p.user_id = u.user_id
       LEFT JOIN departments d ON p.dept_id = d.dept_id
       WHERE (p.first_name ILIKE $1 OR p.last_name ILIKE $1 OR u.email ILIKE $1) ${deptFilter}
       ORDER BY p.prof_id LIMIT $2 OFFSET $3`,
      params
    ),
    db.query(
      `SELECT COUNT(*) FROM professors p JOIN users u ON p.user_id = u.user_id
       WHERE (p.first_name ILIKE $1) ${deptFilter}`,
      dept_id ? [`%${search}%`, dept_id] : [`%${search}%`]
    ),
  ]);

  return { data: data.rows, total: parseInt(count.rows[0].count), page, limit };
};

// ─── DEPARTMENTS ───────────────────────────────────────────
const getAllDepartments = async () => {
  const result = await db.query(
    `SELECT d.*, COUNT(DISTINCT p.prof_id) as professor_count, COUNT(DISTINCT c.course_id) as course_count
     FROM departments d
     LEFT JOIN professors p ON d.dept_id = p.dept_id
     LEFT JOIN courses c ON d.dept_id = c.dept_id
     GROUP BY d.dept_id ORDER BY d.name`
  );
  return result.rows;
};

const createDepartment = async ({ name, location }) => {
  const result = await db.query(
    'INSERT INTO departments (name, location) VALUES ($1, $2) RETURNING *',
    [name, location]
  );
  return result.rows[0];
};

const updateDepartment = async (deptId, { name, location }) => {
  const result = await db.query(
    'UPDATE departments SET name = COALESCE($1, name), location = COALESCE($2, location) WHERE dept_id = $3 RETURNING *',
    [name, location, deptId]
  );
  if (result.rows.length === 0) throw { statusCode: 404, message: 'Department not found.' };
  return result.rows[0];
};

const deleteDepartment = async (deptId) => {
  const result = await db.query('DELETE FROM departments WHERE dept_id = $1 RETURNING *', [deptId]);
  if (result.rows.length === 0) throw { statusCode: 404, message: 'Department not found.' };
  return result.rows[0];
};

// ─── COURSES ───────────────────────────────────────────────
const getAllCourses = async ({ page = 1, limit = 20, search = '', dept_id = null }) => {
  const offset = (page - 1) * limit;
  const params = [`%${search}%`, limit, offset];
  let deptFilter = '';
  if (dept_id) { params.push(dept_id); deptFilter = `AND c.dept_id = $${params.length}`; }

  const result = await db.query(
    `SELECT c.course_id, c.course_code, c.title, c.credits,
            d.name as department,
            COUNT(DISTINCT e.enrollment_id) as enrolled_students
     FROM courses c
     LEFT JOIN departments d ON c.dept_id = d.dept_id
     LEFT JOIN enrollments e ON c.course_id = e.course_id
     WHERE (c.title ILIKE $1 OR c.course_code ILIKE $1) ${deptFilter}
     GROUP BY c.course_id, d.name
     ORDER BY c.course_code LIMIT $2 OFFSET $3`,
    params
  );
  return { data: result.rows, page, limit };
};

const createCourse = async ({ course_code, title, credits, dept_id }) => {
  const result = await db.query(
    'INSERT INTO courses (course_code, title, credits, dept_id) VALUES ($1, $2, $3, $4) RETURNING *',
    [course_code, title, credits, dept_id]
  );
  return result.rows[0];
};

const updateCourse = async (courseId, body) => {
  const { course_code, title, credits, dept_id } = body;
  const result = await db.query(
    `UPDATE courses SET
       course_code = COALESCE($1, course_code),
       title = COALESCE($2, title),
       credits = COALESCE($3, credits),
       dept_id = COALESCE($4, dept_id)
     WHERE course_id = $5 RETURNING *`,
    [course_code, title, credits, dept_id, courseId]
  );
  if (result.rows.length === 0) throw { statusCode: 404, message: 'Course not found.' };
  return result.rows[0];
};

const deleteCourse = async (courseId) => {
  const result = await db.query('DELETE FROM courses WHERE course_id = $1 RETURNING *', [courseId]);
  if (result.rows.length === 0) throw { statusCode: 404, message: 'Course not found.' };
  return result.rows[0];
};

// ─── SYSTEM LOGS ───────────────────────────────────────────
const getSystemLogs = async ({ page = 1, limit = 50 }) => {
  const offset = (page - 1) * limit;
  const [data, count] = await Promise.all([
    db.query(
      `SELECT sl.*, u.username, r.role_name
       FROM system_logs sl
       LEFT JOIN users u ON sl.user_id = u.user_id
       LEFT JOIN roles r ON u.role_id = r.role_id
       ORDER BY sl.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    db.query('SELECT COUNT(*) FROM system_logs'),
  ]);
  return { data: data.rows, total: parseInt(count.rows[0].count), page, limit };
};

module.exports = {
  getDashboardStats,
  getAllStudents, getStudentById, updateStudentStatus,
  getAllProfessors,
  getAllDepartments, createDepartment, updateDepartment, deleteDepartment,
  getAllCourses, createCourse, updateCourse, deleteCourse,
  getSystemLogs,
};
