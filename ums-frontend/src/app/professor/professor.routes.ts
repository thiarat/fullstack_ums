import { Routes } from '@angular/router';

export const professorRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.ProfDashboardComponent) },
  { path: 'courses',   loadComponent: () => import('./courses/courses.component').then(m => m.ProfCoursesComponent) },
  { path: 'schedule',  loadComponent: () => import('./schedule/schedule.component').then(m => m.ProfScheduleComponent) },
  { path: 'grades',    loadComponent: () => import('./grades/grades.component').then(m => m.ProfGradesComponent) },
];
