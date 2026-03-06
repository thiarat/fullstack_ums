import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { Enrollment, ClassSchedule, ExamSchedule, Book, LibraryRecord } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class StudentApiService extends ApiService {
  constructor(http: HttpClient) { super(http); }

  getDashboard()               { return this.get<any>('/student/dashboard'); }
  getEnrollments(semester = '') { return this.get<Enrollment[]>('/student/enrollments', semester ? { semester } : {}); }
  getAvailableCourses()        { return this.get<any[]>('/student/enrollments/available'); }
  enrollCourse(course_id: number, semester: string, schedule_id?: number) { return this.post('/student/enrollments', { course_id, semester, schedule_id }); }
  withdrawCourse(enrollmentId: number) { return this.patch(`/student/enrollments/${enrollmentId}/withdraw`); }
  getSchedule()                { return this.get<ClassSchedule[]>('/student/schedule'); }
  getExams()                   { return this.get<ExamSchedule[]>('/student/exams'); }
  getGrades()                  { return this.get<any>('/student/grades'); }
  getBorrowedBooks()           { return this.get<LibraryRecord[]>('/student/library/borrowed'); }
  searchBooks(search = '', dept = '', page = 1) { return this.get<Book[]>('/student/library/books', { search, dept, page }); }
}
