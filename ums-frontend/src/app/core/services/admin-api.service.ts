import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AdminApiService extends ApiService {
  constructor(http: HttpClient) { super(http); }

  getDashboard() { return this.get<any>('/admin/dashboard'); }

  // Students
  getStudents(params: any = {}) { return this.get<any>('/admin/students', params); }
  getStudentById(id: number) { return this.get<any>(`/admin/students/${id}`); }
  getStudentSchedule(id: number) { return this.get<any>(`/admin/students/${id}/schedule`); }
  updateStudentStatus(id: number, is_active: boolean) {
    return this.patch(`/admin/students/${id}/status`, { is_active });
  }

  // User CRUD
  createUser(body: any) { return this.post<any>('/admin/users', body); }
  updateUser(id: number, body: any) { return this.put<any>(`/admin/users/${id}`, body); }
  deleteUser(id: number) { return this.delete<any>(`/admin/users/${id}`); }
  adminResetPassword(id: number, newPassword: string) {
    return this.patch(`/admin/users/${id}/reset-password`, { new_password: newPassword });
  }

  // Password Reset Requests
  getPasswordResetRequests() { return this.get<any>('/admin/password-reset-requests'); }
  getPasswordResetHistory()  { return this.get<any>('/admin/password-reset-requests/history'); }
  approvePasswordReset(requestId: number, newPassword: string) {
    return this.post<any>(`/admin/password-reset-requests/${requestId}/approve`, { new_password: newPassword });
  }
  rejectPasswordReset(requestId: number) {
    return this.post<any>(`/admin/password-reset-requests/${requestId}/reject`, {});
  }

  // Professors — รับทั้ง positional args และ params object
  getProfessorSchedule(profId: number) { return this.get<any>(`/admin/professors/${profId}/schedule`); }
  getProfSchedule(profId: number)      { return this.get<any>(`/admin/professors/${profId}/schedule`); }
  createProfessor(body: any)           { return this.post<any>('/admin/users', body); }
  updateProfessor(profId: number, body: any) { return this.put<any>(`/admin/professors/${profId}`, body); }
  getProfessors(pageOrParams: any = 1, limit = 20, search = '', dept_id?: number) {
    const params = typeof pageOrParams === 'object'
      ? pageOrParams
      : { page: pageOrParams, limit, search, ...(dept_id ? { dept_id } : {}) };
    return this.get<any>('/admin/professors', params);
  }

  // Departments
  getDepartments() { return this.get<any>('/admin/departments'); }
  createDepartment(body: any) { return this.post<any>('/admin/departments', body); }
  updateDepartment(id: number, body: any) { return this.put<any>(`/admin/departments/${id}`, body); }
  deleteDepartment(id: number) { return this.delete<any>(`/admin/departments/${id}`); }

  // Courses-Profs (รายวิชา-อาจารย์)
  getCourseProfList(params: any = {}) { return this.get<any>('/admin/courses-profs', params); }
  getCourseProfStudents(scheduleId: number) { return this.get<any>(`/admin/courses-profs/${scheduleId}/students`); }

  // Courses — รับทั้ง positional args และ params object
  getCourseSchedule(courseId: number) { return this.get<any>(`/admin/courses/${courseId}/schedule`); }
  getCourses(pageOrParams: any = 1, limit = 20, search = '', dept_id?: number) {
    const params = typeof pageOrParams === 'object'
      ? pageOrParams
      : { page: pageOrParams, limit, search, ...(dept_id ? { dept_id } : {}) };
    return this.get<any>('/admin/courses', params);
  }
  createCourse(body: any) { return this.post<any>('/admin/courses', body); }
  updateCourse(id: number, body: any) { return this.put<any>(`/admin/courses/${id}`, body); }
  deleteCourse(id: number) { return this.delete<any>(`/admin/courses/${id}`); }

  // Exam Schedules
  getExamSchedules(params: any = {}) { return this.get<any>('/admin/exam-schedules', params); }
  updateExamSchedule(examId: number, body: any) { return this.put<any>(`/admin/exam-schedules/${examId}`, body); }
  deleteExamSchedule(examId: number) { return this.delete<any>(`/admin/exam-schedules/${examId}`); }

  // System Logs — รับ page, limit แบบ positional
  getSystemLogs(page = 1, limit = 50) {
    return this.get<any>('/admin/logs', { page, limit });
  }
}
