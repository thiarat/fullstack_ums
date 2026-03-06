const studentService = require('../services/student.service');
const { logAction } = require('../services/systemLog.service');

const handleError = (error, next) => {
  if (error.statusCode) return next(error);
  next(error);
};

// Dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const data = await studentService.getStudentDashboard(req.user.student_id);
    res.json({ success: true, data });
  } catch (e) { handleError(e, next); }
};

// Enrollments
exports.getEnrollments = async (req, res, next) => {
  try {
    const { semester } = req.query;
    const data = await studentService.getMyEnrollments(req.user.student_id, { semester });
    res.json({ success: true, data });
  } catch (e) { handleError(e, next); }
};

exports.getAvailableCourses = async (req, res, next) => {
  try {
    const data = await studentService.getAvailableCourses(req.user.student_id);
    res.json({ success: true, data });
  } catch (e) { handleError(e, next); }
};

exports.enrollCourse = async (req, res, next) => {
  try {
    const { course_id, semester, schedule_id } = req.body;
    if (!course_id || !semester) {
      return res.status(400).json({ success: false, message: 'course_id and semester are required.' });
    }
    const data = await studentService.enrollCourse(req.user.student_id, course_id, semester, schedule_id);
    await logAction(req.user.user_id, `ENROLL course_id=${course_id} semester=${semester}`, 'enrollments', data.enrollment_id);
    res.status(201).json({ success: true, message: 'Enrolled successfully.', data });
  } catch (e) { handleError(e, next); }
};

exports.withdrawCourse = async (req, res, next) => {
  try {
    const data = await studentService.withdrawCourse(req.user.student_id, req.params.enrollmentId);
    await logAction(req.user.user_id, `WITHDRAW enrollment_id=${req.params.enrollmentId}`, 'enrollments', +req.params.enrollmentId);
    res.json({ success: true, message: 'Withdrawn from course.', data });
  } catch (e) { handleError(e, next); }
};

// Schedule
exports.getSchedule = async (req, res, next) => {
  try {
    const data = await studentService.getMySchedule(req.user.student_id);
    res.json({ success: true, data });
  } catch (e) { handleError(e, next); }
};

// Exam Schedule
exports.getExamSchedule = async (req, res, next) => {
  try {
    const data = await studentService.getMyExamSchedule(req.user.student_id);
    res.json({ success: true, data });
  } catch (e) { handleError(e, next); }
};

// Grades
exports.getGrades = async (req, res, next) => {
  try {
    const data = await studentService.getMyGrades(req.user.student_id);
    res.json({ success: true, data });
  } catch (e) { handleError(e, next); }
};

// Library
exports.getBorrowedBooks = async (req, res, next) => {
  try {
    const data = await studentService.getMyBorrowedBooks(req.user.student_id);
    res.json({ success: true, data });
  } catch (e) { handleError(e, next); }
};

exports.searchBooks = async (req, res, next) => {
  try {
    const { search = '', dept = '', page = 1, limit = 20 } = req.query;
    const data = await studentService.searchBooks({ search, dept, page: +page, limit: +limit });
    res.json({ success: true, data });
  } catch (e) { handleError(e, next); }
};
