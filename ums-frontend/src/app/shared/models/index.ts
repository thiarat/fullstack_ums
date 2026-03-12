// ─── Auth ────────────────────────────────────────────────────
export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthUser {
  user_id: number;
  username: string;
  role: 'Admin' | 'Professor' | 'Student';
  // [FIX] เป็น null ได้สำหรับ Admin ที่ไม่มีแถวใน professors/students
  first_name: string | null;
  last_name: string | null;
  student_id?: number;
  prof_id?: number | null;
  profile_image?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

// ─── API Response ────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown[];
}

export interface PaginatedData<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Student ─────────────────────────────────────────────────
export interface Student {
  student_id: number;
  first_name: string;
  last_name: string;
  profile_image: string;
  enrollment_date: string;
  username: string;
  email: string;
  is_active: boolean;
  last_login?: string;
}

// ─── Professor ───────────────────────────────────────────────
export interface Professor {
  prof_id: number;
  first_name: string;
  last_name: string;
  profile_image: string;
  department: string;
  username: string;
  email: string;
  is_active: boolean;
}

// ─── Department ──────────────────────────────────────────────
export interface Department {
  dept_id: number;
  name: string;
  location: string;
  professor_count?: number;
  course_count?: number;
}

// ─── Course ──────────────────────────────────────────────────
export interface Course {
  course_id: number;
  course_code: string;
  title: string;
  credits: number;
  department?: string;
  dept_id?: number;
  enrolled_students?: number;
  professor_name?: string;
}

// ─── Enrollment ──────────────────────────────────────────────
export interface Enrollment {
  enrollment_id: number;
  course_id: number;
  course_code: string;
  title: string;
  credits: number;
  grade?: string;
  semester: string;
  department?: string;
  professor_name?: string;
}

// ─── Schedule ────────────────────────────────────────────────
export interface ClassSchedule {
  schedule_id: number;
  course_code: string;
  course_title: string;
  credits?: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room_number: string;
  professor_name?: string;
  enrolled_students?: number;
}

// ─── Exam ────────────────────────────────────────────────────
export interface ExamSchedule {
  exam_id: number;
  exam_type: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  room_number: string;
  course_code: string;
  course_title: string;
}

// ─── Library ─────────────────────────────────────────────────
export interface Book {
  book_id: number;
  isbn: string;
  title: string;
  author: string;
  total_copies: number;
  available_copies: number;
  is_available?: boolean;
}

export interface LibraryRecord {
  record_id: number;
  borrow_date: string;
  due_date: string;
  return_date?: string;
  fine_amount: number;
  current_fine?: number;
  status: string;
  book_title?: string;
  isbn?: string;
  student_name?: string;
  student_code?: string;
}

// ─── System Log ──────────────────────────────────────────────
export interface SystemLog {
  log_id: number;
  user_id: number;
  username: string;
  role_name: string;
  action: string;
  table_name: string;
  record_id: number;
  created_at: string;
}

// ─── Dashboard ───────────────────────────────────────────────
export interface AdminDashboard {
  counts: {
    students: number;
    professors: number;
    courses: number;
    departments: number;
    books: number;
    borrowedBooks: number;
  };
  recentLogs: SystemLog[];
}
