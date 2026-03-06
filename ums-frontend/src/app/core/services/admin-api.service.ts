import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AdminApiService extends ApiService {
  constructor(http: HttpClient) { super(http); }

  getDashboard()                      { return this.get<any>('/admin/dashboard'); }

  // Students
  getStudents(params: any = {})       { return this.get<any>('/admin/students', params); }
  getStudentById(id: number)          { return this.get<any>(`/admin/students/${id}`); }
  getStudentSchedule(id: number)      { return this.get<any>(`/admin/students/${id}/schedule`); }
  updateStudentStatus(id: number, is_active: boolean) {
    return this.patch(`/admin/students/${id}/status`, { is_active });
  }

  // User CRUD
  createUser(body: any)               { return this.post<any>('/admin/users', body); }
  updateUser(id: number, body: any)   { return this.put<any>(`/admin/users/${id}`, body); }
  deleteUser(id: number)              { return this.delete<any>(`/admin/users/${id}`); }
  adminResetPassword(id: number, newPassword: string) {
    return this.patch(`/admin/users/${id}/reset-password`, { new_password: newPassword });
  }

  // Password Reset Requests
  getPasswordResetRequests()          { return this.get<any>('/admin/password-reset-requests'); }
  approvePasswordReset(requestId: number, newPassword: string) {
    return this.post<any>(`/admin/password-reset-requests/${requestId}/approve`, { new_password: newPassword });
  }
  rejectPasswordReset(requestId: number) {
    return this.post<any>(`/admin/password-reset-requests/${requestId}/reject`, {});
  }

  // Professors
  getProfessors(params: any = {})     { return this.get<any>('/admin/professors', params); }

  // Departments
  getDepartments()                    { return this.get<any>('/admin/departments'); }
  createDepartment(body: any)         { return this.post<any>('/admin/departments', body); }
  updateDepartment(id: number, body: any) { return this.put<any>(`/admin/departments/${id}`, body); }
  deleteDepartment(id: number)        { return this.delete<any>(`/admin/departments/${id}`); }

  // Courses
  getCourses(params: any = {})        { return this.get<any>('/admin/courses', params); }
  createCourse(body: any)             { return this.post<any>('/admin/courses', body); }
  updateCourse(id: number, body: any) { return this.put<any>(`/admin/courses/${id}`, body); }
  deleteCourse(id: number)            { return this.delete<any>(`/admin/courses/${id}`); }

  // System Logs
  getSystemLogs(params: any = {})     { return this.get<any>('/admin/logs', params); }
}
