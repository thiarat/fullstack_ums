const adminService = require('../services/admin.service');
const { logAction } = require('../services/systemLog.service');

const wrap = (fn) => async (req, res, next) => {
  try {
    const data = await fn(req, res);
    if (data !== undefined) res.json({ success: true, data });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

// Dashboard
exports.getDashboard = wrap(async (req) => adminService.getDashboardStats());

// Students
exports.getStudents   = wrap(async (req) => adminService.getAllStudents(req.query));
exports.getStudentById = wrap(async (req) => adminService.getStudentById(+req.params.id));

// NEW: student schedule popup
exports.getStudentSchedule = wrap(async (req) => adminService.getStudentSchedule(+req.params.id));

exports.updateStudentStatus = wrap(async (req) => {
  const r = await adminService.updateStudentStatus(+req.params.id, req.body.is_active);
  await logAction(req.user.user_id, `UPDATE student status → ${req.body.is_active}`, 'users', +req.params.id);
  return r;
});

// NEW: create user
exports.createUser = wrap(async (req) => {
  const r = await adminService.createUser(req.body);
  await logAction(req.user.user_id, `CREATE user: ${req.body.username} (${req.body.role_name})`, 'users', r.user_id);
  return r;
});

// NEW: update user
exports.updateUser = wrap(async (req) => {
  const r = await adminService.updateUser(+req.params.id, req.body);
  await logAction(req.user.user_id, `UPDATE user info`, 'users', +req.params.id);
  return r;
});

// NEW: delete user
exports.deleteUser = wrap(async (req) => {
  const r = await adminService.deleteUser(+req.params.id);
  await logAction(req.user.user_id, `DELETE user`, 'users', +req.params.id);
  return r;
});

// NEW: reset password directly
exports.adminResetPassword = wrap(async (req) => {
  const r = await adminService.adminResetPassword(+req.params.id, req.body.new_password);
  await logAction(req.user.user_id, `RESET password for user`, 'users', +req.params.id);
  return r;
});

// NEW: password reset requests list + history
exports.getPasswordResetRequests = wrap(async () => adminService.getPasswordResetRequests());
exports.getPasswordResetHistory   = wrap(async () => adminService.getPasswordResetHistory());

// NEW: approve reset request
exports.approvePasswordReset = wrap(async (req) => {
  const r = await adminService.approvePasswordReset(+req.params.requestId, req.body.new_password, req.user.user_id);
  await logAction(req.user.user_id, `APPROVE password reset request`, 'password_reset_requests', +req.params.requestId);
  return r;
});

// NEW: reject reset request
exports.rejectPasswordReset = wrap(async (req) => {
  const r = await adminService.rejectPasswordReset(+req.params.requestId, req.user.user_id);
  await logAction(req.user.user_id, `REJECT password reset request`, 'password_reset_requests', +req.params.requestId);
  return r;
});

// Professors
exports.getProfessors    = wrap(async (req) => adminService.getAllProfessors(req.query));
exports.getProfSchedule  = wrap(async (req) => adminService.getProfSchedule(+req.params.id));

// Departments
exports.getDepartments    = wrap(async (req) => adminService.getAllDepartments());
exports.createDepartment  = wrap(async (req) => {
  const r = await adminService.createDepartment(req.body);
  await logAction(req.user.user_id, `CREATE department: ${req.body.name}`, 'departments', r.dept_id);
  return r;
});
exports.updateDepartment  = wrap(async (req) => {
  const r = await adminService.updateDepartment(+req.params.id, req.body);
  await logAction(req.user.user_id, `UPDATE department`, 'departments', +req.params.id);
  return r;
});
exports.deleteDepartment  = wrap(async (req) => {
  const r = await adminService.deleteDepartment(+req.params.id);
  await logAction(req.user.user_id, `DELETE department`, 'departments', +req.params.id);
  return r;
});

// Courses
exports.getCourses        = wrap(async (req) => adminService.getAllCourses(req.query));
exports.getCourseSchedule = wrap(async (req) => adminService.getCourseSchedule(+req.params.id));
exports.createCourse  = wrap(async (req) => {
  const r = await adminService.createCourse(req.body);
  await logAction(req.user.user_id, `CREATE course: ${req.body.course_code}`, 'courses', r.course_id);
  return r;
});
exports.updateCourse  = wrap(async (req) => {
  const r = await adminService.updateCourse(+req.params.id, req.body);
  await logAction(req.user.user_id, `UPDATE course`, 'courses', +req.params.id);
  return r;
});
exports.deleteCourse  = wrap(async (req) => {
  const r = await adminService.deleteCourse(+req.params.id);
  await logAction(req.user.user_id, `DELETE course`, 'courses', +req.params.id);
  return r;
});

// Courses-Profs (รายวิชา-อาจารย์)
exports.getCourseProfList     = wrap(async (req) => adminService.getCourseProfList(req.query));
exports.getCourseProfStudents = wrap(async (req) => adminService.getCourseProfStudents(+req.params.scheduleId));

// Exam Schedules
exports.getExamSchedules = wrap(async (req) => adminService.getAllExamSchedules(req.query));
exports.updateExamSchedule = wrap(async (req) => {
  const r = await adminService.adminUpdateExamSchedule(+req.params.examId, req.body);
  await logAction(req.user.user_id, `ADMIN_UPDATE_EXAM id=${req.params.examId}`, 'exam_schedules', +req.params.examId);
  return r;
});
exports.deleteExamSchedule = wrap(async (req) => {
  const r = await adminService.adminDeleteExamSchedule(+req.params.examId);
  await logAction(req.user.user_id, `ADMIN_DELETE_EXAM id=${req.params.examId}`, 'exam_schedules', +req.params.examId);
  return r;
});

// Logs
exports.getSystemLogs = wrap(async (req) => adminService.getSystemLogs(req.query));
