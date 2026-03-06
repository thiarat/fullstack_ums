import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { AdminDashboard, Student, Professor, Department, Course, SystemLog, PaginatedData } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class AdminApiService extends ApiService {
  constructor(http: HttpClient) { super(http); }

  getDashboard() {
    return this.get<AdminDashboard>('/admin/dashboard');
  }

  getStudents(page = 1, limit = 20, search = '') {
    return this.get<PaginatedData<Student>>('/admin/students', { page, limit, search });
  }

  getStudentById(id: number) {
    return this.get<Student>(`/admin/students/${id}`);
  }

  updateStudentStatus(id: number, is_active: boolean) {
    return this.patch(`/admin/students/${id}/status`, { is_active });
  }

  getProfessors(page = 1, limit = 20, search = '', dept_id?: number) {
    return this.get<PaginatedData<Professor>>('/admin/professors', { page, limit, search, ...(dept_id ? { dept_id } : {}) });
  }

  getDepartments() {
    return this.get<Department[]>('/admin/departments');
  }

  createDepartment(body: { name: string; location: string }) {
    return this.post<Department>('/admin/departments', body);
  }

  updateDepartment(id: number, body: Partial<Department>) {
    return this.put<Department>(`/admin/departments/${id}`, body);
  }

  deleteDepartment(id: number) {
    return this.delete(`/admin/departments/${id}`);
  }

  getCourses(page = 1, limit = 20, search = '', dept_id?: number) {
    return this.get<PaginatedData<Course>>('/admin/courses', { page, limit, search, ...(dept_id ? { dept_id } : {}) });
  }

  createCourse(body: Partial<Course>) {
    return this.post<Course>('/admin/courses', body);
  }

  updateCourse(id: number, body: Partial<Course>) {
    return this.put<Course>(`/admin/courses/${id}`, body);
  }

  deleteCourse(id: number) {
    return this.delete(`/admin/courses/${id}`);
  }

  getSystemLogs(page = 1, limit = 50) {
    return this.get<PaginatedData<SystemLog>>('/admin/logs', { page, limit });
  }
}

  // Student schedule popup
  getStudentSchedule(studentId: number) {
    return this.api.get(`/admin/students/${studentId}/schedule`);
  }

  // User CRUD
  createUser(body: any) { return this.api.post('/admin/users', body); }
  updateUser(userId: number, body: any) { return this.api.put(`/admin/users/${userId}`, body); }
  deleteUser(userId: number) { return this.api.delete(`/admin/users/${userId}`); }
  adminResetPassword(userId: number, newPassword: string) {
    return this.api.patch(`/admin/users/${userId}/reset-password`, { new_password: newPassword });
  }

  // Password reset requests
  getPasswordResetRequests() { return this.api.get('/admin/password-reset-requests'); }
  approvePasswordReset(requestId: number, newPassword: string) {
    return this.api.post(`/admin/password-reset-requests/${requestId}/approve`, { new_password: newPassword });
  }
  rejectPasswordReset(requestId: number) {
    return this.api.post(`/admin/password-reset-requests/${requestId}/reject`, {});
  }
