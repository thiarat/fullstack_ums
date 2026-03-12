-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.books (
  book_id integer NOT NULL DEFAULT nextval('books_book_id_seq'::regclass),
  isbn character varying NOT NULL UNIQUE,
  title character varying NOT NULL,
  author character varying,
  total_copies integer DEFAULT 1 CHECK (total_copies >= 0),
  available_copies integer DEFAULT 1 CHECK (available_copies >= 0),
  dept_id integer,
  description text,
  chapters jsonb,
  CONSTRAINT books_pkey PRIMARY KEY (book_id),
  CONSTRAINT books_dept_id_fkey FOREIGN KEY (dept_id) REFERENCES public.departments(dept_id)
);
CREATE TABLE public.class_schedules (
  schedule_id integer NOT NULL DEFAULT nextval('class_schedules_schedule_id_seq'::regclass),
  course_id integer,
  prof_id integer,
  day_of_week character varying,
  start_time time without time zone,
  end_time time without time zone,
  room_number character varying,
  CONSTRAINT class_schedules_pkey PRIMARY KEY (schedule_id),
  CONSTRAINT class_schedules_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id),
  CONSTRAINT class_schedules_prof_id_fkey FOREIGN KEY (prof_id) REFERENCES public.professors(prof_id)
);
CREATE TABLE public.courses (
  course_id integer NOT NULL DEFAULT nextval('courses_course_id_seq'::regclass),
  course_code character varying NOT NULL UNIQUE,
  title character varying NOT NULL,
  credits integer DEFAULT 3 CHECK (credits > 0),
  dept_id integer,
  CONSTRAINT courses_pkey PRIMARY KEY (course_id),
  CONSTRAINT courses_dept_id_fkey FOREIGN KEY (dept_id) REFERENCES public.departments(dept_id)
);
CREATE TABLE public.departments (
  dept_id integer NOT NULL DEFAULT nextval('departments_dept_id_seq'::regclass),
  name character varying NOT NULL,
  location character varying,
  CONSTRAINT departments_pkey PRIMARY KEY (dept_id)
);
CREATE TABLE public.enrollments (
  enrollment_id integer NOT NULL DEFAULT nextval('enrollments_enrollment_id_seq'::regclass),
  student_id integer,
  course_id integer,
  grade character varying CHECK (grade::text = ANY (ARRAY['A'::character varying, 'B+'::character varying, 'B'::character varying, 'C+'::character varying, 'C'::character varying, 'D+'::character varying, 'D'::character varying, 'F'::character varying, 'W'::character varying, 'I'::character varying]::text[])),
  semester character varying,
  schedule_id integer,
  CONSTRAINT enrollments_pkey PRIMARY KEY (enrollment_id),
  CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(student_id),
  CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id),
  CONSTRAINT enrollments_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.class_schedules(schedule_id)
);
CREATE TABLE public.exam_schedules (
  exam_id integer NOT NULL DEFAULT nextval('exam_schedules_exam_id_seq'::regclass),
  course_id integer,
  exam_type character varying DEFAULT 'Final'::character varying,
  exam_date date NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  room_number character varying,
  CONSTRAINT exam_schedules_pkey PRIMARY KEY (exam_id),
  CONSTRAINT exam_schedules_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id)
);
CREATE TABLE public.library_records (
  record_id integer NOT NULL DEFAULT nextval('library_records_record_id_seq'::regclass),
  student_id integer,
  book_id integer,
  borrow_date date DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  return_date date,
  fine_amount numeric DEFAULT 0,
  status character varying DEFAULT 'Borrowed'::character varying,
  CONSTRAINT library_records_pkey PRIMARY KEY (record_id),
  CONSTRAINT library_records_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(student_id),
  CONSTRAINT library_records_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(book_id)
);
CREATE TABLE public.library_settings (
  setting_id integer NOT NULL DEFAULT nextval('library_settings_setting_id_seq'::regclass),
  max_days_limit integer DEFAULT 7,
  fine_per_day numeric DEFAULT 5.00,
  CONSTRAINT library_settings_pkey PRIMARY KEY (setting_id)
);
CREATE TABLE public.password_reset_requests (
  request_id integer NOT NULL DEFAULT nextval('password_reset_requests_request_id_seq'::regclass),
  user_id integer,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying]::text[])),
  resolved_by integer,
  resolved_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT password_reset_requests_pkey PRIMARY KEY (request_id),
  CONSTRAINT password_reset_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT password_reset_requests_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(user_id)
);
CREATE TABLE public.professors (
  prof_id integer NOT NULL DEFAULT nextval('professors_prof_id_seq'::regclass),
  user_id integer UNIQUE,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  profile_image character varying DEFAULT 'default_prof.png'::character varying,
  dept_id integer,
  CONSTRAINT professors_pkey PRIMARY KEY (prof_id),
  CONSTRAINT professors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT professors_dept_id_fkey FOREIGN KEY (dept_id) REFERENCES public.departments(dept_id)
);
CREATE TABLE public.roles (
  role_id integer NOT NULL DEFAULT nextval('roles_role_id_seq'::regclass),
  role_name character varying NOT NULL UNIQUE,
  CONSTRAINT roles_pkey PRIMARY KEY (role_id)
);
CREATE TABLE public.students (
  student_id integer NOT NULL DEFAULT nextval('students_student_id_seq'::regclass),
  user_id integer UNIQUE,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  profile_image character varying DEFAULT 'default_std.png'::character varying,
  enrollment_date date DEFAULT CURRENT_DATE,
  CONSTRAINT students_pkey PRIMARY KEY (student_id),
  CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.system_logs (
  log_id integer NOT NULL DEFAULT nextval('system_logs_log_id_seq'::regclass),
  user_id integer,
  action text NOT NULL,
  table_name character varying,
  record_id integer,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT system_logs_pkey PRIMARY KEY (log_id),
  CONSTRAINT system_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.users (
  user_id integer NOT NULL DEFAULT nextval('users_user_id_seq'::regclass),
  username character varying NOT NULL UNIQUE,
  password_secure text NOT NULL,
  email character varying NOT NULL UNIQUE,
  role_id integer,
  is_active boolean DEFAULT true,
  last_login timestamp without time zone,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_pkey PRIMARY KEY (user_id),
  CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id)
);