const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const adminCtrl = require('../controllers/admin.controller');

router.use(authenticate, authorize('Admin'));

// Dashboard
router.get('/dashboard', adminCtrl.getDashboard);

// Students
router.get('/students',                              adminCtrl.getStudents);
router.get('/students/:id',                          adminCtrl.getStudentById);
router.get('/students/:id/schedule',                 adminCtrl.getStudentSchedule);   // NEW: popup ตารางเรียน
router.patch('/students/:id/status',                 adminCtrl.updateStudentStatus);

// Users CRUD (NEW)
router.post('/users',                                adminCtrl.createUser);
router.put('/users/:id',                             adminCtrl.updateUser);
router.delete('/users/:id',                          adminCtrl.deleteUser);
router.patch('/users/:id/reset-password',            adminCtrl.adminResetPassword);

// Password Reset Requests (NEW)
router.get('/password-reset-requests',               adminCtrl.getPasswordResetRequests);
router.get('/password-reset-requests/history',       adminCtrl.getPasswordResetHistory);
router.post('/password-reset-requests/:requestId/approve', adminCtrl.approvePasswordReset);
router.post('/password-reset-requests/:requestId/reject',  adminCtrl.rejectPasswordReset);

// Professors
router.get('/professors',                            adminCtrl.getProfessors);
router.get('/professors/:id/schedule',               adminCtrl.getProfSchedule);   // popup ตารางสอน

// Course schedule popup
router.get('/courses/:id/schedule',                  adminCtrl.getCourseSchedule);

// Departments
router.get('/departments',       adminCtrl.getDepartments);
router.post('/departments',      adminCtrl.createDepartment);
router.put('/departments/:id',   adminCtrl.updateDepartment);
router.delete('/departments/:id',adminCtrl.deleteDepartment);

// Courses
router.get('/courses',       adminCtrl.getCourses);
router.post('/courses',      adminCtrl.createCourse);
router.put('/courses/:id',   adminCtrl.updateCourse);
router.delete('/courses/:id',adminCtrl.deleteCourse);

// Courses-Profs list (รายวิชา-อาจารย์)
router.get('/courses-profs',                              adminCtrl.getCourseProfList);
router.get('/courses-profs/:scheduleId/students',         adminCtrl.getCourseProfStudents);

// Exam Schedules
router.get('/exam-schedules',              adminCtrl.getExamSchedules);
router.put('/exam-schedules/:examId',      adminCtrl.updateExamSchedule);
router.delete('/exam-schedules/:examId',   adminCtrl.deleteExamSchedule);

// Logs
router.get('/logs', adminCtrl.getSystemLogs);

module.exports = router;
