const db = require('../config/database');
const bcrypt = require('bcryptjs');

// ─── DASHBOARD ─────────────────────────────────────────────────
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

// ─── STUDENTS ──────────────────────────────────────────────────
const getAllStudents = async ({ page = 1, limit = 20, search = '' }) => {
  const offset = (page - 1) * limit;
  const searchParam = `%${search}%`;
  const [data, count] = await Promise.all([
    db.query(
      `SELECT s.student_id, s.first_name, s.last_name, s.profile_image,
              s.enrollment_date, u.user_id, u.username, u.email, u.is_active, u.last_login
       FROM students s
       JOIN users u ON s.user_id = u.user_id
       WHERE s.first_name ILIKE $1 OR s.last_name ILIKE $1 OR u.username ILIKE $1 OR u.email ILIKE $1
       ORDER BY s.student_id LIMIT $2 OFFSET $3`,
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
    `SELECT s.*, u.user_id, u.username, u.email, u.is_active, u.last_login, u.created_at
     FROM students s JOIN users u ON s.user_id = u.user_id
     WHERE s.student_id = $1`,
    [studentId]
  );
  if (result.rows.length === 0) throw { statusCode: 404, message: 'Student not found.' };
  return result.rows[0];
};

// get student schedule for admin popup — join via schedule_id
const getStudentSchedule = async (studentId) => {
  const result = await db.query(
    `SELECT cs.schedule_id, cs.day_of_week, cs.start_time, cs.end_time, cs.room_number,
            c.course_code, c.title as course_title, c.credits,
            p.first_name || ' ' || p.last_name as professor_name
     FROM enrollments e
     JOIN class_schedules cs ON e.schedule_id = cs.schedule_id
     JOIN courses c ON cs.course_id = c.course_id
     LEFT JOIN professors p ON cs.prof_id = p.prof_id
     WHERE e.student_id = $1 AND (e.grade IS NULL OR e.grade NOT IN ('W','F'))
     ORDER BY
       CASE cs.day_of_week
         WHEN 'Monday'    THEN 1 WHEN 'Tuesday'   THEN 2
         WHEN 'Wednesday' THEN 3 WHEN 'Thursday'  THEN 4
         WHEN 'Friday'    THEN 5 WHEN 'Saturday'  THEN 6
         WHEN 'Sunday'    THEN 7
       END, cs.start_time`,
    [studentId]
  );
  return result.rows;
};

const updateStudentStatus = async (studentId, isActive) => {
  const student = await db.query('SELECT user_id FROM students WHERE student_id = $1', [studentId]);
  if (student.rows.length === 0) throw { statusCode: 404, message: 'Student not found.' };
  await db.query('UPDATE users SET is_active = $1 WHERE user_id = $2', [isActive, student.rows[0].user_id]);
  return { student_id: studentId, is_active: isActive };
};

// create user (student or professor)
const createUser = async ({ username, password, email, role_name, first_name, last_name, dept_id }) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const existing = await client.query(
      'SELECT user_id FROM users WHERE username = $1 OR email = $2', [username, email]
    );
    if (existing.rows.length > 0) throw { statusCode: 409, message: 'Username หรือ Email ซ้ำในระบบ' };
    const role = await client.query('SELECT role_id FROM roles WHERE role_name = $1', [role_name]);
    if (role.rows.length === 0) throw { statusCode: 400, message: 'Role ไม่ถูกต้อง' };
    const hash = await bcrypt.hash(password, 10);
    const userResult = await client.query(
      'INSERT INTO users (username, password_secure, email, role_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, hash, email, role.rows[0].role_id]
    );
    const user = userResult.rows[0];
    if (role_name === 'Student') {
      await client.query(
        'INSERT INTO students (user_id, first_name, last_name) VALUES ($1, $2, $3)',
        [user.user_id, first_name, last_name]
      );
    } else if (role_name === 'Professor') {
      await client.query(
        'INSERT INTO professors (user_id, first_name, last_name, dept_id) VALUES ($1, $2, $3, $4)',
        [user.user_id, first_name, last_name, dept_id || null]
      );
    }
    await client.query('COMMIT');
    return { user_id: user.user_id, username, email, role_name, first_name, last_name };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const updateUser = async (userId, { first_name, last_name, email, dept_id }) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const roleRes = await client.query(
      `SELECT r.role_name, s.student_id, p.prof_id
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN students s ON u.user_id = s.user_id
       LEFT JOIN professors p ON u.user_id = p.user_id
       WHERE u.user_id = $1`, [userId]
    );
    if (roleRes.rows.length === 0) throw { statusCode: 404, message: 'User not found.' };
    const { role_name, student_id, prof_id } = roleRes.rows[0];
    if (email) await client.query('UPDATE users SET email = $1 WHERE user_id = $2', [email, userId]);
    if (role_name === 'Student' && student_id) {
      await client.query(
        'UPDATE students SET first_name = COALESCE($1,first_name), last_name = COALESCE($2,last_name) WHERE student_id = $3',
        [first_name, last_name, student_id]
      );
    } else if (role_name === 'Professor' && prof_id) {
      await client.query(
        `UPDATE professors SET
           first_name = COALESCE($1,first_name),
           last_name  = COALESCE($2,last_name),
           dept_id    = COALESCE($3,dept_id)
         WHERE prof_id = $4`,
        [first_name, last_name, dept_id, prof_id]
      );
    }
    await client.query('COMMIT');
    return { user_id: userId, updated: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const deleteUser = async (userId) => {
  const check = await db.query('SELECT user_id FROM users WHERE user_id = $1', [userId]);
  if (check.rows.length === 0) throw { statusCode: 404, message: 'User not found.' };
  await db.query('DELETE FROM users WHERE user_id = $1', [userId]);
  return { deleted: true };
};

const adminResetPassword = async (userId, newPassword) => {
  const check = await db.query('SELECT user_id FROM users WHERE user_id = $1', [userId]);
  if (check.rows.length === 0) throw { statusCode: 404, message: 'User not found.' };
  const hash = await bcrypt.hash(newPassword, 10);
  await db.query('UPDATE users SET password_secure = $1 WHERE user_id = $2', [hash, userId]);
  return { user_id: userId, reset: true };
};

const getPasswordResetRequests = async () => {
  const result = await db.query(
    `SELECT pr.request_id, pr.user_id, pr.status, pr.created_at,
            u.username, u.email, r.role_name,
            COALESCE(s.first_name, p.first_name) as first_name,
            COALESCE(s.last_name,  p.last_name)  as last_name
     FROM password_reset_requests pr
     JOIN users u   ON pr.user_id = u.user_id
     JOIN roles r   ON u.role_id  = r.role_id
     LEFT JOIN students s   ON u.user_id = s.user_id
     LEFT JOIN professors p ON u.user_id = p.user_id
     WHERE pr.status = 'pending'
     ORDER BY pr.created_at DESC`
  );
  return result.rows;
};

const approvePasswordReset = async (requestId, newPassword, adminUserId) => {
  const req = await db.query(
    `SELECT * FROM password_reset_requests WHERE request_id = $1 AND status = 'pending'`,
    [requestId]
  );
  if (req.rows.length === 0) throw { statusCode: 404, message: 'Request not found or already processed.' };
  const hash = await bcrypt.hash(newPassword, 10);
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE users SET password_secure = $1 WHERE user_id = $2', [hash, req.rows[0].user_id]);
    await client.query(
      `UPDATE password_reset_requests SET status = 'approved', resolved_at = NOW(), resolved_by = $1 WHERE request_id = $2`,
      [adminUserId, requestId]
    );
    await client.query('COMMIT');
    return { approved: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const rejectPasswordReset = async (requestId, adminUserId) => {
  const result = await db.query(
    `UPDATE password_reset_requests SET status = 'rejected', resolved_at = NOW(), resolved_by = $1
     WHERE request_id = $2 AND status = 'pending' RETURNING *`,
    [adminUserId, requestId]
  );
  if (result.rows.length === 0) throw { statusCode: 404, message: 'Request not found.' };
  return { rejected: true };
};

// ─── PROFESSORS ────────────────────────────────────────────────
const getAllProfessors = async ({ page = 1, limit = 20, search = '', dept_id = null }) => {
  const offset = (page - 1) * limit;
  const params = [`%${search}%`, limit, offset];
  let deptFilter = '';
  if (dept_id) { params.push(dept_id); deptFilter = `AND p.dept_id = $${params.length}`; }

  const [data, count] = await Promise.all([
    db.query(
      `SELECT p.prof_id, p.first_name, p.last_name, p.profile_image,
              d.name as department, u.user_id, u.username, u.email, u.is_active, u.last_login
       FROM professors p
       JOIN users u ON p.user_id = u.user_id
       LEFT JOIN departments d ON p.dept_id = d.dept_id
       WHERE (p.first_name ILIKE $1 OR p.last_name ILIKE $1 OR u.email ILIKE $1) ${deptFilter}
       ORDER BY p.prof_id LIMIT $2 OFFSET $3`,
      params
    ),
    db.query(
      `SELECT COUNT(*) FROM professors p JOIN users u ON p.user_id = u.user_id
       WHERE (p.first_name ILIKE $1 OR p.last_name ILIKE $1) ${deptFilter}`,
      dept_id ? [`%${search}%`, dept_id] : [`%${search}%`]
    ),
  ]);
  return { data: data.rows, total: parseInt(count.rows[0].count), page, limit };
};

// get professor schedule for admin popup — use schedule_id join for enrollment count
const getProfSchedule = async (profId) => {
  const result = await db.query(
    `SELECT cs.schedule_id, cs.day_of_week, cs.start_time, cs.end_time, cs.room_number,
            c.course_code, c.title as course_title, c.credits,
            COUNT(DISTINCT e.enrollment_id) as enrolled_students
     FROM class_schedules cs
     JOIN courses c ON cs.course_id = c.course_id
     LEFT JOIN enrollments e ON cs.schedule_id = e.schedule_id
       AND (e.grade IS NULL OR e.grade NOT IN ('W','F'))
     WHERE cs.prof_id = $1
     GROUP BY cs.schedule_id, c.course_id
     ORDER BY
       CASE cs.day_of_week
         WHEN 'Monday'    THEN 1 WHEN 'Tuesday'   THEN 2
         WHEN 'Wednesday' THEN 3 WHEN 'Thursday'  THEN 4
         WHEN 'Friday'    THEN 5 WHEN 'Saturday'  THEN 6
         WHEN 'Sunday'    THEN 7
       END, cs.start_time`,
    [profId]
  );
  return result.rows;
};

// get course schedule for admin popup — use schedule_id join
const getCourseSchedule = async (courseId) => {
  const result = await db.query(
    `SELECT cs.schedule_id, cs.day_of_week, cs.start_time, cs.end_time, cs.room_number,
            p.first_name || ' ' || p.last_name as professor_name,
            p.prof_id,
            COUNT(DISTINCT e.enrollment_id) as enrolled_students
     FROM class_schedules cs
     LEFT JOIN professors p ON cs.prof_id = p.prof_id
     LEFT JOIN enrollments e ON cs.schedule_id = e.schedule_id
       AND (e.grade IS NULL OR e.grade NOT IN ('W','F'))
     WHERE cs.course_id = $1
     GROUP BY cs.schedule_id, p.prof_id
     ORDER BY
       CASE cs.day_of_week
         WHEN 'Monday'    THEN 1 WHEN 'Tuesday'   THEN 2
         WHEN 'Wednesday' THEN 3 WHEN 'Thursday'  THEN 4
         WHEN 'Friday'    THEN 5 WHEN 'Saturday'  THEN 6
         WHEN 'Sunday'    THEN 7
       END, cs.start_time`,
    [courseId]
  );
  return result.rows;
};

// ─── DEPARTMENTS ───────────────────────────────────────────────
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

// ─── COURSES ───────────────────────────────────────────────────
const getAllCourses = async ({ page = 1, limit = 20, search = '', dept_id = null }) => {
  const offset = (page - 1) * limit;
  const params = [`%${search}%`, limit, offset];
  let deptFilter = '';
  if (dept_id) { params.push(dept_id); deptFilter = `AND c.dept_id = $${params.length}`; }

  const result = await db.query(
    `SELECT c.course_id, c.course_code, c.title, c.credits,
            d.name as department,
            COUNT(DISTINCT cs.prof_id) as professor_count
     FROM courses c
     LEFT JOIN departments d ON c.dept_id = d.dept_id
     LEFT JOIN class_schedules cs ON c.course_id = cs.course_id
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
       course_code = COALESCE($1, course_code), title = COALESCE($2, title),
       credits = COALESCE($3, credits), dept_id = COALESCE($4, dept_id)
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

// ─── COURSES-PROFS LIST (รายวิชา-อาจารย์) ─────────────────────
// Returns one row per (course × professor schedule) with enrolled student count
const getCourseProfList = async ({ search = '', dept_id = null } = {}) => {
  const params = [`%${search}%`];
  let deptFilter = '';
  if (dept_id) { params.push(dept_id); deptFilter = `AND c.dept_id = $${params.length}`; }

  const result = await db.query(
    `SELECT cs.schedule_id,
            c.course_id, c.course_code, c.title, c.credits,
            d.name as department,
            p.prof_id,
            p.first_name || ' ' || p.last_name as professor_name,
            cs.day_of_week, cs.start_time, cs.end_time, cs.room_number,
            COUNT(DISTINCT e.enrollment_id) as enrolled_students
     FROM class_schedules cs
     JOIN courses c ON cs.course_id = c.course_id
     LEFT JOIN departments d ON c.dept_id = d.dept_id
     LEFT JOIN professors p ON cs.prof_id = p.prof_id
     LEFT JOIN enrollments e ON e.schedule_id = cs.schedule_id
       AND (e.grade IS NULL OR e.grade NOT IN ('W','F'))
     WHERE (c.title ILIKE $1 OR c.course_code ILIKE $1
            OR p.first_name ILIKE $1 OR p.last_name ILIKE $1) ${deptFilter}
     GROUP BY cs.schedule_id, c.course_id, d.dept_id, p.prof_id
     ORDER BY c.course_code, p.last_name`,
    params
  );
  return result.rows;
};

// Returns students enrolled in a specific schedule (for popup)
const getCourseProfStudents = async (scheduleId) => {
  const result = await db.query(
    `SELECT e.enrollment_id, e.grade, e.semester,
            s.student_id, s.first_name, s.last_name,
            u.email, u.username as student_code
     FROM enrollments e
     JOIN students s ON e.student_id = s.student_id
     JOIN users u ON s.user_id = u.user_id
     WHERE e.schedule_id = $1
       AND (e.grade IS NULL OR e.grade NOT IN ('W'))
     ORDER BY s.last_name, s.first_name`,
    [scheduleId]
  );
  return result.rows;
};

// ─── SYSTEM LOGS ───────────────────────────────────────────────
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
  getAllStudents, getStudentById, getStudentSchedule, updateStudentStatus,
  createUser, updateUser, deleteUser,
  adminResetPassword, getPasswordResetRequests, approvePasswordReset, rejectPasswordReset,
  getAllProfessors, getProfSchedule,
  getAllDepartments, createDepartment, updateDepartment, deleteDepartment,
  getAllCourses, createCourse, updateCourse, deleteCourse, getCourseSchedule,
  getCourseProfList, getCourseProfStudents,
  getSystemLogs,
};
