import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { UiStateService } from '../../../core/services/ui-state.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="topbar">
      <!-- Hamburger (mobile only) -->
      <button class="hamburger-btn" (click)="ui.toggle()" aria-label="เปิด/ปิดเมนู">
        <i class="bi bi-list"></i>
      </button>

      <div class="topbar-left">
        <h1 class="page-title">{{ title }}</h1>
        <p class="page-subtitle" *ngIf="subtitle">{{ subtitle }}</p>
      </div>
      <div class="topbar-right">
        <div class="user-chip">
          <div class="chip-avatar">{{ initials }}</div>
          <span class="chip-name">{{ auth.user()?.first_name }}</span>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      height: var(--topbar-height);
      background: white;
      border-bottom: 1px solid var(--border);
      display: flex; align-items: center; gap: .75rem;
      padding: 0 1.5rem;
      position: fixed;
      top: 0; left: var(--sidebar-width); right: 0;
      z-index: 99;
      box-shadow: var(--shadow-sm);
      transition: left .25s cubic-bezier(.4,0,.2,1);
    }
    .topbar-left { flex: 1; min-width: 0; }
    .page-title {
      font-size: 1.1rem; font-weight: 700; margin: 0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .page-subtitle { font-size: .78rem; color: var(--text-muted); margin: 0; }
    .topbar-right { display: flex; align-items: center; gap: 1rem; flex-shrink: 0; }

    .hamburger-btn {
      display: none;
      background: none; border: none; cursor: pointer;
      font-size: 1.4rem; color: var(--text-secondary);
      padding: .3rem; border-radius: 6px; flex-shrink: 0;
      transition: color .15s, background .15s;
      align-items: center; justify-content: center;
      &:hover { color: var(--text-primary); background: var(--bg-body); }
    }

    .user-chip {
      display: flex; align-items: center; gap: .625rem;
      background: var(--bg-body); border-radius: 20px;
      padding: .35rem .875rem .35rem .35rem; cursor: pointer;
    }
    .chip-avatar {
      width: 30px; height: 30px; border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 700; font-size: .72rem; flex-shrink: 0;
    }
    .chip-name { font-size: .82rem; font-weight: 600; color: var(--text-primary); }

    /* Mobile */
    @media (max-width: 768px) {
      .topbar { left: 0; padding: 0 1rem; }
      .hamburger-btn { display: flex; }
      .chip-name { display: none; }
    }
  `]
})
export class TopbarComponent {
  @Input() title = '';
  @Input() subtitle = '';

  ui = inject(UiStateService);

  get initials(): string {
    const u = this.auth.user();
    return `${u?.first_name?.[0] ?? ''}${u?.last_name?.[0] ?? ''}`.toUpperCase();
  }

  constructor(public auth: AuthService) {}
}
