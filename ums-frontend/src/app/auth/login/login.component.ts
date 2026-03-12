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
      <div class="left-panel">
        <div class="left-content stagger-item">
          <div class="logo-wrap">
            <i class="bi bi-mortarboard-fill"></i>
          </div>
          <h1 class="brand-title">University Management <span class="text-highlight">System</span></h1>
          <p class="brand-desc">นวัตกรรมการจัดการมหาวิทยาลัยยุคใหม่ ครบจบในที่เดียวสำหรับผู้บริหาร อาจารย์ และนักศึกษา</p>
          
          <div class="feature-grid">
            <div class="feature-card">
              <div class="feature-icon"><i class="bi bi-people-fill"></i></div>
              <span>Student & Faculty</span>
            </div>
            <div class="feature-card">
              <div class="feature-icon"><i class="bi bi-calendar-event"></i></div>
              <span>Academic Schedule</span>
            </div>
            <div class="feature-card">
              <div class="feature-icon"><i class="bi bi-journal-check"></i></div>
              <span>Digital Library</span>
            </div>
          </div>
        </div>
      </div>

      <div class="right-panel">
        <div class="login-container stagger-item">
          <div class="login-card shadow-lg">
            <div class="form-header">
              <h3>เข้าสู่ระบบ</h3>
              <p>กรุณาระบุตัวตนเพื่อเข้าถึงพื้นที่การทำงาน</p>
            </div>

            <form [formGroup]="form" (ngSubmit)="onLogin()" class="login-form">
              <div class="form-group mb-3">
                <label class="form-label-premium">Username / Student ID</label>
                <div class="input-modern-wrap">
                  <i class="bi bi-person-circle icon-lead"></i>
                  <input type="text" formControlName="username" class="form-control-premium"
                    [class.is-invalid]="submitted && f['username'].errors"
                    placeholder="รหัสนักศึกษา หรือ ชื่อผู้ใช้" autocomplete="username">
                </div>
                @if (submitted && f['username'].errors) {
                  <div class="invalid-hint">กรุณาระบุ Username</div>
                }
              </div>

              <div class="form-group mb-4">
                <label class="form-label-premium">Password</label>
                <div class="input-modern-wrap">
                  <i class="bi bi-shield-lock icon-lead"></i>
                  <input [type]="showPwd() ? 'text' : 'password'" formControlName="password" class="form-control-premium"
                    [class.is-invalid]="submitted && f['password'].errors"
                    placeholder="••••••••" autocomplete="current-password">
                  <button type="button" class="btn-toggle-eye" (click)="showPwd.set(!showPwd())">
                    <i class="bi" [class.bi-eye-fill]="!showPwd()" [class.bi-eye-slash-fill]="showPwd()"></i>
                  </button>
                </div>
                @if (submitted && f['password'].errors) {
                  <div class="invalid-hint">กรุณาระบุ Password</div>
                }
              </div>

              @if (errorMsg()) {
                <div class="alert-error-premium">
                  <i class="bi bi-exclamation-octagon-fill me-2"></i>{{ errorMsg() }}
                </div>
              }

              <button type="submit" class="btn-login-premium" [disabled]="loading()">
                @if (loading()) {
                  <span class="spinner-border spinner-border-sm me-2"></span> กำลังเข้าสู่ระบบ...
                } @else {
                  <span>เข้าสู่ระบบ</span>
                  <i class="bi bi-arrow-right-short ms-2 fs-4"></i>
                }
              </button>

              <div class="text-center mt-4">
                <button type="button" class="btn-forgot-link" (click)="openForgot()">
                  ลืมรหัสผ่าน? ติดต่อเจ้าหน้าที่
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    @if (forgotModal()) {
      <div class="modal-overlay" (click)="forgotModal.set(false)">
        <div class="modal-premium-box animate-modal-pop" (click)="$event.stopPropagation()">
          <div class="modal-icon-wrap">
            <i class="bi bi-key-fill"></i>
          </div>
          <h4 class="fw-bold text-dark mb-1">ส่งคำขอรีเซ็ตรหัสผ่าน</h4>
          <p class="text-muted small mb-4">ระบุ Username ของคุณเพื่อให้ผู้ดูแลระบบตรวจสอบ</p>
          
          <div class="input-modern-wrap mb-4">
            <i class="bi bi-person-fill icon-lead"></i>
            <input [(ngModel)]="forgotUsername" class="form-control-premium" placeholder="Username ของคุณ">
          </div>

          @if (forgotMsg()) { 
            <div class="alert alert-info border-0 py-2 small mb-4">
              <i class="bi bi-info-circle-fill me-2"></i>{{ forgotMsg() }}
            </div> 
          }

          <div class="row g-2">
            <div class="col-6">
              <button class="btn btn-light-premium w-100" (click)="forgotModal.set(false)">ยกเลิก</button>
            </div>
            <div class="col-6">
              <button class="btn btn-primary-premium w-100" (click)="submitForgot()">ส่งคำขอ</button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');

    .login-page {
      min-height: 100vh;
      display: flex;
      font-family: 'Prompt', sans-serif;
      background-color: #0f172a; /* Slate 900 */
      overflow: hidden;
    }

    /* 🌓 Panels */
    .left-panel {
      flex: 1.2; display: flex; align-items: center; justify-content: center;
      padding: 4rem; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
    }
    .right-panel {
      flex: 1; display: flex; align-items: center; justify-content: center;
      padding: 2rem; background: #f8fafc;
    }

    /* 🎓 Branding Content */
    .left-content { max-width: 520px; }
    .logo-wrap {
      width: 64px; height: 64px; border-radius: 16px;
      background: #3b82f6; display: flex; align-items: center; justify-content: center;
      font-size: 2rem; color: white; margin-bottom: 2rem;
      box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
    }
    .brand-title { color: white; font-weight: 700; font-size: 2.5rem; line-height: 1.1; margin-bottom: 1.5rem; }
    .text-highlight { color: #60a5fa; }
    .brand-desc { color: #94a3b8; font-size: 1.1rem; line-height: 1.6; margin-bottom: 3rem; font-weight: 300; }

    .feature-grid { display: flex; flex-direction: column; gap: 1rem; }
    .feature-card {
      display: flex; align-items: center; gap: 1rem; padding: 1rem 1.5rem;
      background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px; color: #cbd5e1;
    }
    .feature-icon { color: #3b82f6; font-size: 1.25rem; }

    /* 🛡️ Login Card */
    .login-container { width: 100%; max-width: 440px; }
    .login-card {
      background: #ffffff; padding: 3rem; border-radius: 24px;
      border: 1px solid #e2e8f0;
      will-change: transform, opacity;
    }

    .form-header { text-align: center; margin-bottom: 2.5rem; }
    .form-header h3 { font-weight: 700; color: #0f172a; font-size: 1.75rem; margin-bottom: 0.5rem; }
    .form-header p { color: #64748b; font-size: 0.95rem; }

    /* 💎 Modern Controls (ถอด Easing Variable ออกเพื่อความลื่น) */
    .form-label-premium { font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 0.5rem; display: block; }
    .input-modern-wrap { position: relative; }
    .icon-lead { position: absolute; left: 1.25rem; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 1.1rem; pointer-events: none; }
    
    .form-control-premium {
      width: 100%; height: 52px; padding: 0 3.2rem; border-radius: 12px;
      background: #f8fafc; border: 1px solid #e2e8f0; font-size: 1rem;
      transition: border-color 0.2s ease, background-color 0.2s ease;
    }
    .form-control-premium:focus {
      background: white; border-color: #3b82f6; outline: none;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }
    .btn-toggle-eye {
      position: absolute; right: 1rem; top: 50%; transform: translateY(-50%);
      background: none; border: none; color: #94a3b8; padding: 0.5rem; cursor: pointer;
    }

    /* 🚀 Login Button (ลบเอฟเฟกต์ 3D ที่กระตุกออก) */
    .btn-login-premium {
      width: 100%; height: 52px; margin-top: 1rem; border-radius: 12px; border: none;
      background: #2563eb; color: white; font-weight: 700; font-size: 1rem;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s ease, transform 0.1s ease;
      cursor: pointer;
    }
    .btn-login-premium:hover:not(:disabled) { background: #1d4ed8; }
    .btn-login-premium:active:not(:disabled) { transform: scale(0.98); }
    .btn-login-premium:disabled { background: #cbd5e1; cursor: not-allowed; }

    .btn-forgot-link {
      background: none; border: none; color: #64748b; font-size: 0.9rem; font-weight: 500;
      transition: color 0.2s; cursor: pointer;
    }
    .btn-forgot-link:hover { color: #3b82f6; }

    .alert-error-premium {
      background: #fef2f2; color: #b91c1c; padding: 0.8rem 1rem; border-radius: 10px;
      font-size: 0.85rem; margin-bottom: 1.5rem; border: 1px solid #fee2e2;
    }

    .invalid-hint { color: #ef4444; font-size: 0.75rem; margin-top: 0.4rem; font-weight: 500; }

    /* 💎 Modal Styling (ถอด Blur ออกเพื่อความลื่น) */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7);
      z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 2rem;
    }
    .modal-premium-box {
      background: white; width: 100%; max-width: 400px; padding: 2.5rem;
      border-radius: 20px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    }
    .modal-icon-wrap {
      width: 54px; height: 54px; border-radius: 50%; margin: 0 auto 1.5rem;
      background: #fffbeb; color: #f59e0b;
      display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
    }
    .btn-light-premium { height: 46px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; font-weight: 600; color: #475569; }
    .btn-primary-premium { height: 46px; border-radius: 10px; background: #2563eb; color: white; border: none; font-weight: 600; }

    /* 🎬 Smooth Animations */
    @keyframes fadeInSlide { 
      from { opacity: 0; transform: translateY(10px); } 
      to { opacity: 1; transform: translateY(0); } 
    }
    .stagger-item { animation: fadeInSlide 0.4s ease-out forwards; }
    
    @keyframes modalPop { 
      from { opacity: 0; transform: scale(0.95); } 
      to { opacity: 1; transform: scale(1); } 
    }
    .animate-modal-pop { animation: modalPop 0.25s ease-out forwards; }

    @media (max-width: 991px) {
      .left-panel { display: none; }
      .login-card { padding: 2.5rem 2rem; }
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
    
    this.loading.set(true); 
    this.errorMsg.set('');
    
    this.auth.login({
      username: this.form.value.username!,
      password: this.form.value.password!
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate([this.auth.getHomePath()]);
      },
      error: (e) => {
        this.loading.set(false);
        this.errorMsg.set(e.error?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    });
  }

  openForgot() { 
    this.forgotModal.set(true); 
    this.forgotMsg.set(''); 
    this.forgotUsername = ''; 
  }

  submitForgot() {
    if (!this.forgotUsername) return;
    this.http.post(environment.apiUrl + '/auth/forgot-password', { username: this.forgotUsername })
      .subscribe({
        next: (r: any) => this.forgotMsg.set(r.message || 'ส่งคำขอเรียบร้อย รอ Admin อนุมัติ'),
        error: () => this.forgotMsg.set('เกิดข้อผิดพลาด กรุณาลองใหม่'),
      });
  }
}