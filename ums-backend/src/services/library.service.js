const db = require('../config/database');

// ─── BOOKS (Admin) ─────────────────────────────────────────────
const getAllBooks = async ({ search = '', page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const [data, count] = await Promise.all([
    db.query(
      `SELECT * FROM books
       WHERE title ILIKE $1 OR author ILIKE $1 OR isbn ILIKE $1
       ORDER BY title LIMIT $2 OFFSET $3`,
      [`%${search}%`, limit, offset]
    ),
    db.query(
      `SELECT COUNT(*) FROM books WHERE title ILIKE $1 OR author ILIKE $1 OR isbn ILIKE $1`,
      [`%${search}%`]
    ),
  ]);
  return { data: data.rows, total: parseInt(count.rows[0].count), page, limit };
};

const createBook = async ({ isbn, title, author, total_copies = 1, description = null, chapters = null }) => {
  const result = await db.query(
    `INSERT INTO books (isbn, title, author, total_copies, available_copies, description, chapters)
     VALUES ($1, $2, $3, $4, $4, $5, $6) RETURNING *`,
    [isbn, title, author, total_copies, description, chapters ? JSON.stringify(chapters) : null]
  );
  return result.rows[0];
};

const updateBook = async (bookId, body) => {
  const { isbn, title, author, total_copies, description, chapters } = body;
  // When total_copies changes, recalculate available_copies = new total - currently borrowed
  const availableExpr = total_copies != null
    ? `, available_copies = $4 - (SELECT COUNT(*) FROM library_records WHERE book_id = $7 AND status = 'Borrowed')`
    : '';
  const result = await db.query(
    `UPDATE books SET
       isbn          = COALESCE($1, isbn),
       title         = COALESCE($2, title),
       author        = COALESCE($3, author),
       total_copies  = COALESCE($4, total_copies)
       ${availableExpr},
       description   = COALESCE($5, description),
       chapters      = COALESCE($6, chapters)
     WHERE book_id = $7 RETURNING *`,
    [isbn, title, author, total_copies ?? null, description ?? null, chapters ? JSON.stringify(chapters) : null, bookId]
  );
  if (result.rows.length === 0) throw { statusCode: 404, message: 'Book not found.' };
  return result.rows[0];
};

const deleteBook = async (bookId) => {
  const result = await db.query('DELETE FROM books WHERE book_id = $1 RETURNING *', [bookId]);
  if (result.rows.length === 0) throw { statusCode: 404, message: 'Book not found.' };
  return result.rows[0];
};

// ─── BORROW ────────────────────────────────────────────────────
const borrowBook = async (studentId, bookId) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Check book available
    const book = await client.query(
      'SELECT * FROM books WHERE book_id = $1 FOR UPDATE',
      [bookId]
    );
    if (book.rows.length === 0) throw { statusCode: 404, message: 'Book not found.' };
    if (book.rows[0].available_copies <= 0) throw { statusCode: 409, message: 'No copies available.' };

    // Check student doesn't already have this book
    const existing = await client.query(
      `SELECT record_id FROM library_records
       WHERE student_id = $1 AND book_id = $2 AND status = 'Borrowed'`,
      [studentId, bookId]
    );
    if (existing.rows.length > 0) throw { statusCode: 409, message: 'Student already has this book borrowed.' };

    // Get library settings for due date
    const settings = await client.query('SELECT max_days_limit FROM library_settings LIMIT 1');
    const maxDays = settings.rows[0]?.max_days_limit || 7;

    // Create borrow record
    const record = await client.query(
      `INSERT INTO library_records (student_id, book_id, due_date)
       VALUES ($1, $2, CURRENT_DATE + $3::int)
       RETURNING *`,
      [studentId, bookId, maxDays]
    );

    // Decrease available copies
    await client.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE book_id = $1',
      [bookId]
    );

    await client.query('COMMIT');
    return { ...record.rows[0], book_title: book.rows[0].title };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ─── RETURN ────────────────────────────────────────────────────
const returnBook = async (recordId) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const record = await client.query(
      `SELECT lr.*, b.title as book_title FROM library_records lr
       JOIN books b ON lr.book_id = b.book_id
       WHERE lr.record_id = $1 AND lr.status = 'Borrowed' FOR UPDATE`,
      [recordId]
    );
    if (record.rows.length === 0) throw { statusCode: 404, message: 'Borrow record not found or already returned.' };

    // Trigger trg_calculate_fine will auto-calculate fine when return_date is set
    const updated = await client.query(
      `UPDATE library_records SET return_date = CURRENT_DATE WHERE record_id = $1 RETURNING *`,
      [recordId]
    );

    // Increase available copies
    await client.query(
      'UPDATE books SET available_copies = available_copies + 1 WHERE book_id = $1',
      [record.rows[0].book_id]
    );

    await client.query('COMMIT');
    return { ...updated.rows[0], book_title: record.rows[0].book_title };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ─── ALL RECORDS (Admin) ───────────────────────────────────────
const getAllBorrowRecords = async ({ status = null, page = 1, limit = 30 }) => {
  const offset = (page - 1) * limit;

  // Build separate param arrays for data query and count query
  const dataParams = [limit, offset];
  const countParams = [];
  let dataFilter = '';
  let countFilter = '';

  if (status) {
    dataParams.push(status);
    dataFilter = `WHERE lr.status = $${dataParams.length}`;
    countParams.push(status);
    countFilter = `WHERE lr.status = $1`;
  }

  const [data, count] = await Promise.all([
    db.query(
      `SELECT lr.record_id, lr.borrow_date, lr.due_date, lr.return_date,
              lr.fine_amount, lr.status,
              s.first_name || ' ' || s.last_name as student_name,
              u.username as student_code,
              b.title as book_title, b.isbn,
              CASE
                WHEN lr.return_date IS NULL AND CURRENT_DATE > lr.due_date
                THEN (CURRENT_DATE - lr.due_date) * (SELECT fine_per_day FROM library_settings LIMIT 1)
                ELSE lr.fine_amount
              END as current_fine
       FROM library_records lr
       JOIN students s ON lr.student_id = s.student_id
       JOIN users u ON s.user_id = u.user_id
       JOIN books b ON lr.book_id = b.book_id
       ${dataFilter}
       ORDER BY lr.borrow_date DESC
       LIMIT $1 OFFSET $2`,
      dataParams
    ),
    db.query(
      `SELECT COUNT(*) FROM library_records lr ${countFilter}`,
      countParams
    ),
  ]);

  return { data: data.rows, total: parseInt(count.rows[0].count), page, limit };
};

// ─── SETTINGS ──────────────────────────────────────────────────
const getSettings = async () => {
  const result = await db.query('SELECT * FROM library_settings LIMIT 1');
  return result.rows[0];
};

const updateSettings = async ({ max_days_limit, fine_per_day }) => {
  const result = await db.query(
    `UPDATE library_settings
     SET max_days_limit = COALESCE($1, max_days_limit),
         fine_per_day   = COALESCE($2, fine_per_day)
     WHERE setting_id = 1 RETURNING *`,
    [max_days_limit, fine_per_day]
  );
  return result.rows[0];
};

module.exports = {
  getAllBooks, createBook, updateBook, deleteBook,
  borrowBook, returnBook,
  getAllBorrowRecords,
  getSettings, updateSettings,
};
