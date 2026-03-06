import { Component, Input } from '@angular/core';
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
        <div class="user-chip">
          <div class="chip-avatar">{{ initials }}</div>
          <span class="chip-name d-none d-md-block">{{ auth.user()?.first_name }}</span>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      height: var(--topbar-height);
      background: white;
      border-bottom: 1px solid var(--border);
      display: flex; align-items: center;
      padding: 0 2rem;
      position: fixed;
      top: 0; left: var(--sidebar-width); right: 0;
      z-index: 99;
      box-shadow: var(--shadow-sm);
    }
    .topbar-left { flex: 1; }
    .page-title { font-size: 1.1rem; font-weight: 700; margin: 0; }
    .page-subtitle { font-size: .78rem; color: var(--text-muted); margin: 0; }
    .topbar-right { display: flex; align-items: center; gap: 1rem; }
    .user-chip {
      display: flex; align-items: center; gap: .625rem;
      background: var(--bg-body); border-radius: 20px;
      padding: .35rem .875rem .35rem .35rem;
      cursor: pointer;
    }
    .chip-avatar {
      width: 30px; height: 30px; border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 700; font-size: .72rem;
    }
    .chip-name { font-size: .82rem; font-weight: 600; color: var(--text-primary); }
  `]
})
export class TopbarComponent {
  @Input() title = '';
  @Input() subtitle = '';

  get initials(): string {
    const u = this.auth.user();
    return `${u?.first_name?.[0] ?? ''}${u?.last_name?.[0] ?? ''}`.toUpperCase();
  }

  constructor(public auth: AuthService) {}
}
