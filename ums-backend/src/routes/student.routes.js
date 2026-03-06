const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const studentCtrl = require('../controllers/student.controller');

router.use(authenticate, authorize('Student'));

/**
 * @swagger
 * tags:
 *   name: Student
 *   description: "Student portal endpoints (Role: Student only)"
 */

/**
 * @swagger
 * /api/student/dashboard:
 *   get:
 *     summary: Get student dashboard (profile, stats, upcoming exams)
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 */
router.get('/dashboard', studentCtrl.getDashboard);

// ─── ENROLLMENTS ───────────────────────────────────────────────
/**
 * @swagger
 * /api/student/enrollments:
 *   get:
 *     summary: Get my enrolled courses
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: semester
 *         schema: { type: string }
 *         description: "Filter by semester e.g. 1/2566"
 *     responses:
 *       200:
 *         description: List of enrolled courses with grades
 */
router.get('/enrollments', studentCtrl.getEnrollments);

/**
 * @swagger
 * /api/student/enrollments/available:
 *   get:
 *     summary: Get courses available to enroll
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 */
router.get('/enrollments/available', studentCtrl.getAvailableCourses);

/**
 * @swagger
 * /api/student/enrollments:
 *   post:
 *     summary: Enroll in a course
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [course_id, semester]
 *             properties:
 *               course_id: { type: integer }
 *               semester:  { type: string, example: "1/2567" }
 *     responses:
 *       201:
 *         description: Enrolled successfully
 *       409:
 *         description: Already enrolled
 */
router.post('/enrollments', studentCtrl.enrollCourse);

/**
 * @swagger
 * /api/student/enrollments/{enrollmentId}/withdraw:
 *   patch:
 *     summary: Withdraw from a course (grade = W)
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema: { type: integer }
 */
router.patch('/enrollments/:enrollmentId/withdraw', studentCtrl.withdrawCourse);

// ─── SCHEDULE ──────────────────────────────────────────────────
/**
 * @swagger
 * /api/student/schedule:
 *   get:
 *     summary: Get my weekly class schedule
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 */
router.get('/schedule', studentCtrl.getSchedule);

/**
 * @swagger
 * /api/student/exams:
 *   get:
 *     summary: Get my exam schedule
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 */
router.get('/exams', studentCtrl.getExamSchedule);

// ─── GRADES ────────────────────────────────────────────────────
/**
 * @swagger
 * /api/student/grades:
 *   get:
 *     summary: Get my grades and GPA
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Grades list with calculated GPA
 */
router.get('/grades', studentCtrl.getGrades);

// ─── LIBRARY ───────────────────────────────────────────────────
/**
 * @swagger
 * /api/student/library/borrowed:
 *   get:
 *     summary: Get my borrowed books and fines
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 */
router.get('/library/borrowed', studentCtrl.getBorrowedBooks);

/**
 * @swagger
 * /api/student/library/books:
 *   get:
 *     summary: Search available books
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 */
router.get('/library/books', studentCtrl.searchBooks);

module.exports = router;
