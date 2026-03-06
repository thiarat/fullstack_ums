const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const adminCtrl = require('../controllers/admin.controller');

// All admin routes require authentication + Admin role
router.use(authenticate, authorize('Admin'));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only management endpoints
 */

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats including counts and recent logs
 */
router.get('/dashboard', adminCtrl.getDashboard);

// ─── STUDENTS ──────────────────────────────────────────────
/**
 * @swagger
 * /api/admin/students:
 *   get:
 *     summary: Get all students (paginated, searchable)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of students
 */
router.get('/students', adminCtrl.getStudents);
router.get('/students/:id', adminCtrl.getStudentById);
router.patch('/students/:id/status', adminCtrl.updateStudentStatus);

// ─── PROFESSORS ────────────────────────────────────────────
/**
 * @swagger
 * /api/admin/professors:
 *   get:
 *     summary: Get all professors (paginated, searchable)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: dept_id
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of professors
 */
router.get('/professors', adminCtrl.getProfessors);

// ─── DEPARTMENTS ───────────────────────────────────────────
/**
 * @swagger
 * /api/admin/departments:
 *   get:
 *     summary: Get all departments
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Create a new department
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               location: { type: string }
 */
router.get('/departments', adminCtrl.getDepartments);
router.post('/departments', adminCtrl.createDepartment);
router.put('/departments/:id', adminCtrl.updateDepartment);
router.delete('/departments/:id', adminCtrl.deleteDepartment);

// ─── COURSES ───────────────────────────────────────────────
/**
 * @swagger
 * /api/admin/courses:
 *   get:
 *     summary: Get all courses
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Create a new course
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [course_code, title]
 *             properties:
 *               course_code: { type: string }
 *               title: { type: string }
 *               credits: { type: integer, default: 3 }
 *               dept_id: { type: integer }
 */
router.get('/courses', adminCtrl.getCourses);
router.post('/courses', adminCtrl.createCourse);
router.put('/courses/:id', adminCtrl.updateCourse);
router.delete('/courses/:id', adminCtrl.deleteCourse);

// ─── SYSTEM LOGS ───────────────────────────────────────────
/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     summary: View system activity logs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 */
router.get('/logs', adminCtrl.getSystemLogs);

module.exports = router;
