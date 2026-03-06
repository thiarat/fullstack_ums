import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-page">
      <div class="login-left">
        <div class="brand-area fade-in-up">
          <div class="brand-logo">
            <i class="bi bi-mortarboard-fill"></i>
          </div>
          <h1>University<br>Management<br>System</h1>
          <p>ระบบบริหารจัดการมหาวิทยาลัย</p>
        </div>
        <div class="features fade-in-up" style="animation-delay:.2s">
          <div class="feature-item" *ngFor="let f of features">
            <i class="bi" [class]="f.icon"></i>
            <span>{{ f.label }}</span>
          </div>
        </div>
      </div>

      <div class="login-right">
        <div class="login-card fade-in-up" style="animation-delay:.1s">
          <div class="login-header">
            <h2>เข้าสู่ระบบ</h2>
            <p>กรุณาใส่ข้อมูลเพื่อเข้าใช้งาน</p>
          </div>

          <div class="role-hint">
            <div class="hint-item admin">
              <span class="hint-badge">Admin / Professor</span>
              <span>Username + Password</span>
            </div>
            <div class="hint-item student">
              <span class="hint-badge">Student</span>
              <span>รหัสนักศึกษา 13 หลัก + 6 หลักท้าย</span>
            </div>
          </div>

          <form [formGroup]="form" (ngSubmit)="onLogin()">
            <div class="form-group">
              <label>Username / รหัสนักศึกษา</label>
              <div class="input-wrapper">
                <i class="bi bi-person"></i>
                <input
                  type="text"
                  formControlName="username"
                  class="form-control"
                  [class.is-invalid]="submitted && f['username'].errors"
                  placeholder="admin / 6601234567891"
                  autocomplete="username">
              </div>
              <div class="invalid-msg" *ngIf="submitted && f['username'].errors">
                กรุณาใส่ username
              </div>
            </div>

            <div class="form-group">
              <label>Password</label>
              <div class="input-wrapper">
                <i class="bi bi-lock"></i>
                <input
                  [type]="showPwd() ? 'text' : 'password'"
                  formControlName="password"
                  class="form-control"
                  [class.is-invalid]="submitted && f['password'].errors"
                  placeholder="••••••••"
                  autocomplete="current-password">
                <button type="button" class="toggle-pwd" (click)="showPwd.set(!showPwd())">
                  <i class="bi" [class.bi-eye]="!showPwd()" [class.bi-eye-slash]="showPwd()"></i>
                </button>
              </div>
              <div class="invalid-msg" *ngIf="submitted && f['password'].errors">
                กรุณาใส่ password
              </div>
            </div>

            <div class="error-msg" *ngIf="errorMsg()">
              <i class="bi bi-exclamation-circle"></i> {{ errorMsg() }}
            </div>

            <button type="submit" class="btn-login" [disabled]="loading()">
              <span class="spinner-border spinner-border-sm me-2" *ngIf="loading()"></span>
              <i class="bi bi-box-arrow-in-right me-2" *ngIf="!loading()"></i>
              {{ loading() ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      display: flex;
      min-height: 100vh;
      background: #0f172a;
    }

    /* ── Left Panel ── */
    .login-left {
      flex: 1;
      padding: 4rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        width: 500px; height: 500px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(59,130,246,.15) 0%, transparent 70%);
        top: -100px; left: -100px;
        pointer-events: none;
      }

      &::after {
        content: '';
        position: absolute;
        width: 400px; height: 400px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(99,102,241,.1) 0%, transparent 70%);
        bottom: -100px; right: -100px;
        pointer-events: none;
      }
    }

    .brand-area {
      margin-bottom: 3rem;
      position: relative;
      z-index: 1;
    }

    .brand-logo {
      width: 72px; height: 72px;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      border-radius: 20px;
      display: flex; align-items: center; justify-content: center;
      font-size: 2rem; color: white;
      margin-bottom: 1.5rem;
      box-shadow: 0 8px 24px rgba(59,130,246,.4);
    }

    .brand-area h1 {
      font-size: 2.5rem;
      font-weight: 800;
      color: white;
      line-height: 1.15;
      letter-spacing: -.03em;
      margin-bottom: .75rem;
    }

    .brand-area p {
      color: #94a3b8;
      font-size: 1rem;
    }

    .features {
      display: flex;
      flex-direction: column;
      gap: .875rem;
      position: relative;
      z-index: 1;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: .875rem;
      color: #cbd5e1;
      font-size: .9rem;

      i {
        width: 36px; height: 36px;
        background: rgba(255,255,255,.07);
        border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        color: #60a5fa;
        flex-shrink: 0;
      }
    }

    /* ── Right Panel ── */
    .login-right {
      width: 480px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: #f1f5f9;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
    }

    .login-header {
      margin-bottom: 1.75rem;
      h2 {
        font-size: 1.75rem;
        font-weight: 700;
        color: #0f172a;
        letter-spacing: -.02em;
        margin-bottom: .35rem;
      }
      p { color: #64748b; font-size: .9rem; }
    }

    /* Role Hints */
    .role-hint {
      background: white;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      padding: .875rem 1rem;
      margin-bottom: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: .625rem;
    }

    .hint-item {
      display: flex;
      align-items: center;
      gap: .625rem;
      font-size: .8rem;
      color: #475569;
    }

    .hint-badge {
      font-weight: 600;
      font-size: .72rem;
      padding: .2em .6em;
      border-radius: 4px;
      white-space: nowrap;
    }

    .admin .hint-badge  { background: #ede9fe; color: #6d28d9; }
    .student .hint-badge { background: #dbeafe; color: #1e40af; }

    /* Form */
    .form-group {
      margin-bottom: 1.25rem;

      label {
        display: block;
        font-size: .78rem;
        font-weight: 600;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: .05em;
        margin-bottom: .45rem;
      }
    }

    .input-wrapper {
      position: relative;

      > i:first-child {
        position: absolute; left: .875rem; top: 50%;
        transform: translateY(-50%);
        color: #94a3b8; font-size: .95rem;
        pointer-events: none;
      }

      .form-control {
        padding-left: 2.5rem;
        padding-right: 2.75rem;
        height: 46px;
        border: 1.5px solid #e2e8f0;
        border-radius: 8px;
        font-size: .9rem;
        background: white;
        transition: border-color .15s, box-shadow .15s;

        &:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,.12);
          outline: none;
        }

        &.is-invalid { border-color: #ef4444; }
      }
    }

    .toggle-pwd {
      position: absolute; right: .75rem; top: 50%;
      transform: translateY(-50%);
      background: none; border: none; cursor: pointer;
      color: #94a3b8; padding: .25rem;
      &:hover { color: #475569; }
    }

    .invalid-msg {
      font-size: .78rem; color: #ef4444; margin-top: .35rem;
    }

    .error-msg {
      background: #fef2f2;
      color: #991b1b;
      border-radius: 8px;
      padding: .75rem 1rem;
      font-size: .85rem;
      margin-bottom: 1rem;
      display: flex; align-items: center; gap: .5rem;
    }

    .btn-login {
      width: 100%;
      height: 48px;
      background: linear-gradient(135deg, #2563eb, #4f46e5);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: .95rem;
      font-weight: 600;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: opacity .2s, transform .1s;
      font-family: var(--font-body);

      &:hover:not(:disabled) {
        opacity: .92;
        transform: translateY(-1px);
      }

      &:disabled { opacity: .65; cursor: not-allowed; }
    }

    @media (max-width: 768px) {
      .login-page { flex-direction: column; }
      .login-left { padding: 2.5rem 1.5rem; flex: none; }
      .login-right { width: 100%; flex: 1; }
      .brand-area h1 { font-size: 1.75rem; }
    }
  `]
})
export class LoginComponent {
  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  submitted = false;
  loading = signal(false);
  errorMsg = signal('');
  showPwd = signal(false);

  features = [
    { icon: 'bi-people-fill',      label: 'จัดการนักศึกษาและอาจารย์' },
    { icon: 'bi-book-fill',        label: 'ระบบลงทะเบียนและตารางเรียน' },
    { icon: 'bi-bar-chart-fill',   label: 'ติดตามเกรดและ GPA' },
    { icon: 'bi-journal-bookmark', label: 'ระบบห้องสมุด' },
    { icon: 'bi-shield-check',     label: 'ความปลอดภัยด้วย JWT' },
  ];

  get f() { return this.form.controls; }

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  onLogin() {
    this.submitted = true;
    this.errorMsg.set('');
    if (this.form.invalid) return;

    this.loading.set(true);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate([this.auth.getHomePath()]),
      error: (msg: string) => {
        this.errorMsg.set(msg || 'เข้าสู่ระบบไม่สำเร็จ');
        this.loading.set(false);
      }
    });
  }
}
