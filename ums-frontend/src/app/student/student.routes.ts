import { Routes } from '@angular/router';

export const studentRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard',   loadComponent: () => import('./dashboard/dashboard.component').then(m => m.StudentDashboardComponent) },
  { path: 'enrollments', loadComponent: () => import('./enrollments/enrollments.component').then(m => m.StudentEnrollmentsComponent) },
  { path: 'schedule',    loadComponent: () => import('./schedule/schedule.component').then(m => m.StudentScheduleComponent) },
  { path: 'exams',       loadComponent: () => import('./schedule/schedule.component').then(m => m.StudentScheduleComponent) },
  { path: 'grades',      loadComponent: () => import('./grades/grades.component').then(m => m.StudentGradesComponent) },
  { path: 'library',     loadComponent: () => import('./library/library.component').then(m => m.StudentLibraryComponent) },
];
