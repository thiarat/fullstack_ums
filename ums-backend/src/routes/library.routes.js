const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const libCtrl = require('../controllers/library.controller');

/**
 * @swagger
 * tags:
 *   name: Library
 *   description: "Library management — books, borrow, return, fines (Admin only)"
 */

// All library management is Admin only
router.use(authenticate, authorize('Admin'));

/**
 * @swagger
 * /api/library/books:
 *   get:
 *     summary: Get all books (searchable, paginated)
 *     tags: [Library]
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
 *   post:
 *     summary: Add a new book
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isbn, title]
 *             properties:
 *               isbn:          { type: string }
 *               title:         { type: string }
 *               author:        { type: string }
 *               total_copies:  { type: integer, default: 1 }
 */
router.get('/books', libCtrl.getBooks);
router.post('/books', libCtrl.createBook);

/**
 * @swagger
 * /api/library/books/{id}:
 *   put:
 *     summary: Update book details
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *   delete:
 *     summary: Delete a book
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 */
router.put('/books/:id', libCtrl.updateBook);
router.delete('/books/:id', libCtrl.deleteBook);

// ─── BORROW / RETURN ───────────────────────────────────────────
/**
 * @swagger
 * /api/library/borrow:
 *   post:
 *     summary: Record a book borrow (Admin issues book to student)
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [student_id, book_id]
 *             properties:
 *               student_id: { type: integer }
 *               book_id:    { type: integer }
 *     responses:
 *       201:
 *         description: Borrow recorded, due_date calculated from library settings
 *       409:
 *         description: No copies available or already borrowed
 */
router.post('/borrow', libCtrl.borrowBook);

/**
 * @swagger
 * /api/library/return/{recordId}:
 *   patch:
 *     summary: Process book return and calculate fine (via DB trigger)
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Book returned; status is "Returned" or "Returned (Late)" with fine_amount
 */
router.patch('/return/:recordId', libCtrl.returnBook);

/**
 * @swagger
 * /api/library/records:
 *   get:
 *     summary: Get all borrow records
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Borrowed, Returned, "Returned (Late)"]
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 30 }
 */
router.get('/records', libCtrl.getBorrowRecords);

// ─── SETTINGS ──────────────────────────────────────────────────
/**
 * @swagger
 * /api/library/settings:
 *   get:
 *     summary: Get library settings (max_days_limit, fine_per_day)
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *   put:
 *     summary: Update library settings
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               max_days_limit: { type: integer, example: 7 }
 *               fine_per_day:   { type: number, example: 5.00 }
 */
router.get('/settings', libCtrl.getSettings);
router.put('/settings', libCtrl.updateSettings);

module.exports = router;
