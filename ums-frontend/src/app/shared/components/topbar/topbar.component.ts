import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="topbar">
      <div class="topbar-left">
        <h1 class="page-title">{{ title }}</h1>
        <p class="page-subtitle" *ngIf="subtitle">{{ subtitle }}</p>
      </div>
      
      <div class="topbar-right">
        <div class="user-chip" *ngIf="auth.user() as user; else loading">
          <div class="chip-avatar">{{ initials() }}</div>
          <div class="user-info d-none d-md-flex">
            <span class="chip-name">{{ user.first_name }} {{ user.last_name }}</span>
            <span class="chip-role" *ngIf="user.role">{{ user.role }}</span>
          </div>
        </div>

        <ng-template #loading>
          <div class="user-chip loading-shimmer">
            <div class="chip-avatar">?</div>
            <span class="chip-name">กำลังโหลด...</span>
          </div>
        </ng-template>
      </div>
    </header>
  `,
  styles: [`
    :host {
      --topbar-height: 70px;
      --sidebar-width: 260px; /* ปรับให้ตรงกับ Sidebar ของคุณ */
    }
    .topbar {
      height: var(--topbar-height);
      background: white;
      border-bottom: 1px solid #edf2f7;
      display: flex; 
      align-items: center;
      padding: 0 2rem;
      position: fixed;
      top: 0; 
      left: var(--sidebar-width); 
      right: 0;
      z-index: 99;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .topbar-left { flex: 1; }
    .page-title { font-size: 1.1rem; font-weight: 700; margin: 0; color: #1a202c; }
    .page-subtitle { font-size: .78rem; color: #718096; margin: 0; }
    .topbar-right { display: flex; align-items: center; gap: 1rem; }
    
    .user-chip {
      display: flex; 
      align-items: center; 
      gap: .75rem;
      background: #f7fafc; 
      border-radius: 50px;
      padding: .4rem 1rem .4rem .4rem;
      border: 1px solid #e2e8f0;
      transition: all 0.2s;
    }
    .user-chip:hover { background: #edf2f7; }
    
    .user-info { display: flex; flex-direction: column; line-height: 1.2; }
    
    .chip-avatar {
      width: 35px; height: 35px; border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 700; font-size: .8rem;
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
    }
    .chip-name { font-size: .85rem; font-weight: 600; color: #2d3748; }
    .chip-role { font-size: .65rem; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; }

    .loading-shimmer { opacity: 0.6; cursor: wait; }
  `]
})
export class TopbarComponent {
  @Input() title = 'Dashboard';
  @Input() subtitle = '';

  // ใช้ computed signal เพื่อความแรงและประหยัดทรัพยากร
  initials = computed(() => {
    const u = this.auth.user();
    if (!u) return '?';
    const first = u.first_name?.[0] || '';
    const last = u.last_name?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  });

  constructor(public auth: AuthService) {}
}