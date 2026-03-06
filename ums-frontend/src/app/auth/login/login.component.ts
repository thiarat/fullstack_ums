import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="brand">
          <div class="brand-icon"><i class="bi bi-mortarboard-fill"></i></div>
          <h1 class="brand-name">UMS</h1>
          <p class="brand-sub">University Management System</p>
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
                placeholder="กรอก username หรือ รหัสนักศึกษา"
                autocomplete="username">
            </div>
            <div class="invalid-msg" *ngIf="submitted && f['username'].errors">กรุณาใส่ username</div>
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
            <div class="invalid-msg" *ngIf="submitted && f['password'].errors">กรุณาใส่ password</div>
          </div>

          <div class="error-msg" *ngIf="errorMsg()">
            <i class="bi bi-exclamation-circle"></i> {{ errorMsg() }}
          </div>

          <button type="submit" class="btn-login" [disabled]="loading()">
            <span class="spinner-border spinner-border-sm me-2" *ngIf="loading()"></span>
            <i class="bi bi-box-arrow-in-right me-2" *ngIf="!loading()"></i>
            {{ loading() ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }}
          </button>

          <div class="text-center mt-3">
            <button type="button" class="forgot-btn" (click)="openForgot()">
              <i class="bi bi-key"></i> ลืมรหัสผ่าน?
            </button>
          </div>
        </form>
      </div>

      <!-- Forgot Password Modal -->
      @if (forgotModal()) {
        <div class="forgot-overlay" (click)="forgotModal.set(false)">
          <div class="forgot-box" (click)="$event.stopPropagation()">
            <h6 class="mb-3"><i class="bi bi-key me-2"></i>ขอรีเซ็ตรหัสผ่าน</h6>
            <p class="text-muted small mb-3">กรอก Username แล้วแจ้ง Admin ให้อนุมัติ</p>
            <input [(ngModel)]="forgotUsername" class="form-control mb-3" placeholder="กรอก username ของคุณ">
            @if (forgotMsg()) { <div class="alert alert-info py-2 small mb-3">{{ forgotMsg() }}</div> }
            <div class="d-flex gap-2">
              <button class="btn btn-secondary flex-1" (click)="forgotModal.set(false)">ยกเลิก</button>
              <button class="btn btn-primary flex-1" (click)="submitForgot()">ส่งคำขอ</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    }
    .login-card {
      background: white; border-radius: 1.25rem; padding: 2.5rem 2rem;
      width: 100%; max-width: 420px; box-shadow: 0 20px 60px rgba(0,0,0,.18);
    }
    .brand { text-align: center; margin-bottom: 2rem; }
    .brand-icon {
      width: 64px; height: 64px; border-radius: 1rem; margin: 0 auto 1rem;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex; align-items: center; justify-content: center;
    }
    .brand-icon i { font-size: 1.8rem; color: white; }
    .brand-name { font-size: 1.75rem; font-weight: 800; color: #1a202c; margin: 0; letter-spacing: -.02em; }
    .brand-sub { color: #718096; font-size: .85rem; margin: .25rem 0 0; }
    .form-group { margin-bottom: 1.25rem; }
    .form-group label { font-size: .82rem; font-weight: 600; color: #4a5568; margin-bottom: .35rem; display: block; }
    .input-wrapper { position: relative; }
    .input-wrapper > i { position: absolute; left: .85rem; top: 50%; transform: translateY(-50%); color: #a0aec0; z-index: 1; }
    .input-wrapper .form-control { padding-left: 2.5rem; border-radius: .6rem; border: 1.5px solid #e2e8f0; height: 44px; transition: border-color .2s; }
    .input-wrapper .form-control:focus { border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,.15); }
    .toggle-pwd { position: absolute; right: .75rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: #a0aec0; cursor: pointer; padding: .25rem; }
    .invalid-msg { color: #e53e3e; font-size: .75rem; margin-top: .25rem; }
    .error-msg { background: #fff5f5; border: 1px solid #fed7d7; color: #c53030; border-radius: .5rem; padding: .6rem .85rem; font-size: .82rem; margin-bottom: 1rem; }
    .btn-login {
      width: 100%; height: 46px; border-radius: .6rem; border: none;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white; font-weight: 700; font-size: .95rem; cursor: pointer; transition: opacity .2s;
    }
    .btn-login:disabled { opacity: .7; cursor: not-allowed; }
    .btn-login:not(:disabled):hover { opacity: .9; }
    /* ลบ border ออกจากปุ่มลืมรหัส */
    .forgot-btn {
      background: none; border: none; color: #667eea;
      font-size: .82rem; cursor: pointer; padding: .25rem .5rem;
      text-decoration: none; transition: color .2s;
    }
    .forgot-btn:hover { color: #764ba2; text-decoration: underline; }
    /* Forgot Modal */
    .forgot-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 9999;
      display: flex; align-items: center; justify-content: center; padding: 1rem;
    }
    .forgot-box {
      background: white; border-radius: 1rem; padding: 1.75rem; width: 100%; max-width: 360px;
      box-shadow: 0 20px 60px rgba(0,0,0,.2);
    }
    .flex-1 { flex: 1; }
  `]
})
export class LoginComponent {
  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });
  submitted = false;
  loading   = signal(false);
  errorMsg  = signal('');
  showPwd   = signal(false);
  forgotModal    = signal(false);
  forgotUsername = '';
  forgotMsg      = signal('');

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  get f() { return this.form.controls; }

  onLogin() {
    this.submitted = true;
    if (this.form.invalid) return;
    this.loading.set(true); this.errorMsg.set('');
    this.auth.login({ username: this.form.value.username!, password: this.form.value.password! }).subscribe({
      next: () => this.router.navigate([this.auth.getHomePath()]),
      error: (e) => { this.loading.set(false); this.errorMsg.set(e.error?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'); }
    });
  }

  openForgot() { this.forgotModal.set(true); this.forgotMsg.set(''); this.forgotUsername = ''; }

  submitForgot() {
    if (!this.forgotUsername) return;
    this.http.post(environment.apiUrl + '/auth/forgot-password', { username: this.forgotUsername })
      .subscribe({
        next: (r: any) => this.forgotMsg.set(r.message || 'ส่งคำขอเรียบร้อย รอ Admin อนุมัติ'),
        error: () => this.forgotMsg.set('เกิดข้อผิดพลาด กรุณาลองใหม่'),
      });
  }
}
