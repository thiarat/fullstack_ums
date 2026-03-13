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
      <!-- Left Panel -->
      <div class="left-panel">
        <div class="left-content">
          <div class="logo-wrap">
            <i class="bi bi-mortarboard-fill"></i>
          </div>
          <h2>University Management System</h2>
          <p>ระบบจัดการมหาวิทยาลัย ครบครัน สำหรับผู้บริหาร อาจารย์ และนักศึกษา</p>
          <div class="feature-list">
            <div class="feature-item"><i class="bi bi-check-circle-fill"></i> จัดการข้อมูลนักศึกษาและอาจารย์</div>
            <div class="feature-item"><i class="bi bi-check-circle-fill"></i> ระบบลงทะเบียนวิชาและตารางสอน</div>
            <div class="feature-item"><i class="bi bi-check-circle-fill"></i> บันทึกเกรดและผลการเรียน</div>
            <div class="feature-item"><i class="bi bi-check-circle-fill"></i> ระบบห้องสมุดออนไลน์</div>
          </div>
        </div>
      </div>

      <!-- Right Panel -->
      <div class="right-panel">
        <div class="form-card">
          <div class="form-header">
            <h3>เข้าสู่ระบบ</h3>
            <p>กรอกข้อมูลเพื่อเข้าใช้งานระบบ</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="onLogin()">
            <div class="form-group">
              <label>Username / รหัสนักศึกษา</label>
              <div class="input-wrap">
                <i class="bi bi-person"></i>
                <input type="text" formControlName="username" class="form-control"
                  [class.is-invalid]="submitted && f['username'].errors"
                  placeholder="กรอก username หรือ รหัสนักศึกษา"
                  autocomplete="username">
              </div>
              <div class="invalid-msg" *ngIf="submitted && f['username'].errors">กรุณาใส่ username</div>
            </div>

            <div class="form-group">
              <label>Password</label>
              <div class="input-wrap">
                <i class="bi bi-lock"></i>
                <input [type]="showPwd() ? 'text' : 'password'" formControlName="password" class="form-control"
                  [class.is-invalid]="submitted && f['password'].errors"
                  placeholder="••••••••"
                  autocomplete="current-password">
                <button type="button" class="eye-btn" (click)="showPwd.set(!showPwd())">
                  <i class="bi" [class.bi-eye]="!showPwd()" [class.bi-eye-slash]="showPwd()"></i>
                </button>
              </div>
              <div class="invalid-msg" *ngIf="submitted && f['password'].errors">กรุณาใส่ password</div>
            </div>

            <div class="error-alert" *ngIf="errorMsg()">
              <i class="bi bi-exclamation-circle me-2"></i>{{ errorMsg() }}
            </div>

            <button type="submit" class="btn-submit" [disabled]="loading()">
              <span class="spinner-border spinner-border-sm me-2" *ngIf="loading()"></span>
              <i class="bi bi-box-arrow-in-right me-2" *ngIf="!loading()"></i>
              {{ loading() ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }}
            </button>

            <div class="text-center mt-3">
              <button type="button" class="forgot-link" (click)="openForgot()">
                <i class="bi bi-key me-1"></i>ลืมรหัสผ่าน?
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Forgot Modal -->
    @if (forgotModal()) {
      <div class="modal-overlay" (click)="forgotModal.set(false)">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <h6 class="mb-1"><i class="bi bi-key me-2"></i>ขอรีเซ็ตรหัสผ่าน</h6>
          <p class="text-muted small mb-3">กรอก Username แล้วรอ Admin อนุมัติ</p>
          <input [(ngModel)]="forgotUsername" class="form-control mb-3" placeholder="กรอก username ของคุณ">
          @if (forgotMsg()) { <div class="alert alert-info py-2 small mb-3">{{ forgotMsg() }}</div> }
          <div class="d-flex gap-2">
            <button class="btn btn-secondary flex-1" (click)="forgotModal.set(false)">ยกเลิก</button>
            <button class="btn btn-primary flex-1" (click)="submitForgot()">ส่งคำขอ</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .login-page {
      min-height: 100vh; display: flex;
    }
    /* Left - blue gradient panel */
    .left-panel {
      flex: 1; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%);
      display: flex; align-items: center; justify-content: center;
      padding: 3rem; color: white;
    }
    .left-content { max-width: 400px; }
    .logo-wrap {
      width: 72px; height: 72px; border-radius: 1.25rem;
      background: rgba(255,255,255,.2); backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 1.5rem;
      i { font-size: 2rem; color: white; }
    }
    .left-content h2 { font-size: 1.6rem; font-weight: 800; margin-bottom: .75rem; line-height: 1.3; }
    .left-content p { opacity: .85; margin-bottom: 2rem; line-height: 1.6; }
    .feature-list { display: flex; flex-direction: column; gap: .75rem; }
    .feature-item { display: flex; align-items: center; gap: .6rem; font-size: .9rem; opacity: .9;
      i { color: #bfdbfe; font-size: .95rem; } }
    /* Right - white form panel */
    .right-panel {
      width: 480px; background: #f8fafc;
      display: flex; align-items: center; justify-content: center;
      padding: 2rem;
    }
    .form-card {
      background: white; border-radius: 1.25rem; padding: 2.5rem;
      width: 100%; max-width: 380px;
      box-shadow: 0 4px 24px rgba(0,0,0,.08);
    }
    .form-header { margin-bottom: 1.75rem; }
    .form-header h3 { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0 0 .35rem; }
    .form-header p { color: #64748b; font-size: .88rem; margin: 0; }
    .form-group { margin-bottom: 1.1rem; }
    .form-group label { font-size: .82rem; font-weight: 600; color: #475569; display: block; margin-bottom: .35rem; }
    .input-wrap { position: relative; }
    .input-wrap > i:first-child { position: absolute; left: .85rem; top: 50%; transform: translateY(-50%); color: #94a3b8; z-index: 1; pointer-events: none; }
    .input-wrap .form-control { padding-left: 2.5rem; height: 44px; border-radius: .6rem; border: 1.5px solid #e2e8f0; transition: border-color .2s; }
    .input-wrap .form-control:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.12); }
    .eye-btn { position: absolute; right: .75rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: #94a3b8; cursor: pointer; }
    .invalid-msg { color: #ef4444; font-size: .75rem; margin-top: .3rem; }
    .error-alert { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; border-radius: .5rem; padding: .6rem .85rem; font-size: .83rem; margin-bottom: 1rem; }
    .btn-submit {
      width: 100%; height: 46px; border-radius: .6rem; border: none;
      background: linear-gradient(135deg, #1e40af, #3b82f6);
      color: white; font-weight: 700; font-size: .95rem; cursor: pointer; transition: opacity .2s;
      display: flex; align-items: center; justify-content: center;
    }
    .btn-submit:disabled { opacity: .65; cursor: not-allowed; }
    .btn-submit:not(:disabled):hover { opacity: .9; }
    /* ลบ border ออกจากปุ่มลืมรหัส */
    .forgot-link { background: none; border: none; color: #3b82f6; font-size: .82rem; cursor: pointer; padding: .2rem .5rem; }
    .forgot-link:hover { text-decoration: underline; }
    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal-box { background: white; border-radius: 1rem; padding: 1.75rem; width: 100%; max-width: 360px; box-shadow: 0 20px 60px rgba(0,0,0,.2); }
    .flex-1 { flex: 1; }
    /* Responsive */
    @media (max-width: 768px) {
      .left-panel { display: none; }
      .right-panel { width: 100%; }
    }
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
    this.auth.login({
      username: this.form.value.username!,
      password: this.form.value.password!
    }).subscribe({
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
