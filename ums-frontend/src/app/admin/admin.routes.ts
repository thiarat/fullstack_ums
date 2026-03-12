import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard',   loadComponent: () => import('./dashboard/dashboard.component').then(m => m.AdminDashboardComponent) },
  { path: 'students',    loadComponent: () => import('./students/students.component').then(m => m.AdminStudentsComponent) },
  { path: 'professors',  loadComponent: () => import('./professors/professors.component').then(m => m.AdminProfessorsComponent) },
  { path: 'departments', loadComponent: () => import('./departments/departments.component').then(m => m.AdminDepartmentsComponent) },
  { path: 'courses',       loadComponent: () => import('./courses/courses.component').then(m => m.AdminCoursesComponent) },
  { path: 'courses-profs', loadComponent: () => import('./courses-profs/courses-profs.component').then(m => m.AdminCourseProfsComponent) },
  { path: 'library',       loadComponent: () => import('./library/library.component').then(m => m.AdminLibraryComponent) },
  { path: 'logs',        loadComponent: () => import('./logs/logs.component').then(m => m.AdminLogsComponent) },
];
