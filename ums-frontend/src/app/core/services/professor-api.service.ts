import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ProfessorApiService extends ApiService {
  constructor(http: HttpClient) { super(http); }

  getDashboard()                       { return this.get<any>('/professor/dashboard'); }
  getMyCourses()                       { return this.get<any[]>('/professor/courses'); }
  getCourseStudents(courseId: number)  { return this.get<any[]>(`/professor/courses/${courseId}/students`); }
  submitGrade(enrollmentId: number, grade: string) { return this.patch(`/professor/grades/${enrollmentId}`, { grade }); }
  submitBulkGrades(courseId: number, grades: { enrollment_id: number; grade: string }[]) {
    return this.post(`/professor/courses/${courseId}/grades`, { grades });
  }
  getSchedule()                        { return this.get<any[]>('/professor/schedule'); }
  addSchedule(body: any)               { return this.post('/professor/schedule', body); }
  updateSchedule(scheduleId: number, body: any) { return this.put(`/professor/schedule/${scheduleId}`, body); }
  deleteSchedule(scheduleId: number)   { return this.delete(`/professor/schedule/${scheduleId}`); }
  getExams()                           { return this.get<any[]>('/professor/exams'); }
  createExam(body: any)                { return this.post('/professor/exams', body); }
}
