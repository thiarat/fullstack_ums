const professorService = require('../services/professor.service');
const { logAction } = require('../services/systemLog.service');

const handleError = (error, next) => {
  if (error.statusCode) return next(error);
  next(error);
};

exports.getDashboard = async (req, res, next) => {
  try {
    const data = await professorService.getProfessorDashboard(req.user.prof_id);
    res.json({ success: true, data });
  } catch (e) { handleError(e, next); }
};

// Courses
exports.getMyCourses = async (req, res, next) => {
  try {
    const data = await professorService.getMyCourses(req.user.prof_id);
    res.json({ success: true, data });
  } catch (e) { handleError(e, next); }
};

exports.getCourseStudents = async (req, res, next) => {
  try {
    const data = await professorService.getCourseStudents(req.user.prof_id, req.params.courseId);
    res.json({ success: true, data });
  } catch (e) { handleError(e, next); }
};

// Grade Entry
exports.submitGrade = async (req, res, next) => {
  try {
    const { grade } = req.body;
    if (!grade) return res.status(400).json({ success: false, message: 'grade is required.' });
    const data = await professorService.submitGrade(req.user.prof_id, req.params.enrollmentId, grade);
    await logAction(req.user.user_id, `SUBMIT_GRADE enrollment=${req.params.enrollmentId} grade=${grade}`, 'enrollments', +req.params.enrollmentId);
    res.json({ success: true, message: 'Grade submitted.', data });
  } catch (e) { handleError(e, next); }
};

exports.submitBulkGrades = async (req, res, next) => {
  try {
    const { grades } = req.body;
    if (!Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json({ success: false, message: 'grades array is required.' });
    }
    const data = await professorService.submitBulkGrades(req.user.prof_id, req.params.courseId, grades);
    await logAction(req.user.user_id, `BULK_GRADE course=${req.params.courseId} count=${grades.length}`, 'enrollments', null);
    res.json({ success: true, message: `${data.length} grades submitted.`, data });
  } catch (e) { handleError(e, next); }
};

// Schedule
exports.getSchedule = async (req, res, next) => {
  try {
    const data = await professorService.getMySchedule(req.user.prof_id);
    res.json({ success: true, data });
  } catch (e) { handleError(e, next); }
};

exports.createSchedule = async (req, res, next) => {
  try {
    const data = await professorService.addCourseSchedule(req.user.prof_id, req.body);
    await logAction(req.user.user_id, `CREATE_SCHEDULE course=${req.body.course_id}`, 'class_schedules', data.schedule_id);
    res.status(201).json({ success: true, message: 'Schedule created.', data });
  } catch (e) { handleError(e, next); }
};

exports.deleteSchedule = async (req, res, next) => {
  try {
    await professorService.deleteCourseSchedule(req.user.prof_id, req.params.scheduleId);
    await logAction(req.user.user_id, `DELETE_SCHEDULE id=${req.params.scheduleId}`, 'class_schedules', +req.params.scheduleId);
    res.json({ success: true, message: 'Schedule deleted.' });
  } catch (e) { handleError(e, next); }
};

// Exam Schedule
exports.getExamSchedule = async (req, res, next) => {
  try {
    const data = await professorService.getMyExamSchedule(req.user.prof_id);
    res.json({ success: true, data });
  } catch (e) { handleError(e, next); }
};

exports.createExamSchedule = async (req, res, next) => {
  try {
    const data = await professorService.createExamSchedule(req.user.prof_id, req.body);
    await logAction(req.user.user_id, `CREATE_EXAM course=${req.body.course_id} type=${req.body.exam_type}`, 'exam_schedules', data.exam_id);
    res.status(201).json({ success: true, message: 'Exam schedule created.', data });
  } catch (e) { handleError(e, next); }
};

exports.updateSchedule = async (req, res, next) => {
  try {
    const data = await professorService.updateCourseSchedule(req.user.prof_id, +req.params.scheduleId, req.body);
    await logAction(req.user.user_id, `UPDATE_SCHEDULE id=${req.params.scheduleId}`, 'class_schedules', +req.params.scheduleId);
    res.json({ success: true, message: 'Schedule updated.', data });
  } catch (e) { handleError(e, next); }
};
