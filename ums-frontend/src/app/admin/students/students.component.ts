import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-students',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="main-content">
        <app-topbar title="จัดการนักศึกษา" subtitle="รายชื่อและข้อมูลนักศึกษาทั้งหมดในระบบ" />
        
        <div class="page-content">

          @if (resetRequests().length > 0) {
            <div class="alert-premium stagger-item mb-4 mt-2" (click)="showResetPanel = !showResetPanel">
              <div class="alert-icon-wrap bg-warning-soft text-warning">
                <i class="bi bi-bell-fill"></i>
              </div>
              <div class="flex-grow-1">
                <h6 class="mb-0 fw-bold text-dark">มีคำขอรีเซ็ตรหัสผ่านใหม่</h6>
                <div class="text-muted small">รอดำเนินการ {{ resetRequests().length }} รายการ</div>
              </div>
              <div class="d-flex align-items-center gap-3">
                <span class="badge bg-danger rounded-pill px-2 py-1 shadow-sm">{{ resetRequests().length }}</span>
                <i class="bi text-muted" [class.bi-chevron-down]="!showResetPanel" [class.bi-chevron-up]="showResetPanel"></i>
              </div>
            </div>

            @if (showResetPanel) {
              <div class="card premium-card mb-4 fade-in shadow-warning">
                <div class="table-responsive">
                  <table class="table custom-table mb-0">
                    <thead class="bg-warning-soft">
                      <tr>
                        <th class="text-dark">ชื่อ-นามสกุล</th>
                        <th class="text-dark">Username</th>
                        <th class="text-dark">ระดับสิทธิ์</th>
                        <th class="text-dark">เวลาส่งคำขอ</th>
                        <th class="text-end text-dark">ดำเนินการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (r of resetRequests(); track r.request_id) {
                        <tr class="align-middle">
                          <td class="fw-bold text-dark">{{ r.first_name }} {{ r.last_name }}</td>
                          <td><code class="code-badge">{{ r.username }}</code></td>
                          <td>
                            <span class="badge-soft" [class]="r.role_name === 'Student' ? 'bg-info-soft text-info' : 'bg-primary-soft text-primary'">
                              {{ r.role_name }}
                            </span>
                          </td>
                          <td class="text-muted small">{{ r.created_at | date:'dd MMM, HH:mm' }}</td>
                          <td class="text-end">
                            <div class="d-flex gap-2 justify-content-end align-items-center">
                              <input type="password" [(ngModel)]="r._newPassword" placeholder="รหัสใหม่" class="form-control form-control-sm modern-sm-input" style="width:120px">
                              <button class="btn btn-sm btn-success-solid" (click)="approveReset(r)" [disabled]="!r._newPassword" title="อนุมัติ">
                                <i class="bi bi-check-lg"></i>
                              </button>
                              <button class="btn btn-sm btn-danger-soft" (click)="rejectReset(r)" title="ปฏิเสธ">
                                <i class="bi bi-x-lg"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
          }

          <div class="row align-items-center mb-4 pt-3 mt-2 stagger-item">
            <div class="col-md-5 col-12 mb-3 mb-md-0">
              <div class="input-modern-group">
                <i class="bi bi-search text-muted"></i>
                <input type="text" class="form-control" [(ngModel)]="searchQuery" (ngModelChange)="onSearch()" placeholder="ค้นหารหัส, ชื่อ หรืออีเมล...">
              </div>
            </div>
            <div class="col-md-7 col-12 text-md-end">
              <button class="btn btn-add-premium shadow-sm" (click)="openCreateModal()">
                <div class="icon-circle"><i class="bi bi-person-plus-fill"></i></div>
                <span class="fw-bold">เพิ่มนักศึกษาใหม่</span>
              </button>
            </div>
          </div>

          @if (loading()) {
            <div class="loading-state fade-in">
              <div class="spinner-border text-primary" role="status"></div>
              <div class="mt-3 text-muted fw-medium">กำลังค้นหาข้อมูลนักศึกษา...</div>
            </div>
          } @else {
            <div class="card premium-card stagger-item" style="animation-delay: 0.1s;">
              <div class="table-responsive">
                <table class="table custom-table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>ข้อมูลนักศึกษา</th>
                      <th>บัญชี (Account)</th>
                      <th>วันที่ลงทะเบียน</th>
                      <th class="text-center">สถานะ</th>
                      <th class="text-end">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (s of students(); track s.student_id) {
                      <tr class="clickable-row align-middle" (click)="viewSchedule(s)" title="คลิกดูตารางเรียน">
                        <td>
                          <div class="d-flex align-items-center gap-3">
                            <div class="avatar-gradient">{{ s.first_name?.[0] || 'S' }}</div>
                            <div class="fw-bold text-dark">{{ s.first_name }} {{ s.last_name }}</div>
                          </div>
                        </td>
                        <td>
                          <code class="code-badge mb-1 d-inline-block">{{ s.username }}</code>
                          <div class="text-muted small"><i class="bi bi-envelope me-1"></i>{{ s.email || '-' }}</div>
                        </td>
                        <td class="text-muted small">{{ s.enrollment_date | date:'dd MMM yyyy' }}</td>
                        <td class="text-center">
                          <span class="badge-soft" [class]="s.is_active ? 'success' : 'secondary'">
                            <span class="status-dot" [class.bg-success]="s.is_active" [class.bg-secondary]="!s.is_active"></span>
                            {{ s.is_active ? 'ใช้งานอยู่' : 'ระงับการใช้' }}
                          </span>
                        </td>
                        <td class="text-end" (click)="$event.stopPropagation()">
                          <div class="d-flex gap-2 justify-content-end">
                            <button class="action-btn text-primary-hover" (click)="openEditModal(s)" title="แก้ไข"><i class="bi bi-pencil-fill"></i></button>
                            <button class="action-btn text-warning-hover" (click)="openResetPasswordModal(s)" title="รีเซ็ตรหัส"><i class="bi bi-key-fill"></i></button>
                            <button class="action-btn" [class]="s.is_active ? 'text-secondary-hover' : 'text-success-hover'" (click)="toggleStatus(s)" title="สลับสถานะ">
                              <i class="bi" [class]="s.is_active ? 'bi-toggle-on text-primary' : 'bi-toggle-off'"></i>
                            </button>
                            <button class="action-btn text-danger-hover" (click)="confirmDelete(s)" title="ลบ"><i class="bi bi-trash-fill"></i></button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
              @if (!students().length) {
                <div class="empty-state-box border-0">
                  <div class="empty-icon-wrap mb-3 mx-auto"><i class="bi bi-person-x"></i></div>
                  <p class="text-muted small">ไม่พบข้อมูลนักศึกษาในระบบ</p>
                </div>
              }
            </div>

            @if (students().length > 0) {
              <div class="d-flex justify-content-between align-items-center mt-4 fade-in">
                <span class="text-muted small">แสดง {{ students().length }} จากทั้งหมด {{ total() }} รายการ</span>
                <div class="pagination-modern">
                  <button class="btn-page nav-btn" [disabled]="currentPage() === 1" (click)="goPage(currentPage()-1)">‹</button>
                  @for (p of pages(); track p) {
                    <button class="btn-page" [class.active]="p === currentPage()" (click)="goPage(p)">{{ p }}</button>
                  }
                  <button class="btn-page nav-btn" [disabled]="currentPage() === totalPages()" (click)="goPage(currentPage()+1)">›</button>
                </div>
              </div>
            }
          }
        </div>
      </div>
    </div>

    @if (scheduleModal()) {
      <div class="modal-backdrop show fade-in" (click)="scheduleModal.set(null)"></div>
      <div class="modal show d-block fade-in">
        <div class="modal-dialog modal-dialog-centered modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-content ultra-clean-modal animate-modal-pop">
            <div class="modal-header border-0 pb-0 pt-4 px-4">
              <div class="d-flex align-items-center gap-3">
                <div class="modal-icon-box bg-primary-soft text-primary"><i class="bi bi-calendar3"></i></div>
                <div>
                  <h5 class="modal-title fw-bold text-dark mb-0">ตารางเรียน</h5>
                  <p class="text-muted small mb-0 mt-1">{{ scheduleModal()!.first_name }} {{ scheduleModal()!.last_name }} ({{ scheduleModal()!.username }})</p>
                </div>
              </div>
              <button class="btn-close-round" (click)="scheduleModal.set(null)"><i class="bi bi-x-lg"></i></button>
            </div>
            <div class="modal-body p-4">
              @if (scheduleLoading()) {
                <div class="text-center p-5"><div class="spinner-border text-primary"></div></div>
              } @else if (scheduleData().length === 0) {
                <div class="text-center py-4 text-muted"><i class="bi bi-calendar-x fs-1 d-block mb-2"></i>ไม่มีตารางเรียนในภาคการศึกษานี้</div>
              } @else {
                <div class="table-responsive border rounded-4">
                  <table class="table custom-table mb-0">
                    <thead class="bg-light">
                      <tr><th>วิชา</th><th>วัน</th><th>เวลา</th><th>ห้อง</th><th>อาจารย์</th></tr>
                    </thead>
                    <tbody>
                      @for (sc of scheduleData(); track sc.schedule_id) {
                        <tr class="align-middle">
                          <td><code class="code-badge">{{ sc.course_code }}</code><div class="small fw-bold text-dark mt-1">{{ sc.course_title }}</div></td>
                          <td><span class="badge-soft bg-primary-soft text-primary">{{ sc.day_of_week }}</span></td>
                          <td class="small">{{ sc.start_time | slice:0:5 }}–{{ sc.end_time | slice:0:5 }}</td>
                          <td><span class="fw-medium">{{ sc.room_number }}</span></td>
                          <td class="text-muted small">{{ sc.professor_name }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    }

    @if (userModal()) {
      <div class="modal-backdrop show fade-in" (click)="userModal.set(null)"></div>
      <div class="modal show d-block fade-in">
        <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
          <div class="modal-content ultra-clean-modal animate-modal-pop">
            <div class="modal-header border-0 pb-0 pt-4 px-4">
              <div class="d-flex align-items-center gap-3">
                <div class="modal-icon-box" [class]="editingUser()?.user_id ? 'bg-warning-soft text-warning' : 'bg-primary-soft text-primary'">
                  <i class="bi" [class]="editingUser()?.user_id ? 'bi-person-gear' : 'bi-person-plus'"></i>
                </div>
                <h5 class="modal-title fw-bold text-dark mb-0">{{ editingUser()?.user_id ? 'แก้ไขข้อมูลนักศึกษา' : 'เพิ่มนักศึกษาใหม่' }}</h5>
              </div>
              <button class="btn-close-round" (click)="userModal.set(null)"><i class="bi bi-x-lg"></i></button>
            </div>
            <div class="modal-body p-4">
              @if (!editingUser()?.user_id) {
                <div class="mb-3">
                  <label class="form-label fw-bold small text-muted">รหัสนักศึกษา (Username) *</label>
                  <div class="input-modern-group">
                    <i class="bi bi-person-badge text-muted"></i>
                    <input class="form-control" [(ngModel)]="form.username" placeholder="เช่น 1166xxxxxxxx">
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label fw-bold small text-muted">รหัสผ่าน *</label>
                  <div class="input-modern-group">
                    <i class="bi bi-lock text-muted"></i>
                    <input type="password" class="form-control" [(ngModel)]="form.password" placeholder="กำหนดรหัสผ่าน">
                  </div>
                </div>
              }
              <div class="row g-2 mb-3">
                <div class="col"><label class="form-label fw-bold small text-muted">ชื่อ *</label><input class="form-control modern-input" [(ngModel)]="form.first_name"></div>
                <div class="col"><label class="form-label fw-bold small text-muted">นามสกุล *</label><input class="form-control modern-input" [(ngModel)]="form.last_name"></div>
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold small text-muted">อีเมล *</label>
                <div class="input-modern-group">
                  <i class="bi bi-envelope text-muted"></i>
                  <input type="email" class="form-control" [(ngModel)]="form.email" placeholder="example@university.ac.th">
                </div>
              </div>
              @if (formError()) { <div class="alert alert-danger border-0 small py-2 fade-in"><i class="bi bi-exclamation-circle me-2"></i>{{ formError() }}</div> }
            </div>
            <div class="modal-footer border-0 p-4 pt-0 gap-2 flex-nowrap">
              <button class="btn btn-light btn-cancel flex-grow-1" (click)="userModal.set(null)">ยกเลิก</button>
              <button class="btn btn-submit-solid flex-grow-1" (click)="saveUser()" [disabled]="saving()">
                <span class="spinner-border spinner-border-sm me-2" *ngIf="saving()"></span>
                {{ editingUser()?.user_id ? 'บันทึก' : 'เพิ่มนักศึกษา' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    @if (resetModal()) {
      <div class="modal-backdrop show fade-in" (click)="resetModal.set(null)"></div>
      <div class="modal show d-block fade-in">
        <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
          <div class="modal-content ultra-clean-modal animate-modal-pop">
            <div class="modal-header border-0 pb-0 pt-4 px-4">
              <div class="d-flex align-items-center gap-3">
                <div class="modal-icon-box bg-warning-soft text-warning"><i class="bi bi-shield-lock"></i></div>
                <div>
                  <h5 class="modal-title fw-bold text-dark mb-0">รีเซ็ตรหัสผ่าน</h5>
                  <p class="text-muted small mb-0 mt-1">อ. {{ resetModal()!.first_name }} {{ resetModal()!.last_name }}</p>
                </div>
              </div>
              <button class="btn-close-round" (click)="resetModal.set(null)"><i class="bi bi-x-lg"></i></button>
            </div>
            <div class="modal-body p-4">
              <div class="mb-2">
                <label class="form-label fw-bold small text-muted">กำหนดรหัสผ่านใหม่ *</label>
                <div class="input-modern-group">
                  <i class="bi bi-key text-muted"></i>
                  <input type="password" class="form-control" [(ngModel)]="newPassword" placeholder="อย่างน้อย 6 ตัวอักษร">
                </div>
              </div>
              @if (formError()) { <div class="alert alert-danger border-0 small py-2 fade-in"><i class="bi bi-exclamation-circle me-2"></i>{{ formError() }}</div> }
            </div>
            <div class="modal-footer border-0 p-4 pt-0 gap-2 flex-nowrap">
              <button class="btn btn-light btn-cancel flex-grow-1" (click)="resetModal.set(null)">ยกเลิก</button>
              <button class="btn btn-warning btn-submit-solid text-dark flex-grow-1" (click)="doResetPassword()" [disabled]="saving()">ยืนยันรีเซ็ต</button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');

    .page-content {
      padding: 4rem 2rem 2rem 2rem;
      font-family: 'Prompt', sans-serif;
      background-color: #f4f7f9;
      min-height: calc(100vh - 70px);
      position: relative;
      z-index: 1;
    }

    /* 💎 Premium Add Button */
    .btn-add-premium {
      height: 48px; 
      padding: 0.4rem 1.4rem 0.4rem 0.5rem; 
      border-radius: 50px; 
      font-weight: 600; font-size: 0.95rem;
      border: none; background: linear-gradient(135deg, #2563eb, #3b82f6); 
      color: white; display: inline-flex; align-items: center; gap: 0.75rem;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      white-space: nowrap !important; min-width: 170px;
      box-shadow: 0 4px 12px rgba(37,99,235,0.25);
    }
    .btn-add-premium .icon-circle {
      width: 34px; height: 34px; border-radius: 50%; margin-right: 0.6rem;
      background: rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem;
    }
    .btn-add-premium:hover:not(:disabled) { 
      transform: translateY(-2px); box-shadow: 0 8px 20px rgba(37,99,235,0.4);
    }

    /* Alert & Cards */
    .alert-premium {
      background: #ffffff; border-left: 4px solid #f59e0b;
      border-radius: 12px; padding: 1rem 1.25rem; display: flex; align-items: center; gap: 1rem;
      cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.05); transition: 0.2s;
    }
    .alert-premium:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
    .alert-icon-wrap { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }

    .premium-card {
      background: #ffffff; border-radius: 20px; border: 1px solid rgba(226, 232, 240, 0.8);
      box-shadow: 0 4px 15px rgba(0,0,0,0.02); overflow: hidden;
    }
    .shadow-warning { border-color: #fef08a; box-shadow: 0 10px 20px rgba(245,158,11,0.05); }

    /* Inputs */
    .input-modern-group { position: relative; }
    .input-modern-group > i { position: absolute; left: 1.2rem; top: 50%; transform: translateY(-50%); font-size: 1.1rem; pointer-events: none; transition: 0.3s; color: #94a3b8; }
    .input-modern-group .form-control { 
      padding-left: 3rem; height: 48px; border-radius: 12px; background-color: #ffffff; 
      border: 1px solid #cbd5e1; font-size: 0.95rem; color: #1e293b; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }
    .input-modern-group .form-control:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59,130,246,0.1); outline: none;}
    .input-modern-group .form-control:focus ~ i { color: #3b82f6; }
    .modern-input { height: 48px; border-radius: 12px; border: 1px solid #cbd5e1; }

    /* Tables & UI */
    .custom-table th { 
      font-weight: 600; color: #475569; font-size: 0.85rem; border-bottom: 2px solid #e2e8f0; 
      padding: 1.2rem 1.5rem; background: #f8fafc; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .custom-table td { padding: 1rem 1.5rem; vertical-align: middle; border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease-out; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover td { background-color: #f8fafc; }

    .avatar-gradient { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.1rem; }
    .code-badge { background: #f1f5f9; color: #475569; padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.85rem; border: 1px solid #e2e8f0; }
    .badge-soft { padding: 0.35rem 0.7rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;}
    .badge-soft.success { background: #ecfdf5; color: #10b981; }
    .badge-soft.secondary { background: #f1f5f9; color: #64748b; }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; }

    /* Buttons */
    .action-btn { width: 34px; height: 34px; border-radius: 8px; border: none; display: inline-flex; align-items: center; justify-content: center; background: transparent; color: #94a3b8; transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1); }
    .action-btn:hover { background: #f1f5f9; transform: scale(1.1); }
    .action-btn.text-primary-hover:hover { background: #eff6ff; color: #2563eb; }
    .action-btn.text-warning-hover:hover { background: #fffbeb; color: #d97706; }
    .action-btn.text-success-hover:hover { background: #ecfdf5; color: #10b981; }
    .action-btn.text-danger-hover:hover { background: #fef2f2; color: #ef4444; }

    .btn-success-solid { background: #10b981; color: white; border: none; border-radius: 8px; width: 32px; height: 32px; transition: 0.2s; }
    .btn-danger-soft { background: #fee2e2; color: #ef4444; border: none; border-radius: 8px; width: 32px; height: 32px; transition: 0.2s; }
    .btn-success-solid:hover { background: #059669; }

    .pagination-modern { display: flex; gap: 4px; background: #fff; padding: 4px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .btn-page { border: none; background: transparent; width: 32px; height: 32px; border-radius: 8px; color: #475569; font-weight: 500; display: flex; align-items: center; justify-content: center; transition: 0.2s; font-size: 0.9rem; }
    .btn-page:hover:not(:disabled) { background: #f1f5f9; }
    .btn-page.active { background: #3b82f6; color: white; }

    /* Modals */
    .modal-backdrop { background: rgba(15, 23, 42, 0.6); } 
    .ultra-clean-modal { background: #ffffff; border-radius: 24px; border: none; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3); }
    .modal-icon-box { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; }
    .btn-close-round { background: #f1f5f9; border: none; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #64748b; transition: 0.2s; }
    .btn-close-round:hover { background: #e2e8f0; color: #0f172a; transform: rotate(90deg); }
    .btn-cancel { height: 48px; border-radius: 12px; font-weight: 500; background: #f1f5f9; color: #475569; border: none; }
    .btn-submit-solid { height: 48px; border-radius: 12px; font-weight: 600; background: #2563eb; color: white; border: none; transition: 0.2s; }
    .btn-submit-solid:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-1px); }

    .bg-primary-soft { background: #eff6ff; }
    .bg-info-soft { background: #e0f2fe; }
    .bg-warning-soft { background: #fffbeb; }

    @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
    .stagger-item { animation: fadeSlideUp 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; opacity: 0; will-change: transform, opacity; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .fade-in { animation: fadeIn 0.3s ease-in forwards; }
    @keyframes modalPop { 0% { opacity: 0; transform: scale(0.95) translateY(10px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
    .animate-modal-pop { animation: modalPop 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; }
    .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5rem 0; }
  `]
})
export class AdminStudentsComponent implements OnInit {
  private api = inject(AdminApiService);

  students    = signal<any[]>([]);
  loading     = signal(true);
  total       = signal(0);
  currentPage = signal(1);
  searchQuery = '';
  private searchTimer: any;

  scheduleModal   = signal<any>(null);
  scheduleData    = signal<any[]>([]);
  scheduleLoading = signal(false);

  userModal    = signal<any>(null);
  editingUser  = signal<any>(null);
  resetModal   = signal<any>(null);
  formError    = signal('');
  saving       = signal(false);
  newPassword  = '';
  showResetPanel = false;
  resetRequests  = signal<any[]>([]);
  form: any = {};

  totalPages = computed(() => Math.ceil(this.total() / 20));
  pages      = computed(() => {
    const t = this.totalPages();
    const current = this.currentPage();
    let start = Math.max(1, current - 2);
    let end = Math.min(t, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    return Array.from({ length: (end - start) + 1 }, (_, i) => start + i);
  });

  ngOnInit() { this.loadStudents(); this.loadResetRequests(); }

  loadStudents() {
    this.loading.set(true);
    this.api.getStudents({ page: this.currentPage(), limit: 20, search: this.searchQuery }).subscribe({
      next: (r: any) => { this.students.set(r.data.data); this.total.set(r.data.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  loadResetRequests() {
    this.api.getPasswordResetRequests().subscribe({ next: (r: any) => this.resetRequests.set(r.data), error: () => {} });
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.currentPage.set(1); this.loadStudents(); }, 400);
  }

  goPage(p: number) { this.currentPage.set(p); this.loadStudents(); }

  viewSchedule(s: any) {
    this.scheduleModal.set(s); this.scheduleData.set([]); this.scheduleLoading.set(true);
    this.api.getStudentSchedule(s.student_id).subscribe({
      next: (r: any) => { this.scheduleData.set(r.data); this.scheduleLoading.set(false); },
      error: () => this.scheduleLoading.set(false),
    });
  }

  openCreateModal() {
    this.editingUser.set({});
    this.form = { role_name: 'Student' };
    this.formError.set('');
    this.userModal.set(true);
  }
  openEditModal(s: any) {
    this.editingUser.set(s);
    this.form = { first_name: s.first_name, last_name: s.last_name, email: s.email };
    this.formError.set('');
    this.userModal.set(true);
  }

  saveUser() {
    this.saving.set(true); this.formError.set('');
    const isEdit = !!this.editingUser()?.user_id;
    const payload = isEdit ? this.form : { ...this.form, role_name: 'Student' };
    const call = isEdit ? this.api.updateUser(this.editingUser().user_id, payload) : this.api.createUser(payload);
    call.subscribe({
      next: () => { this.userModal.set(null); this.saving.set(false); this.loadStudents(); },
      error: (e: any) => { this.formError.set(e.error?.message || 'เกิดข้อผิดพลาด'); this.saving.set(false); },
    });
  }

  confirmDelete(s: any) {
    if (!confirm(`ลบผู้ใช้ "${s.first_name} ${s.last_name}" ออกจากระบบ?`)) return;
    this.api.deleteUser(s.user_id).subscribe({ next: () => this.loadStudents() });
  }

  toggleStatus(s: any) { this.api.updateStudentStatus(s.student_id, !s.is_active).subscribe({ next: () => this.loadStudents() }); }

  openResetPasswordModal(s: any) { this.resetModal.set(s); this.newPassword = ''; this.formError.set(''); }

  doResetPassword() {
    if (!this.newPassword || this.newPassword.length < 6) { this.formError.set('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return; }
    this.saving.set(true);
    this.api.adminResetPassword(this.resetModal().user_id, this.newPassword).subscribe({
      next: () => { this.resetModal.set(null); this.saving.set(false); alert('รีเซ็ตรหัสผ่านเรียบร้อย'); },
      error: (e: any) => { this.formError.set(e.error?.message || 'เกิดข้อผิดพลาด'); this.saving.set(false); },
    });
  }

  approveReset(r: any) {
    if (!r._newPassword) return;
    this.api.approvePasswordReset(r.request_id, r._newPassword).subscribe({ next: () => { alert('อนุมัติเรียบร้อย'); this.loadResetRequests(); } });
  }

  rejectReset(r: any) {
    if (confirm('ต้องการปฏิเสธคำขอนี้ใช่หรือไม่?')) {
      this.api.rejectPasswordReset(r.request_id).subscribe({ next: () => this.loadResetRequests() });
    }
  }
}