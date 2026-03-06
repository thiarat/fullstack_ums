const db = require('../config/database');

// ─── DASHBOARD ─────────────────────────────────────────────────
const getProfessorDashboard = async (profId) => {
  const [profile, myCourses, pendingGrades, upcomingExams] = await Promise.all([
    db.query(
      `SELECT p.prof_id, p.first_name, p.last_name, p.profile_image,
              d.name as department, u.username, u.email, u.last_login
       FROM professors p
       JOIN users u ON p.user_id = u.user_id
       LEFT JOIN departments d ON p.dept_id = d.dept_id
       WHERE p.prof_id = $1`,
      [profId]
    ),
    db.query(
      `SELECT COUNT(DISTINCT cs.course_id) FROM class_schedules cs WHERE cs.prof_id = $1`,
      [profId]
    ),
    db.query(
      `SELECT COUNT(*) FROM enrollments e
       JOIN class_schedules cs ON e.course_id = cs.course_id
       WHERE cs.prof_id = $1 AND e.grade IS NULL`,
      [profId]
    ),
    db.query(
      `SELECT es.exam_type, es.exam_date, es.start_time, es.end_time, es.room_number,
              c.course_code, c.title as course_title
       FROM exam_schedules es
       JOIN courses c ON es.course_id = c.course_id
       JOIN class_schedules cs ON c.course_id = cs.course_id
       WHERE cs.prof_id = $1
         AND es.exam_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
       ORDER BY es.exam_date, es.start_time`,
      [profId]
    ),
  ]);

  if (profile.rows.length === 0) throw { statusCode: 404, message: 'Professor not found.' };

  return {
    profile: profile.rows[0],
    stats: {
      myCourses: parseInt(myCourses.rows[0].count),
      pendingGrades: parseInt(pendingGrades.rows[0].count),
    },
    upcomingExams: upcomingExams.rows,
  };
};

// ─── MY COURSES ────────────────────────────────────────────────
const getMyCourses = async (profId) => {
  const result = await db.query(
    `SELECT c.course_id, c.course_code, c.title, c.credits,
            d.name as department,
            cs.schedule_id, cs.day_of_week, cs.start_time, cs.end_time, cs.room_number,
            COUNT(e.enrollment_id) as enrolled_students
     FROM class_schedules cs
     JOIN courses c ON cs.course_id = c.course_id
     LEFT JOIN departments d ON c.dept_id = d.dept_id
     LEFT JOIN enrollments e ON c.course_id = e.course_id
     WHERE cs.prof_id = $1
     GROUP BY c.course_id, d.name, cs.schedule_id
     ORDER BY cs.day_of_week, cs.start_time`,
    [profId]
  );
  return result.rows;
};

const getCourseStudents = async (profId, courseId) => {
  // Verify prof owns this course schedule
  const owns = await db.query(
    'SELECT schedule_id FROM class_schedules WHERE prof_id = $1 AND course_id = $2',
    [profId, courseId]
  );
  if (owns.rows.length === 0) throw { statusCode: 403, message: 'You do not teach this course.' };

  const result = await db.query(
    `SELECT e.enrollment_id, e.grade, e.semester,
            s.student_id, s.first_name, s.last_name, s.profile_image,
            u.username as student_code, u.email
     FROM enrollments e
     JOIN students s ON e.student_id = s.student_id
     JOIN users u ON s.user_id = u.user_id
     WHERE e.course_id = $1
     ORDER BY s.last_name, s.first_name`,
    [courseId]
  );
  return result.rows;
};

// ─── GRADE ENTRY ───────────────────────────────────────────────
const submitGrade = async (profId, enrollmentId, grade) => {
  const validGrades = ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F', 'W', 'I'];
  if (!validGrades.includes(grade)) {
    throw { statusCode: 400, message: `Invalid grade. Must be one of: ${validGrades.join(', ')}` };
  }

  // Verify prof teaches this enrollment's course
  const check = await db.query(
    `SELECT e.enrollment_id FROM enrollments e
     JOIN class_schedules cs ON e.course_id = cs.course_id
     WHERE e.enrollment_id = $1 AND cs.prof_id = $2`,
    [enrollmentId, profId]
  );
  if (check.rows.length === 0) {
    throw { statusCode: 403, message: 'You are not authorized to grade this enrollment.' };
  }

  const result = await db.query(
    'UPDATE enrollments SET grade = $1 WHERE enrollment_id = $2 RETURNING *',
    [grade, enrollmentId]
  );
  return result.rows[0];
};

const submitBulkGrades = async (profId, courseId, grades) => {
  // grades = [{ enrollment_id, grade }]
  const owns = await db.query(
    'SELECT schedule_id FROM class_schedules WHERE prof_id = $1 AND course_id = $2',
    [profId, courseId]
  );
  if (owns.rows.length === 0) throw { statusCode: 403, message: 'You do not teach this course.' };

  const validGrades = ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F', 'W', 'I'];
  const client = await db.getClient();

  try {
    await client.query('BEGIN');
    const results = [];
    for (const { enrollment_id, grade } of grades) {
      if (!validGrades.includes(grade)) {
        throw { statusCode: 400, message: `Invalid grade "${grade}" for enrollment_id ${enrollment_id}` };
      }
      const r = await client.query(
        'UPDATE enrollments SET grade = $1 WHERE enrollment_id = $2 AND course_id = $3 RETURNING *',
        [grade, enrollment_id, courseId]
      );
      if (r.rows.length > 0) results.push(r.rows[0]);
    }
    await client.query('COMMIT');
    return results;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ─── SCHEDULE ──────────────────────────────────────────────────
const getMySchedule = async (profId) => {
  const result = await db.query(
    `SELECT cs.schedule_id, cs.day_of_week, cs.start_time, cs.end_time, cs.room_number,
            c.course_id, c.course_code, c.title, c.credits,
            COUNT(e.enrollment_id) as enrolled_students
     FROM class_schedules cs
     JOIN courses c ON cs.course_id = c.course_id
     LEFT JOIN enrollments e ON c.course_id = e.course_id
     WHERE cs.prof_id = $1
     GROUP BY cs.schedule_id, c.course_id
     ORDER BY CASE cs.day_of_week
       WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
       WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5
       WHEN 'Saturday' THEN 6 WHEN 'Sunday' THEN 7 END,
       cs.start_time`,
    [profId]
  );
  return result.rows;
};

const createSchedule = async (profId, { course_id, day_of_week, start_time, end_time, room_number }) => {
  // Check for time conflict in same room
  const conflict = await db.query(
    `SELECT schedule_id FROM class_schedules
     WHERE room_number = $1 AND day_of_week = $2
       AND NOT (end_time <= $3 OR start_time >= $4)`,
    [room_number, day_of_week, start_time, end_time]
  );
  if (conflict.rows.length > 0) {
    throw { statusCode: 409, message: 'Room conflict: another class is scheduled in this room at that time.' };
  }

  const result = await db.query(
    `INSERT INTO class_schedules (course_id, prof_id, day_of_week, start_time, end_time, room_number)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [course_id, profId, day_of_week, start_time, end_time, room_number]
  );
  return result.rows[0];
};

const deleteSchedule = async (profId, scheduleId) => {
  const result = await db.query(
    'DELETE FROM class_schedules WHERE schedule_id = $1 AND prof_id = $2 RETURNING *',
    [scheduleId, profId]
  );
  if (result.rows.length === 0) throw { statusCode: 404, message: 'Schedule not found or unauthorized.' };
  return result.rows[0];
};

// ─── EXAM SCHEDULE ─────────────────────────────────────────────
const getMyExamSchedule = async (profId) => {
  const result = await db.query(
    `SELECT es.exam_id, es.exam_type, es.exam_date, es.start_time, es.end_time, es.room_number,
            c.course_code, c.title as course_title
     FROM exam_schedules es
     JOIN courses c ON es.course_id = c.course_id
     JOIN class_schedules cs ON c.course_id = cs.course_id
     WHERE cs.prof_id = $1
     ORDER BY es.exam_date, es.start_time`,
    [profId]
  );
  return result.rows;
};

const createExamSchedule = async (profId, { course_id, exam_type, exam_date, start_time, end_time, room_number }) => {
  const owns = await db.query(
    'SELECT schedule_id FROM class_schedules WHERE prof_id = $1 AND course_id = $2',
    [profId, course_id]
  );
  if (owns.rows.length === 0) throw { statusCode: 403, message: 'You do not teach this course.' };

  const result = await db.query(
    `INSERT INTO exam_schedules (course_id, exam_type, exam_date, start_time, end_time, room_number)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [course_id, exam_type || 'Final', exam_date, start_time, end_time, room_number]
  );
  return result.rows[0];
};

// replaced below


// ─── SCHEDULE MANAGEMENT (NEW) ─────────────────────────────────
const addCourseSchedule = async (profId, { course_id, day_of_week, start_time, end_time, room_number }) => {
  // ตรวจว่าเป็นวิชาที่ prof สอนอยู่แล้ว หรือ course อยู่ใน dept ของ prof
  const courseCheck = await db.query('SELECT course_id FROM courses WHERE course_id = $1', [course_id]);
  if (courseCheck.rows.length === 0) throw { statusCode: 404, message: 'ไม่พบรายวิชา' };

  // เช็คเวลาทับของ prof เอง
  const conflict = await db.query(
    `SELECT c.course_code, c.title, cs.start_time, cs.end_time
     FROM class_schedules cs
     JOIN courses c ON cs.course_id = c.course_id
     WHERE cs.prof_id = $1 AND cs.day_of_week = $2
       AND cs.start_time < $4 AND cs.end_time > $3`,
    [profId, day_of_week, start_time, end_time]
  );
  if (conflict.rows.length > 0) {
    const c = conflict.rows[0];
    throw { statusCode: 409, message: `เวลาทับกับ ${c.course_code} ${c.title} (${c.start_time}–${c.end_time})` };
  }

  const result = await db.query(
    `INSERT INTO class_schedules (course_id, prof_id, day_of_week, start_time, end_time, room_number)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [course_id, profId, day_of_week, start_time, end_time, room_number]
  );
  return result.rows[0];
};

const updateCourseSchedule = async (profId, scheduleId, { day_of_week, start_time, end_time, room_number }) => {
  // ตรวจว่า schedule นี้เป็นของ prof คนนี้
  const owns = await db.query(
    'SELECT schedule_id FROM class_schedules WHERE schedule_id = $1 AND prof_id = $2',
    [scheduleId, profId]
  );
  if (owns.rows.length === 0) throw { statusCode: 403, message: 'ไม่มีสิทธิ์แก้ไขตารางสอนนี้' };

  const result = await db.query(
    `UPDATE class_schedules SET
       day_of_week  = COALESCE($1, day_of_week),
       start_time   = COALESCE($2, start_time),
       end_time     = COALESCE($3, end_time),
       room_number  = COALESCE($4, room_number)
     WHERE schedule_id = $5 RETURNING *`,
    [day_of_week, start_time, end_time, room_number, scheduleId]
  );
  return result.rows[0];
};

const deleteCourseSchedule = async (profId, scheduleId) => {
  const result = await db.query(
    'DELETE FROM class_schedules WHERE schedule_id = $1 AND prof_id = $2 RETURNING *',
    [scheduleId, profId]
  );
  if (result.rows.length === 0) throw { statusCode: 404, message: 'ไม่พบตารางสอน หรือไม่มีสิทธิ์ลบ' };
  return { deleted: true, schedule_id: scheduleId };
};

const getDeptCourses = async (profId) => {
  // ดึงวิชาทั้งหมดในแผนกเดียวกับอาจารย์ (สำหรับเลือกเพิ่มตารางสอน)
  const result = await db.query(
    `SELECT c.course_id, c.course_code, c.title, c.credits,
            d.name as department
     FROM courses c
     LEFT JOIN departments d ON c.dept_id = d.dept_id
     WHERE c.dept_id = (
       SELECT dept_id FROM professors WHERE prof_id = $1
     )
     ORDER BY c.course_code`,
    [profId]
  );
  return result.rows;
};

module.exports = {
  getProfessorDashboard,
  getMyCourses, getDeptCourses, getCourseStudents,
  submitGrade, submitBulkGrades,
  getMySchedule, getMyExamSchedule,
  addCourseSchedule, updateCourseSchedule, deleteCourseSchedule,
  createExamSchedule,
};
