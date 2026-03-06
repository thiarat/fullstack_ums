import { Routes } from '@angular/router';
import { authGuard, adminGuard, professorGuard, studentGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // Auth
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },

  // Admin
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes)
  },

  // Student
  {
    path: 'student',
    canActivate: [authGuard, studentGuard],
    loadChildren: () => import('./student/student.routes').then(m => m.studentRoutes)
  },

  // Professor
  {
    path: 'professor',
    canActivate: [authGuard, professorGuard],
    loadChildren: () => import('./professor/professor.routes').then(m => m.professorRoutes)
  },

  { path: '**', redirectTo: '/login' }
];
