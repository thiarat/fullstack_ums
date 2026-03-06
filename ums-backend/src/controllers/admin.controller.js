const adminService = require('../services/admin.service');
const { logAction } = require('../services/systemLog.service');

const handleError = (error, next) => {
  if (error.statusCode) return next(error);
  next(error);
};

// Dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const data = await adminService.getDashboardStats();
    res.json({ success: true, data });
  } catch (e) { handleError(e, next); }
};

// Students
exports.getStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const data = await adminService.getAllStudents({ page: +page, limit: +limit, search });
    res.json({ success: true, data });
  } catch (e) { handleError(e, next); }
};

exports.getStudentById = async (req, res, next) => {
  try {
    const data = await adminService.getStudentById(req.params.id);
    res.json({ success: true, data });
  } catch (e) { handleError(e, next); }
};

exports.updateStudentStatus = async (req, res, next) => {
  try {
    const { is_active } = req.body;
    const data = await adminService.updateStudentStatus(req.params.id, is_active);
    await logAction(req.user.user_id, `UPDATE student status to ${is_active}`, 'students', +req.params.id);
    res.json({ success: true, message: 'Student status updated.', data });
  } catch (e) { handleError(e, next); }
};

// Professors
exports.getProfessors = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', dept_id } = req.query;
    const data = await adminService.getAllProfessors({ page: +page, limit: +limit, search, dept_id });
    res.json({ success: true, data });
  } catch (e) { handleError(e, next); }
};

// Departments
exports.getDepartments = async (req, res, next) => {
  try {
    const data = await adminService.getAllDepartments();
    res.json({ success: true, data });
  } catch (e) { handleError(e, next); }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const data = await adminService.createDepartment(req.body);
    await logAction(req.user.user_id, 'CREATE department', 'departments', data.dept_id);
    res.status(201).json({ success: true, message: 'Department created.', data });
  } catch (e) { handleError(e, next); }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    const data = await adminService.updateDepartment(req.params.id, req.body);
    await logAction(req.user.user_id, 'UPDATE department', 'departments', +req.params.id);
    res.json({ success: true, message: 'Department updated.', data });
  } catch (e) { handleError(e, next); }
};

exports.deleteDepartment = async (req, res, next) => {
  try {
    await adminService.deleteDepartment(req.params.id);
    await logAction(req.user.user_id, 'DELETE department', 'departments', +req.params.id);
    res.json({ success: true, message: 'Department deleted.' });
  } catch (e) { handleError(e, next); }
};

// Courses
exports.getCourses = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', dept_id } = req.query;
    const data = await adminService.getAllCourses({ page: +page, limit: +limit, search, dept_id });
    res.json({ success: true, data });
  } catch (e) { handleError(e, next); }
};

exports.createCourse = async (req, res, next) => {
  try {
    const data = await adminService.createCourse(req.body);
    await logAction(req.user.user_id, 'CREATE course', 'courses', data.course_id);
    res.status(201).json({ success: true, message: 'Course created.', data });
  } catch (e) { handleError(e, next); }
};

exports.updateCourse = async (req, res, next) => {
  try {
    const data = await adminService.updateCourse(req.params.id, req.body);
    await logAction(req.user.user_id, 'UPDATE course', 'courses', +req.params.id);
    res.json({ success: true, message: 'Course updated.', data });
  } catch (e) { handleError(e, next); }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    await adminService.deleteCourse(req.params.id);
    await logAction(req.user.user_id, 'DELETE course', 'courses', +req.params.id);
    res.json({ success: true, message: 'Course deleted.' });
  } catch (e) { handleError(e, next); }
};

// System Logs
exports.getSystemLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const data = await adminService.getSystemLogs({ page: +page, limit: +limit });
    res.json({ success: true, data });
  } catch (e) { handleError(e, next); }
};
