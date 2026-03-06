const libraryService = require('../services/library.service');
const { logAction } = require('../services/systemLog.service');

const handleError = (error, next) => {
  if (error.statusCode) return next(error);
  next(error);
};

// Books CRUD (Admin)
exports.getBooks = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const data = await libraryService.getAllBooks({ search, page: +page, limit: +limit });
    res.json({ success: true, data });
  } catch (e) { handleError(e, next); }
};

exports.createBook = async (req, res, next) => {
  try {
    const data = await libraryService.createBook(req.body);
    await logAction(req.user.user_id, `CREATE book "${req.body.title}"`, 'books', data.book_id);
    res.status(201).json({ success: true, message: 'Book added.', data });
  } catch (e) { handleError(e, next); }
};

exports.updateBook = async (req, res, next) => {
  try {
    const data = await libraryService.updateBook(req.params.id, req.body);
    await logAction(req.user.user_id, `UPDATE book id=${req.params.id}`, 'books', +req.params.id);
    res.json({ success: true, message: 'Book updated.', data });
  } catch (e) { handleError(e, next); }
};

exports.deleteBook = async (req, res, next) => {
  try {
    await libraryService.deleteBook(req.params.id);
    await logAction(req.user.user_id, `DELETE book id=${req.params.id}`, 'books', +req.params.id);
    res.json({ success: true, message: 'Book deleted.' });
  } catch (e) { handleError(e, next); }
};

// Borrow / Return (Admin action on behalf of student)
exports.borrowBook = async (req, res, next) => {
  try {
    const { student_id, book_id } = req.body;
    if (!student_id || !book_id) {
      return res.status(400).json({ success: false, message: 'student_id and book_id are required.' });
    }
    const data = await libraryService.borrowBook(student_id, book_id);
    await logAction(req.user.user_id, `BORROW book_id=${book_id} student_id=${student_id}`, 'library_records', data.record_id);
    res.status(201).json({ success: true, message: 'Book borrowed.', data });
  } catch (e) { handleError(e, next); }
};

exports.returnBook = async (req, res, next) => {
  try {
    const data = await libraryService.returnBook(req.params.recordId);
    await logAction(req.user.user_id, `RETURN record_id=${req.params.recordId}`, 'library_records', +req.params.recordId);
    res.json({
      success: true,
      message: data.status === 'Returned (Late)' ? `Book returned late. Fine: ${data.fine_amount} THB` : 'Book returned on time.',
      data,
    });
  } catch (e) { handleError(e, next); }
};

exports.getBorrowRecords = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 30 } = req.query;
    const data = await libraryService.getAllBorrowRecords({ status, page: +page, limit: +limit });
    res.json({ success: true, data });
  } catch (e) { handleError(e, next); }
};

// Settings
exports.getSettings = async (req, res, next) => {
  try {
    const data = await libraryService.getSettings();
    res.json({ success: true, data });
  } catch (e) { handleError(e, next); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const data = await libraryService.updateSettings(req.body);
    await logAction(req.user.user_id, 'UPDATE library_settings', 'library_settings', 1);
    res.json({ success: true, message: 'Settings updated.', data });
  } catch (e) { handleError(e, next); }
};
