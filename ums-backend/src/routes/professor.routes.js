const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const profCtrl = require('../controllers/professor.controller');

router.use(authenticate, authorize('Professor'));

/**
 * @swagger
 * tags:
 *   name: Professor
 *   description: "Professor portal endpoints (Role: Professor only)"
 */

/**
 * @swagger
 * /api/professor/dashboard:
 *   get:
 *     summary: Professor dashboard (profile, stats, upcoming exams)
 *     tags: [Professor]
 *     security:
 *       - bearerAuth: []
 */
router.get('/dashboard', profCtrl.getDashboard);

// ─── MY COURSES ────────────────────────────────────────────────
/**
 * @swagger
 * /api/professor/courses:
 *   get:
 *     summary: Get my teaching courses with enrollment counts
 *     tags: [Professor]
 *     security:
 *       - bearerAuth: []
 */
router.get('/courses', profCtrl.getMyCourses);
router.get('/courses/dept-all', profCtrl.getDeptCourses);

/**
 * @swagger
 * /api/professor/courses/{courseId}/students:
 *   get:
 *     summary: Get students enrolled in a specific course
 *     tags: [Professor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: integer }
 */
router.get('/courses/:courseId/students', profCtrl.getCourseStudents);

// ─── GRADE ENTRY ───────────────────────────────────────────────
/**
 * @swagger
 * /api/professor/grades/{enrollmentId}:
 *   patch:
 *     summary: Submit grade for a single student
 *     tags: [Professor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [grade]
 *             properties:
 *               grade:
 *                 type: string
 *                 enum: [A, B+, B, C+, C, D+, D, F, W, I]
 */
router.patch('/grades/:enrollmentId', profCtrl.submitGrade);

/**
 * @swagger
 * /api/professor/courses/{courseId}/grades:
 *   post:
 *     summary: Submit grades in bulk for a course
 *     tags: [Professor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [grades]
 *             properties:
 *               grades:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     enrollment_id: { type: integer }
 *                     grade: { type: string, enum: [A, B+, B, C+, C, D+, D, F, W, I] }
 *     responses:
 *       200:
 *         description: "Grades submitted (uses DB transaction)"
 */
router.post('/courses/:courseId/grades', profCtrl.submitBulkGrades);

// ─── CLASS SCHEDULE ────────────────────────────────────────────
/**
 * @swagger
 * /api/professor/schedule:
 *   get:
 *     summary: Get my weekly teaching schedule
 *     tags: [Professor]
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Create a class schedule slot
 *     tags: [Professor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [course_id, day_of_week, start_time, end_time, room_number]
 *             properties:
 *               course_id:   { type: integer }
 *               day_of_week: { type: string, enum: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday] }
 *               start_time:  { type: string, example: "09:00" }
 *               end_time:    { type: string, example: "12:00" }
 *               room_number: { type: string, example: "A301" }
 */
router.get('/schedule', profCtrl.getSchedule);
router.post('/schedule', profCtrl.createSchedule);

/**
 * @swagger
 * /api/professor/schedule/{scheduleId}:
 *   delete:
 *     summary: Delete a class schedule slot
 *     tags: [Professor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema: { type: integer }
 */
router.put("/schedule/:scheduleId", profCtrl.updateSchedule);
router.delete("/schedule/:scheduleId", profCtrl.deleteSchedule);

// ─── EXAM SCHEDULE ─────────────────────────────────────────────
/**
 * @swagger
 * /api/professor/exams:
 *   get:
 *     summary: Get exam schedules for my courses
 *     tags: [Professor]
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Create an exam schedule
 *     tags: [Professor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [course_id, exam_date, start_time, end_time, room_number]
 *             properties:
 *               course_id:   { type: integer }
 *               exam_type:   { type: string, enum: [Midterm, Final], default: Final }
 *               exam_date:   { type: string, format: date, example: "2024-11-20" }
 *               start_time:  { type: string, example: "09:00" }
 *               end_time:    { type: string, example: "12:00" }
 *               room_number: { type: string, example: "HALL-A" }
 */
router.get('/exams', profCtrl.getExamSchedule);
router.post('/exams', profCtrl.createExamSchedule);

module.exports = router;
