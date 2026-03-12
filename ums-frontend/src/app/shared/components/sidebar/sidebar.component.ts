import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem { label: string; icon: string; path: string; }

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="sidebar shadow-lg">
      <div class="sidebar-brand">
        <div class="brand-container">
          <div class="brand-icon">
            <i class="bi bi-mortarboard-fill"></i>
          </div>
          <div class="brand-text">
            <span class="brand-name">UMS</span>
            <span class="brand-sub text-truncate">University Management</span>
          </div>
        </div>
      </div>

      <div class="sidebar-user-card px-3 py-4">
        <div class="profile-card">
          <div class="user-avatar-wrap">
            <div class="user-avatar">{{ initials() }}</div>
            <div class="status-indicator"></div>
          </div>
          <div class="user-info">
            <div class="user-name text-truncate">{{ auth.user()?.first_name }} {{ auth.user()?.last_name }}</div>
            <div class="user-role-wrap">
               <span class="user-role" [class]="'role-' + (auth.user()?.role ?? '') | lowercase">
                {{ auth.user()?.role }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="sidebar-nav">
        <div class="nav-section-label">Main Menu</div>
        
        @for (item of navItems(); track item.path) {
          <a [routerLink]="item.path"
             routerLinkActive="active"
             class="nav-link">
            <div class="nav-icon">
              <i class="bi" [class]="item.icon"></i>
            </div>
            <span class="nav-text">{{ item.label }}</span>
            <div class="active-indicator"></div>
          </a>
        }
      </div>

      <div class="sidebar-footer p-3">
        <button class="btn-logout" (click)="auth.logout()">
          <i class="bi bi-box-arrow-left"></i>
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </nav>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');

    .sidebar {
      width: var(--sidebar-width);
      height: 100vh;
      background: #0f172a; /* Slate 900 */
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 1000;
      font-family: 'Prompt', sans-serif;
      border-right: 1px solid rgba(255, 255, 255, 0.05);
    }

    /* 🎓 Brand Style */
    .sidebar-brand {
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.02);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .brand-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.25rem;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }
    .brand-name {
      display: block;
      color: white;
      font-weight: 700;
      font-size: 1.15rem;
      line-height: 1;
      letter-spacing: 0.5px;
    }
    .brand-sub {
      color: #64748b;
      font-size: 0.7rem;
      font-weight: 400;
    }

    /* 👤 Profile Card Style */
    .profile-card {
      display: flex;
      align-items: center;
      gap: 14px;
      background: rgba(255, 255, 255, 0.04);
      padding: 12px;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .user-avatar-wrap {
      position: relative;
    }
    .user-avatar {
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 0.9rem;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    }
    .status-indicator {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 12px;
      height: 12px;
      background: #10b981;
      border: 2px solid #0f172a;
      border-radius: 50%;
    }
    .user-name {
      color: #f8fafc;
      font-weight: 600;
      font-size: 0.85rem;
      max-width: 130px;
    }
    .user-role {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .role-admin { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .role-professor { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .role-student { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }

    /* 📋 Navigation Style */
    .sidebar-nav {
      flex: 1;
      padding: 0 12px;
      overflow-y: auto;
    }
    .sidebar-nav::-webkit-scrollbar { width: 4px; }
    .sidebar-nav::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }

    .nav-section-label {
      padding: 1.5rem 1rem 0.75rem;
      font-size: 0.65rem;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      margin-bottom: 6px;
      border-radius: 12px;
      color: #94a3b8;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      position: relative;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    .nav-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      transition: all 0.3s;
    }

    .nav-link:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #f1f5f9;
      transform: translateX(4px);
    }

    .nav-link.active {
      background: rgba(37, 99, 235, 0.1);
      color: #3b82f6;
    }

    .nav-link.active .nav-icon {
      color: #3b82f6;
    }

    .nav-link.active .active-indicator {
      position: absolute;
      right: 0;
      width: 4px;
      height: 18px;
      background: #3b82f6;
      border-radius: 4px 0 0 4px;
      box-shadow: -2px 0 8px rgba(37, 99, 235, 0.5);
    }

    /* 🚪 Logout Button */
    .sidebar-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .btn-logout {
      width: 100%;
      padding: 12px;
      border-radius: 12px;
      border: none;
      background: rgba(239, 68, 68, 0.05);
      color: #f87171;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.2s;
      cursor: pointer;
    }
    .btn-logout:hover {
      background: #ef4444;
      color: white;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }
  `]
})
export class SidebarComponent {
  auth = inject(AuthService); // ใช้ inject ตามสมัยนิยม

  initials = computed(() => {
    const u = this.auth.user();
    if (!u) return '?';
    return `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase();
  });

  navItems = computed<NavItem[]>(() => {
    const role = this.auth.role();
    if (role === 'Admin') return [
      { label: 'Dashboard Overview', icon: 'bi-grid-1x2-fill', path: '/admin/dashboard' },
      { label: 'จัดการนักศึกษา', icon: 'bi-people-fill', path: '/admin/students' },
      { label: 'จัดการอาจารย์', icon: 'bi-person-badge-fill', path: '/admin/professors' },
      { label: 'คณะและแผนก', icon: 'bi-building-fill', path: '/admin/departments' },
      { label: 'จัดการรายวิชา', icon: 'bi-book-half', path: '/admin/courses' },
      { label: 'ระบบห้องสมุด', icon: 'bi-journal-bookmark-fill', path: '/admin/library' },
      { label: 'Activity Logs', icon: 'bi-shield-lock-fill', path: '/admin/logs' },
    ];
    // ... รายการของ Role อื่นยังคงเหมือนเดิมแต่ปรับ Icon ให้ดูหนาขึ้น (Fill) เพื่อความพรีเมียม
    if (role === 'Professor') return [
      { label: 'Dashboard', icon: 'bi-grid-1x2-fill', path: '/professor/dashboard' },
      { label: 'วิชาที่สอน', icon: 'bi-book-fill', path: '/professor/courses' },
      { label: 'ตารางสอนประจำวัน', icon: 'bi-calendar3-event-fill', path: '/professor/schedule' },
      { label: 'จัดการผลการเรียน', icon: 'bi-patch-check-fill', path: '/professor/grades' },
    ];
    if (role === 'Student') return [
      { label: 'Dashboard', icon: 'bi-grid-1x2-fill', path: '/student/dashboard' },
      { label: 'ลงทะเบียนเรียน', icon: 'bi-plus-circle-fill', path: '/student/enrollments' },
      { label: 'ตารางเรียน', icon: 'bi-calendar3-week-fill', path: '/student/schedule' },
      { label: 'ตารางสอบ', icon: 'bi-file-text-fill', path: '/student/exams' },
      { label: 'ตรวจสอบเกรด', icon: 'bi-bar-chart-fill', path: '/student/grades' },
      { label: 'ยืมหนังสือห้องสมุด', icon: 'bi-journal-bookmark-fill', path: '/student/library' },
    ];
    return [];
  });
}