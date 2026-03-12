import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { AdminApiService } from '../../core/services/admin-api.service';

const DAY_TH: Record<string,string> = {
  Monday:'จันทร์',Tuesday:'อังคาร',Wednesday:'พุธ',
  Thursday:'พฤหัส',Friday:'ศุกร์',Saturday:'เสาร์',Sunday:'อาทิตย์'
};

@Component({
  selector: 'app-admin-professors',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="main-content">
        <app-topbar title="จัดการอาจารย์" subtitle="รายชื่อและจัดการบัญชีบุคลากรอาจารย์" />
        
        <div class="page-content">

          <div class="row align-items-center mb-4 mt-4 stagger-item">
            <div class="col-md-7 col-12 mb-3 mb-md-0">
              <h4 class="fw-bold text-dark mb-1">รายชื่ออาจารย์</h4>
              <p class="text-muted small mb-0">พบข้อมูลบุคลากร <strong class="text-primary">{{ professors().length }}</strong> ท่าน</p>
            </div>
            <div class="col-md-5 col-12 text-md-end">
              <button class="btn btn-add-premium shadow-sm" (click)="openCreate()">
                <div class="icon-circle"><i class="bi bi-person-plus-fill"></i></div>
                <span class="fw-bold">เพิ่มอาจารย์ใหม่</span>
              </button>
            </div>
          </div>

          <div class="filter-toolbar mb-4 stagger-item" style="animation-delay: 0.1s;">
            <div class="row g-3">
              <div class="col-md-6 col-lg-4">
                <div class="input-modern-group">
                  <i class="bi bi-search text-muted"></i>
                  <input type="text" class="form-control" [(ngModel)]="search" (ngModelChange)="load()" placeholder="ค้นหาชื่อ, อีเมล...">
                </div>
              </div>
              <div class="col-md-6 col-lg-3">
                <div class="input-modern-group">
                  <i class="bi bi-funnel text-muted"></i>
                  <select class="form-control form-select-modern" [(ngModel)]="deptFilter" (ngModelChange)="load()">
                    <option value="">ทุกคณะ/แผนก</option>
                    @for (d of depts(); track d.dept_id) {
                      <option [value]="d.dept_id">{{ d.name }}</option>
                    }
                  </select>
                </div>
              </div>
            </div>
          </div>

          @if (loading()) {
            <div class="loading-state fade-in">
              <div class="spinner-border text-primary" role="status"></div>
              <div class="mt-3 text-muted fw-medium">กำลังโหลดข้อมูล...</div>
            </div>
          } @else {
            <div class="card premium-card stagger-item" style="animation-delay: 0.2s;">
              <div class="table-responsive">
                <table class="table custom-table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>ข้อมูลอาจารย์</th>
                      <th>อีเมล (Email)</th>
                      <th>สังกัด (คณะ/แผนก)</th>
                      <th class="text-center">สถานะบัญชี</th>
                      <th class="text-end">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (p of professors(); track p.prof_id) {
                      <tr class="clickable-row" (click)="viewSchedule(p)" title="คลิกเพื่อดูตารางสอน">
                        <td>
                          <div class="d-flex align-items-center gap-3">
                            <div class="avatar-gradient">{{ p.first_name?.[0] || 'T' }}</div>
                            <div>
                              <div class="fw-bold text-dark" style="font-size: 0.95rem;">{{ p.first_name }} {{ p.last_name }}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div class="text-muted small"><i class="bi bi-envelope me-1"></i>{{ p.email || 'ไม่มีข้อมูล' }}</div>
                        </td>
                        <td>
                          <span class="badge-outline">
                            <i class="bi bi-building me-1 opacity-50"></i>{{ p.department || 'ไม่ระบุสังกัด' }}
                          </span>
                        </td>
                        <td class="text-center">
                          <span class="badge-soft" [class]="p.is_active ? 'success' : 'secondary'">
                            <span class="status-dot" [class.bg-success]="p.is_active" [class.bg-secondary]="!p.is_active"></span>
                            {{ p.is_active ? 'ใช้งานปกติ' : 'ปิดใช้งาน' }}
                          </span>
                        </td>
                        <td class="text-end" (click)="$event.stopPropagation()">
                          <div class="d-flex gap-2 justify-content-end">
                            <button class="action-btn text-primary-hover" title="แก้ไข" (click)="openEdit(p)">
                              <i class="bi bi-pencil-fill"></i>
                            </button>
                            <button class="action-btn text-warning-hover" title="รีเซ็ตรหัสผ่าน" (click)="openReset(p)">
                              <i class="bi bi-key-fill"></i>
                            </button>
                            <button class="action-btn text-danger-hover" title="ลบข้อมูล" (click)="deleteProf(p)">
                              <i class="bi bi-trash-fill"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="5" class="text-center py-5">
                          <div class="empty-state-box border-0">
                            <div class="empty-icon-wrap mb-3 mx-auto"><i class="bi bi-person-x"></i></div>
                            <h6 class="fw-bold text-dark mb-1">ไม่พบข้อมูลอาจารย์</h6>
                            <p class="text-muted small">ลองเปลี่ยนเงื่อนไขการค้นหาหรือเพิ่มข้อมูลใหม่</p>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

          @if (scheduleModal()) {
            <div class="modal-backdrop show fade-in" (click)="scheduleModal.set(null)"></div>
            <div class="modal show d-block fade-in">
              <div class="modal-dialog modal-dialog-centered modal-lg" (click)="$event.stopPropagation()">
                <div class="modal-content ultra-clean-modal animate-modal-pop">
                  
                  <div class="modal-header border-0 pb-0 pt-4 px-4">
                    <div class="d-flex align-items-center gap-3">
                      <div class="modal-icon-box bg-primary-soft text-primary">
                        <i class="bi bi-calendar-week"></i>
                      </div>
                      <div>
                        <h4 class="modal-title fw-bold text-dark mb-0">ตารางสอน</h4>
                        <p class="text-muted small mb-0 mt-1">อ. {{ scheduleModal()!.first_name }} {{ scheduleModal()!.last_name }}</p>
                      </div>
                    </div>
                    <button type="button" class="btn-close-round" (click)="scheduleModal.set(null)"><i class="bi bi-x-lg"></i></button>
                  </div>
                  
                  <div class="modal-body p-4">
                    @if (schedLoading()) {
                      <div class="text-center p-5"><div class="spinner-border text-primary"></div></div>
                    } @else if (schedData().length === 0) {
                      <div class="empty-state-box py-5">
                        <i class="bi bi-calendar-x text-muted fs-1 mb-3 d-block"></i>
                        <h6 class="fw-bold text-dark mb-1">ยังไม่มีรายวิชาที่สอน</h6>
                        <p class="text-muted small mb-0">อาจารย์ท่านนี้ยังไม่ได้ถูกมอบหมายตารางสอนในระบบ</p>
                      </div>
                    } @else {
                      <div class="table-responsive border rounded-4 overflow-hidden mb-4">
                        <table class="table custom-table mb-0">
                          <thead class="bg-light">
                            <tr>
                              <th>รายวิชา</th>
                              <th>วัน/เวลาเรียน</th>
                              <th>ห้องเรียน</th>
                              <th class="text-center">หน่วยกิต</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (s of schedData(); track s.schedule_id) {
                              <tr>
                                <td>
                                  <code class="code-badge mb-1 d-inline-block">{{ s.course_code }}</code>
                                  <div class="fw-bold text-dark" style="font-size:.9rem;">{{ s.course_title || s.title }}</div>
                                </td>
                                <td>
                                  <span class="badge-soft bg-primary-soft text-primary mb-1 d-inline-block">{{ dayTh(s.day_of_week) }}</span>
                                  <div class="text-muted small"><i class="bi bi-clock me-1"></i>{{ s.start_time | slice:0:5 }} – {{ s.end_time | slice:0:5 }}</div>
                                </td>
                                <td><span class="fw-medium">{{ s.room_number || '-' }}</span></td>
                                <td class="text-center"><span class="badge bg-secondary rounded-pill px-2">{{ s.credits }}</span></td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                      
                      <div class="summary-banner d-flex justify-content-around align-items-center p-3 rounded-4 bg-primary-soft border border-primary border-opacity-10">
                        <div class="text-center">
                          <div class="small text-muted mb-1">จำนวนวิชาที่สอน</div>
                          <div class="fw-bold text-primary fs-5">{{ schedData().length }} <span class="fs-6 fw-normal">วิชา</span></div>
                        </div>
                        <div class="divider-vertical-short"></div>
                        <div class="text-center">
                          <div class="small text-muted mb-1">รวมหน่วยกิต</div>
                          <div class="fw-bold text-primary fs-5">{{ totalCredits() }} <span class="fs-6 fw-normal">หน่วยกิต</span></div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          }

          @if (showForm()) {
            <div class="modal-backdrop show fade-in" (click)="showForm.set(false)"></div>
            <div class="modal show d-block fade-in">
              <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
                <div class="modal-content ultra-clean-modal animate-modal-pop">
                  
                  <div class="modal-header border-0 pb-0 pt-4 px-4">
                    <div class="d-flex align-items-center gap-3">
                      <div class="modal-icon-box" [class]="editingProf() ? 'bg-warning-soft text-warning' : 'bg-primary-soft text-primary'">
                        <i class="bi" [class]="editingProf() ? 'bi-person-gear' : 'bi-person-add'"></i>
                      </div>
                      <div>
                        <h4 class="modal-title fw-bold text-dark mb-0">{{ editingProf() ? 'แก้ไขข้อมูลอาจารย์' : 'เพิ่มอาจารย์ใหม่' }}</h4>
                      </div>
                    </div>
                    <button type="button" class="btn-close-round" (click)="showForm.set(false)"><i class="bi bi-x-lg"></i></button>
                  </div>
                  
                  <div class="modal-body p-4">
                    @if (!editingProf()) {
                      <div class="row g-3 mb-3">
                        <div class="col-12">
                          <label class="form-label fw-semibold text-dark small mb-2">Username <span class="text-danger">*</span></label>
                          <div class="input-modern-group">
                            <i class="bi bi-person-badge text-muted"></i>
                            <input class="form-control" [(ngModel)]="form.username" placeholder="ตั้งชื่อผู้ใช้งาน">
                          </div>
                        </div>
                        <div class="col-12">
                          <label class="form-label fw-semibold text-dark small mb-2">รหัสผ่าน (Password) <span class="text-danger">*</span></label>
                          <div class="input-modern-group">
                            <i class="bi bi-lock text-muted"></i>
                            <input type="password" class="form-control" [(ngModel)]="form.password" placeholder="••••••••">
                          </div>
                        </div>
                      </div>
                    }
                    
                    <div class="row g-3 mb-3">
                      <div class="col-md-6">
                        <label class="form-label fw-semibold text-dark small mb-2">ชื่อ <span class="text-danger">*</span></label>
                        <input class="form-control modern-input" [(ngModel)]="form.first_name" placeholder="ชื่อจริง">
                      </div>
                      <div class="col-md-6">
                        <label class="form-label fw-semibold text-dark small mb-2">นามสกุล <span class="text-danger">*</span></label>
                        <input class="form-control modern-input" [(ngModel)]="form.last_name" placeholder="นามสกุล">
                      </div>
                    </div>

                    <div class="mb-3">
                      <label class="form-label fw-semibold text-dark small mb-2">อีเมล (Email) @if(!editingProf()){<span class="text-danger">*</span>}</label>
                      <div class="input-modern-group">
                        <i class="bi bi-envelope text-muted"></i>
                        <input type="email" class="form-control" [(ngModel)]="form.email" placeholder="email@university.ac.th">
                      </div>
                    </div>

                    <div class="mb-2">
                      <label class="form-label fw-semibold text-dark small mb-2">สังกัด (คณะ/แผนก)</label>
                      <div class="input-modern-group">
                        <i class="bi bi-building text-muted"></i>
                        <select class="form-control form-select-modern" [(ngModel)]="form.dept_id">
                          <option [value]="null">-- ไม่ระบุสังกัด --</option>
                          @for (d of depts(); track d.dept_id) {
                            <option [value]="d.dept_id">{{ d.name }}</option>
                          }
                        </select>
                      </div>
                    </div>

                    @if (formErr()) {
                      <div class="alert alert-danger py-2 small border-0 d-flex align-items-center mt-3 mb-0">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>{{ formErr() }}
                      </div>
                    }
                  </div>
                  
                  <div class="modal-footer border-0 p-4 pt-0 gap-2 flex-nowrap">
                    <button class="btn btn-light btn-cancel flex-grow-1" (click)="showForm.set(false)">ยกเลิก</button>
                    <button class="btn btn-submit-solid flex-grow-1" (click)="saveForm()" [disabled]="saving()">
                      <span class="spinner-border spinner-border-sm me-2" *ngIf="saving()"></span>
                      {{ editingProf() ? 'บันทึกการเปลี่ยนแปลง' : 'ยืนยันเพิ่มอาจารย์' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }

          @if (showReset()) {
            <div class="modal-backdrop show fade-in" (click)="showReset.set(false)"></div>
            <div class="modal show d-block fade-in">
              <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
                <div class="modal-content ultra-clean-modal animate-modal-pop">
                  
                  <div class="modal-header border-0 pb-0 pt-4 px-4">
                    <div class="d-flex align-items-center gap-3">
                      <div class="modal-icon-box bg-warning-soft text-warning">
                        <i class="bi bi-shield-lock"></i>
                      </div>
                      <div>
                        <h4 class="modal-title fw-bold text-dark mb-0">รีเซ็ตรหัสผ่าน</h4>
                        <p class="text-muted small mb-0 mt-1">อ. {{ resetTarget()?.first_name }} {{ resetTarget()?.last_name }}</p>
                      </div>
                    </div>
                    <button type="button" class="btn-close-round" (click)="showReset.set(false)"><i class="bi bi-x-lg"></i></button>
                  </div>
                  
                  <div class="modal-body p-4">
                    <div class="mb-2">
                      <label class="form-label fw-semibold text-dark small mb-2">กำหนดรหัสผ่านใหม่ <span class="text-danger">*</span></label>
                      <div class="input-modern-group">
                        <i class="bi bi-key text-muted"></i>
                        <input type="password" class="form-control" [(ngModel)]="newPw" placeholder="ความยาวอย่างน้อย 6 ตัวอักษร">
                      </div>
                    </div>
                    @if (formErr()) {
                      <div class="alert alert-danger py-2 small border-0 d-flex align-items-center mt-3 mb-0">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>{{ formErr() }}
                      </div>
                    }
                  </div>
                  
                  <div class="modal-footer border-0 p-4 pt-0 gap-2 flex-nowrap">
                    <button class="btn btn-light btn-cancel flex-grow-1" (click)="showReset.set(false)">ยกเลิก</button>
                    <button class="btn btn-warning btn-submit-solid text-dark flex-grow-1" (click)="doReset()" [disabled]="saving()">
                      <i class="bi bi-check2-circle me-1"></i> ยืนยันการรีเซ็ต
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }

        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');

    .page-content {
      padding: 4rem 2rem 2rem 2rem; /* เพิ่ม padding-top หลบ Topbar */
      font-family: 'Prompt', sans-serif;
      background-color: #f4f7f9; 
      min-height: calc(100vh - 70px);
      position: relative;
      z-index: 1;
    }

    /* 💎 Premium Add Button (แก้ปุ่มโดนบีบ 100%) */
    .btn-add-premium {
      height: 48px; 
      padding: 0.3rem 1.25rem 0.3rem 0.4rem; 
      border-radius: 50px; 
      font-weight: 600; font-size: 0.95rem;
      border: none; background: linear-gradient(135deg, #2563eb, #3b82f6); 
      color: white; display: inline-flex; align-items: center; gap: 0.75rem;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      white-space: nowrap !important; min-width: 170px;
      box-shadow: 0 4px 12px rgba(37,99,235,0.25);
    }
    .btn-add-premium .icon-circle {
      width: 36px; height: 36px; border-radius: 50%;
      background: rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem;
    }
    .btn-add-premium:hover:not(:disabled) { 
      transform: translateY(-2px); box-shadow: 0 8px 20px rgba(37,99,235,0.4);
    }

    /* Toolbar Inputs */
    .input-modern-group { position: relative; }
    .input-modern-group > i { position: absolute; left: 1.2rem; top: 50%; transform: translateY(-50%); font-size: 1.1rem; pointer-events: none; transition: 0.3s;}
    .input-modern-group .form-control { 
      padding-left: 3rem; height: 48px; border-radius: 12px; background-color: #ffffff; 
      border: 1px solid #cbd5e1; font-size: 0.95rem; color: #1e293b; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }
    .input-modern-group .form-control:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59,130,246,0.1); outline: none;}
    .input-modern-group .form-control:focus ~ i { color: #3b82f6 !important; }
    .form-select-modern { padding-left: 2.8rem !important; cursor: pointer; }

    .modern-input { height: 48px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 0.95rem; padding-left: 1rem; transition: 0.3s;}
    .modern-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59,130,246,0.1); outline: none; }

    /* 💎 Premium Card & Table */
    .premium-card {
      background: #ffffff; border-radius: 20px; border: 1px solid rgba(226, 232, 240, 0.8);
      box-shadow: 0 4px 15px rgba(0,0,0,0.02); overflow: hidden;
    }
    .custom-table th { 
      font-weight: 600; color: #475569; font-size: 0.85rem; border-bottom: 2px solid #e2e8f0; 
      padding: 1.2rem 1.5rem; background: #f8fafc; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .custom-table td { padding: 1rem 1.5rem; vertical-align: middle; border-bottom: 1px solid #f1f5f9; transition: background 0.2s; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover td { background-color: #f8fafc; }

    /* Avatars & Badges */
    .avatar-gradient { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.1rem; box-shadow: 0 2px 5px rgba(59,130,246,0.3);}
    .code-badge { background: #f1f5f9; color: #475569; padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.85rem; border: 1px solid #e2e8f0; }
    .badge-outline { padding: 0.35rem 0.7rem; border-radius: 8px; font-size: 0.8rem; font-weight: 500; border: 1px solid #e2e8f0; background: #f8fafc; color: #475569;}
    
    .badge-soft { padding: 0.35rem 0.7rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;}
    .badge-soft.success { background: #ecfdf5; color: #10b981; }
    .badge-soft.secondary { background: #f1f5f9; color: #64748b; }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; }

    /* Action Buttons (Soft) */
    .action-btn { width: 34px; height: 34px; border-radius: 8px; border: none; display: inline-flex; align-items: center; justify-content: center; background: transparent; color: #94a3b8; transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1); }
    .action-btn:hover { background: #f1f5f9; transform: scale(1.1); }
    .action-btn.text-primary-hover:hover { background: #eff6ff; color: #2563eb; }
    .action-btn.text-warning-hover:hover { background: #fffbeb; color: #d97706; }
    .action-btn.text-danger-hover:hover { background: #fef2f2; color: #ef4444; }

    /* Empty States & Loaders */
    .empty-state-box { text-align: center; padding: 3rem 1rem; background: transparent; }
    .empty-icon-wrap { width: 80px; height: 80px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; color: #cbd5e1; }
    .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5rem 0; }

    /* 💎 Premium Modals */
    .modal-backdrop { background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(3px); }
    .ultra-clean-modal { background: #ffffff; border-radius: 24px; border: none; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
    .modal-icon-box { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; }
    
    .btn-close-round { background: #f1f5f9; border: none; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #64748b; transition: 0.2s; }
    .btn-close-round:hover { background: #e2e8f0; color: #0f172a; transform: rotate(90deg); }
    
    .btn-cancel { height: 48px; border-radius: 12px; font-weight: 500; background: #f1f5f9; color: #475569; border: none; transition: 0.2s;}
    .btn-cancel:hover { background: #e2e8f0; color: #0f172a; }
    
    .btn-submit-solid { height: 48px; border-radius: 12px; font-weight: 600; background: #2563eb; color: white; border: none; transition: 0.2s; }
    .btn-submit-solid:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(37,99,235,0.2);}
    .btn-submit-solid.btn-warning { background: #f59e0b; color: #fff; }
    .btn-submit-solid.btn-warning:hover:not(:disabled) { background: #d97706; box-shadow: 0 4px 10px rgba(245,158,11,0.2); }

    .bg-primary-soft { background: #eff6ff; }
    .bg-warning-soft { background: #fffbeb; }

    .divider-vertical-short { width: 1px; height: 30px; background: rgba(37,99,235,0.2); }

    /* Animations */
    @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
    .stagger-item { animation: fadeSlideUp 0.5s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; opacity: 0; }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .fade-in { animation: fadeIn 0.3s ease-in forwards; }

    @keyframes modalPop { 0% { opacity: 0; transform: scale(0.95) translateY(15px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
    .animate-modal-pop { animation: modalPop 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; }
  `]
})
export class AdminProfessorsComponent implements OnInit {
  private api = inject(AdminApiService);

  professors   = signal<any[]>([]);
  depts        = signal<any[]>([]);
  loading      = signal(true);
  search       = ''; deptFilter: any = '';
  showForm     = signal(false);
  editingProf  = signal<any>(null);
  showReset    = signal(false);
  resetTarget  = signal<any>(null);
  saving       = signal(false);
  formErr      = signal('');
  newPw        = '';
  form: any    = {};

  // schedule modal
  scheduleModal = signal<any>(null);
  schedData     = signal<any[]>([]);
  schedLoading  = signal(false);
  totalCredits  = () => this.schedData().reduce((s, c) => s + (c.credits || 0), 0);
  dayTh = (d: string) => DAY_TH[d] || d;

  ngOnInit() { this.loadDepts(); this.load(); }

  loadDepts() {
    this.api.getDepartments().subscribe((r: any) => this.depts.set(r.data ?? []));
  }

  load() {
    this.loading.set(true);
    this.api.getProfessors({ search: this.search, dept_id: this.deptFilter }).subscribe({
      next: (r: any) => { this.professors.set(r.data?.data ?? r.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  viewSchedule(p: any) {
    this.scheduleModal.set(p);
    this.schedData.set([]);
    this.schedLoading.set(true);
    this.api.getProfSchedule(p.prof_id).subscribe({
      next: (r: any) => { this.schedData.set(r.data ?? []); this.schedLoading.set(false); },
      error: () => this.schedLoading.set(false),
    });
  }

  openCreate() { this.editingProf.set(null); this.form = { dept_id: null }; this.formErr.set(''); this.showForm.set(true); }
  openEdit(p: any) {
    this.editingProf.set(p);
    this.form = { first_name: p.first_name, last_name: p.last_name, email: p.email, dept_id: p.dept_id };
    this.formErr.set(''); this.showForm.set(true);
  }

  saveForm() {
    this.saving.set(true); this.formErr.set('');
    const isEdit = !!this.editingProf();
    const payload = isEdit ? { ...this.form, role_name: 'Professor' } : { ...this.form, role_name: 'Professor' };
    const call = isEdit
      ? this.api.updateProfessor(this.editingProf().prof_id, payload)
      : this.api.createProfessor(payload);
    call.subscribe({
      next: () => { this.showForm.set(false); this.saving.set(false); this.load(); },
      error: (e: any) => { this.formErr.set(e.error?.message || 'เกิดข้อผิดพลาด'); this.saving.set(false); },
    });
  }

  deleteProf(p: any) {
    if (!confirm(`ยืนยันการลบข้อมูลอาจารย์ "${p.first_name} ${p.last_name}"?\nระบบจะลบข้อมูลที่เกี่ยวข้องออกทั้งหมด`)) return;
    this.api.deleteUser(p.user_id).subscribe({ next: () => this.load() });
  }

  openReset(p: any) { this.resetTarget.set(p); this.newPw = ''; this.formErr.set(''); this.showReset.set(true); }

  doReset() {
    if (!this.newPw || this.newPw.length < 6) { this.formErr.set('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร'); return; }
    this.saving.set(true);
    this.api.adminResetPassword(this.resetTarget().user_id, this.newPw).subscribe({
      next: () => { this.showReset.set(false); this.saving.set(false); alert('รีเซ็ตรหัสผ่านสำเร็จ'); },
      error: (e: any) => { this.formErr.set(e.error?.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน'); this.saving.set(false); },
    });
  }
}