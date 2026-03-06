# fix_errors_v3.ps1 - รันใน ums-frontend folder
$base = "src/app"

Write-Host "Fixing class names..." -ForegroundColor Cyan

# Fix 1-3: class names (เหมือนเดิม)
(Get-Content "$base/admin/students/students.component.ts" -Raw) `
  -replace 'export class StudentsComponent implements OnInit', 'export class AdminStudentsComponent implements OnInit' |
  Set-Content "$base/admin/students/students.component.ts"

(Get-Content "$base/professor/courses/courses.component.ts" -Raw) `
  -replace 'export class CoursesComponent implements OnInit', 'export class ProfCoursesComponent implements OnInit' |
  Set-Content "$base/professor/courses/courses.component.ts"

(Get-Content "$base/student/dashboard/dashboard.component.ts" -Raw) `
  -replace 'export class DashboardComponent implements OnInit', 'export class StudentDashboardComponent implements OnInit' |
  Set-Content "$base/student/dashboard/dashboard.component.ts"

Write-Host "Fixing admin-api.service.ts..." -ForegroundColor Cyan

# Fix 4: admin-api.service.ts
@'
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AdminApiService extends ApiService {
  constructor(http: HttpClient) { super(http); }

  getDashboard() { return this.get<any>('/admin/dashboard'); }

  getStudents(params: any = {}) { return this.get<any>('/admin/students', params); }
  getStudentById(id: number) { return this.get<any>(`/admin/students/${id}`); }
  getStudentSchedule(id: number) { return this.get<any>(`/admin/students/${id}/schedule`); }
  updateStudentStatus(id: number, is_active: boolean) {
    return this.patch(`/admin/students/${id}/status`, { is_active });
  }

  createUser(body: any) { return this.post<any>('/admin/users', body); }
  updateUser(id: number, body: any) { return this.put<any>(`/admin/users/${id}`, body); }
  deleteUser(id: number) { return this.delete<any>(`/admin/users/${id}`); }
  adminResetPassword(id: number, newPassword: string) {
    return this.patch(`/admin/users/${id}/reset-password`, { new_password: newPassword });
  }

  getPasswordResetRequests() { return this.get<any>('/admin/password-reset-requests'); }
  approvePasswordReset(requestId: number, newPassword: string) {
    return this.post<any>(`/admin/password-reset-requests/${requestId}/approve`, { new_password: newPassword });
  }
  rejectPasswordReset(requestId: number) {
    return this.post<any>(`/admin/password-reset-requests/${requestId}/reject`, {});
  }

  getProfessors(page: any = 1, limit = 20, search = '', dept_id?: number) {
    const params = typeof page === 'object' ? page : { page, limit, search, ...(dept_id ? { dept_id } : {}) };
    return this.get<any>('/admin/professors', params);
  }

  getDepartments() { return this.get<any>('/admin/departments'); }
  createDepartment(body: any) { return this.post<any>('/admin/departments', body); }
  updateDepartment(id: number, body: any) { return this.put<any>(`/admin/departments/${id}`, body); }
  deleteDepartment(id: number) { return this.delete<any>(`/admin/departments/${id}`); }

  getCourses(page: any = 1, limit = 20, search = '', dept_id?: number) {
    const params = typeof page === 'object' ? page : { page, limit, search, ...(dept_id ? { dept_id } : {}) };
    return this.get<any>('/admin/courses', params);
  }
  createCourse(body: any) { return this.post<any>('/admin/courses', body); }
  updateCourse(id: number, body: any) { return this.put<any>(`/admin/courses/${id}`, body); }
  deleteCourse(id: number) { return this.delete<any>(`/admin/courses/${id}`); }

  getSystemLogs(page = 1, limit = 50) {
    return this.get<any>('/admin/logs', { page, limit });
  }
}
'@ | Set-Content "$base/core/services/admin-api.service.ts"

Write-Host "All done!" -ForegroundColor Green
Write-Host "Run: vercel --prod" -ForegroundColor Yellow
