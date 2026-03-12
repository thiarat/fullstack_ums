import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem { label: string; icon: string; path: string; }

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon"><i class="bi bi-mortarboard-fill"></i></div>
        <div class="brand-text">
          <span class="brand-name">UMS</span>
          <span class="brand-sub">University System</span>
        </div>
      </div>

      <div class="sidebar-user">
        <div class="user-avatar">{{ initials() }}</div>
        <div class="user-info">
          <div class="user-name">{{ auth.user()?.first_name }} {{ auth.user()?.last_name }}</div>
          <span class="user-role" [class]="'role-' + (auth.user()?.role ?? '') | lowercase">
            {{ auth.user()?.role }}
          </span>
        </div>
      </div>

      <div class="sidebar-nav">
        <div class="nav-section">เมนูหลัก</div>
        <a *ngFor="let item of navItems()"
           class="nav-item"
           [routerLink]="item.path"
           routerLinkActive="active">
          <i class="bi" [class]="item.icon"></i>
          <span>{{ item.label }}</span>
        </a>
      </div>

      <div class="sidebar-footer">
        <button class="nav-item logout-btn" (click)="auth.logout()">
          <i class="bi bi-box-arrow-left"></i>
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </nav>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width); height: 100vh;
      background: var(--sidebar-bg);
      display: flex; flex-direction: column;
      position: fixed; left: 0; top: 0; z-index: 100;
    }
    .sidebar-brand {
      padding: 1.25rem; display: flex; align-items: center; gap: .875rem;
      border-bottom: 1px solid rgba(255,255,255,.06);
      min-height: var(--topbar-height);
    }
    .brand-icon {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      border-radius: 10px; display: flex; align-items: center; justify-content: center;
      color: white; font-size: 1rem; flex-shrink: 0;
    }
    .brand-name { display: block; color: white; font-weight: 700; font-size: 1rem; }
    .brand-sub  { display: block; color: #475569; font-size: .68rem; }
    .sidebar-user {
      padding: 1rem 1.25rem; display: flex; align-items: center; gap: .75rem;
      border-bottom: 1px solid rgba(255,255,255,.06);
    }
    .user-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 700; font-size: .8rem; flex-shrink: 0;
    }
    .user-name { color: #e2e8f0; font-size: .82rem; font-weight: 500; }
    .user-role {
      font-size: .68rem; font-weight: 600; padding: .15em .55em;
      border-radius: 3px; display: inline-block; margin-top: 2px;
    }
    .role-admin     { background: rgba(139,92,246,.25); color: #c4b5fd; }
    .role-professor { background: rgba(16,185,129,.2);  color: #6ee7b7; }
    .role-student   { background: rgba(59,130,246,.2);  color: #93c5fd; }
    .sidebar-nav {
      flex: 1; overflow-y: auto; padding: .75rem 0;
      &::-webkit-scrollbar { width: 3px; }
      &::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); }
    }
    .nav-section {
      padding: .5rem 1.25rem .3rem; font-size: .63rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: .1em; color: #475569;
    }
    .nav-item {
      display: flex; align-items: center; gap: .75rem;
      padding: .65rem 1.25rem; margin: 1px .75rem;
      border-radius: 8px; color: #94a3b8;
      text-decoration: none; font-size: .875rem; font-weight: 500;
      cursor: pointer; background: none; border: none;
      width: calc(100% - 1.5rem);
      transition: background .15s, color .15s;
      i { font-size: 1rem; flex-shrink: 0; }
      &:hover { background: rgba(255,255,255,.07); color: #e2e8f0; }
      &.active { background: rgba(59,130,246,.2); color: #60a5fa; }
    }
    .sidebar-footer { padding: .75rem 0 1rem; border-top: 1px solid rgba(255,255,255,.06); }
    .logout-btn { color: #64748b; text-align: left;
      &:hover { color: #ef4444 !important; background: rgba(239,68,68,.1) !important; }
    }
  `]
})
export class SidebarComponent {
  initials = computed(() => {
    const u = this.auth.user();
    return `${u?.first_name?.[0] ?? ''}${u?.last_name?.[0] ?? ''}`.toUpperCase() || '?';
  });

  navItems = computed<NavItem[]>(() => {
    const role = this.auth.role();
    if (role === 'Admin') return [
      { label: 'Dashboard',    icon: 'bi-speedometer2',    path: '/admin/dashboard' },
      { label: 'นักศึกษา',    icon: 'bi-people-fill',     path: '/admin/students' },
      { label: 'อาจารย์',     icon: 'bi-person-badge',    path: '/admin/professors' },
      { label: 'แผนก',        icon: 'bi-building',         path: '/admin/departments' },
      { label: 'รายวิชา',          icon: 'bi-book',              path: '/admin/courses' },
      { label: 'รายวิชา - อาจารย์', icon: 'bi-person-video2',    path: '/admin/courses-profs' },
      { label: 'ห้องสมุด',         icon: 'bi-journal-bookmark',  path: '/admin/library' },
      { label: 'System Logs', icon: 'bi-clipboard-data',   path: '/admin/logs' },
    ];
    if (role === 'Professor') return [
      { label: 'Dashboard',     icon: 'bi-speedometer2',   path: '/professor/dashboard' },
      { label: 'รายวิชาของฉัน', icon: 'bi-book',           path: '/professor/courses' },
      { label: 'ตารางสอน',     icon: 'bi-calendar3',      path: '/professor/schedule' },
      { label: 'บันทึกเกรด',   icon: 'bi-pencil-square',  path: '/professor/grades' },
    ];
    if (role === 'Student') return [
      { label: 'Dashboard',    icon: 'bi-speedometer2',      path: '/student/dashboard' },
      { label: 'ลงทะเบียน',   icon: 'bi-journal-plus',      path: '/student/enrollments' },
      { label: 'ตารางเรียน',  icon: 'bi-calendar3',         path: '/student/schedule' },
      { label: 'ตารางสอบ',    icon: 'bi-file-earmark-text', path: '/student/exams' },
      { label: 'ผลการเรียน',  icon: 'bi-bar-chart',         path: '/student/grades' },
      { label: 'ห้องสมุด',    icon: 'bi-journal-bookmark',  path: '/student/library' },
    ];
    return [];
  });

  constructor(public auth: AuthService) {}
}
