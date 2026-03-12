import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { AdminApiService } from '../../core/services/admin-api.service';
import { Course, Department } from '../../shared/models';

@Component({
  selector: 'app-admin-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="main-content">
        <app-topbar title="จัดการรายวิชา" subtitle="ระบบข้อมูลรายวิชาและหน่วยกิตทั้งหมด" />
        
        <div class="page-content">
          
          <div class="row align-items-center mb-4 pt-3 mt-2 stagger-item">
            <div class="col-sm-7 col-12 mb-3 mb-sm-0">
              <h4 class="fw-bold text-dark mb-1">รายชื่อวิชาในระบบ</h4>
              <p class="text-muted small mb-0">พบข้อมูลรายวิชา <strong class="text-primary">{{ courses().length }}</strong> วิชา</p>
            </div>
            
            <div class="col-sm-5 col-12 text-sm-end">
              <button class="btn btn-add-premium shadow-sm" (click)="openModal()">
                <div class="icon-circle"><i class="bi bi-plus-lg"></i></div>
                <span class="fw-bold">เพิ่มวิชาใหม่</span>
              </button>
            </div>
          </div>

          <div class="filter-toolbar mb-4 stagger-item" style="animation-delay: 0.1s;">
            <div class="row g-3">
              <div class="col-md-6 col-lg-4">
                <div class="input-modern-group">
                  <i class="bi bi-search text-muted"></i>
                  <input class="form-control" [(ngModel)]="search" (ngModelChange)="load()" placeholder="ค้นหารหัสวิชา, ชื่อวิชา...">
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
              <div class="mt-3 text-muted fw-medium">กำลังโหลดข้อมูลรายวิชา...</div>
            </div>
          } @else {
            <div class="card premium-card stagger-item" style="animation-delay: 0.2s;">
              <div class="table-responsive">
                <table class="table custom-table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>รหัสวิชา</th>
                      <th>ชื่อวิชา</th>
                      <th class="text-center">หน่วยกิต</th>
                      <th>สังกัด (คณะ/แผนก)</th>
                      <th class="text-center">นักศึกษาลงทะเบียน</th>
                      <th class="text-end">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (c of courses(); track c.course_id) {
                      <tr class="align-middle">
                        <td>
                          <code class="code-badge fs-6">{{ c.course_code }}</code>
                        </td>
                        <td>
                          <strong class="text-dark">{{ c.title }}</strong>
                        </td>
                        <td class="text-center">
                          <span class="badge-soft bg-primary-soft text-primary">{{ c.credits }} หน่วยกิต</span>
                        </td>
                        <td>
                          <span class="badge-outline">
                            <i class="bi bi-building me-1 opacity-50"></i>{{ c.department || 'ไม่ระบุสังกัด' }}
                          </span>
                        </td>
                        <td class="text-center">
                          <span class="text-muted small fw-medium">
                            <i class="bi bi-people-fill me-1 text-secondary"></i>{{ c.enrolled_students ?? 0 }} คน
                          </span>
                        </td>
                        <td class="text-end">
                          <div class="d-flex gap-2 justify-content-end">
                            <button class="action-btn text-primary-hover" title="แก้ไข" (click)="openModal(c)">
                              <i class="bi bi-pencil-fill"></i>
                            </button>
                            <button class="action-btn text-danger-hover" title="ลบข้อมูล" (click)="delete(c)">
                              <i class="bi bi-trash-fill"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="6" class="text-center py-5">
                          <div class="empty-state-box border-0">
                            <div class="empty-icon-wrap mb-3 mx-auto"><i class="bi bi-journal-x"></i></div>
                            <h6 class="fw-bold text-dark mb-1">ไม่พบข้อมูลรายวิชา</h6>
                            <p class="text-muted small">ลองเปลี่ยนเงื่อนไขการค้นหาหรือเพิ่มรายวิชาใหม่</p>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

          @if (showModal()) {
            <div class="modal-backdrop show fade-in" (click)="closeModal()"></div>
            <div class="modal show d-block fade-in">
              <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
                <div class="modal-content ultra-clean-modal animate-modal-pop">
                  
                  <div class="modal-header border-0 pb-0 pt-4 px-4">
                    <div class="d-flex align-items-center gap-3">
                      <div class="modal-icon-box" [class]="editing() ? 'bg-warning-soft text-warning' : 'bg-primary-soft text-primary'">
                        <i class="bi" [class]="editing() ? 'bi-journal-check' : 'bi-journal-plus'"></i>
                      </div>
                      <div>
                        <h4 class="modal-title fw-bold text-dark mb-0">
                          {{ editing() ? 'แก้ไขข้อมูลรายวิชา' : 'เพิ่มรายวิชาใหม่' }}
                        </h4>
                        <p class="text-muted small mb-0 mt-1">กรอกรายละเอียดเพื่อบันทึกข้อมูลเข้าสู่ระบบ</p>
                      </div>
                    </div>
                    <button type="button" class="btn-close-round" (click)="closeModal()">
                      <i class="bi bi-x-lg"></i>
                    </button>
                  </div>
                  
                  <div class="modal-body p-4">
                    <div class="mb-3">
                      <label class="form-label fw-semibold text-dark small mb-2">รหัสวิชา <span class="text-danger">*</span></label>
                      <div class="input-modern-group">
                        <i class="bi bi-upc-scan text-muted"></i>
                        <input class="form-control" [(ngModel)]="form.course_code" placeholder="เช่น CS101, BA202">
                      </div>
                    </div>
                    
                    <div class="mb-4">
                      <label class="form-label fw-semibold text-dark small mb-2">ชื่อวิชา <span class="text-danger">*</span></label>
                      <div class="input-modern-group">
                        <i class="bi bi-book text-muted"></i>
                        <input class="form-control" [(ngModel)]="form.title" placeholder="เช่น Introduction to Programming">
                      </div>
                    </div>
                    
                    <div class="row g-3 mb-2">
                      <div class="col-md-5">
                        <label class="form-label fw-semibold text-dark small mb-2">หน่วยกิต</label>
                        <div class="input-modern-group">
                          <i class="bi bi-123 text-muted"></i>
                          <input type="number" class="form-control" [(ngModel)]="form.credits" min="1" max="6">
                        </div>
                      </div>
                      <div class="col-md-7">
                        <label class="form-label fw-semibold text-dark small mb-2">สังกัดคณะ/แผนก</label>
                        <div class="input-modern-group">
                          <i class="bi bi-building text-muted"></i>
                          <select class="form-control form-select-modern" [(ngModel)]="form.dept_id">
                            <option [ngValue]="null">-- ไม่ระบุสังกัด --</option>
                            @for (d of depts(); track d.dept_id) {
                              <option [value]="d.dept_id">{{ d.name }}</option>
                            }
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="modal-footer border-0 p-4 pt-0 gap-2 flex-nowrap">
                    <button class="btn btn-light btn-cancel flex-grow-1" (click)="closeModal()">ยกเลิก</button>
                    <button class="btn btn-submit-solid flex-grow-1" (click)="save()" [disabled]="!form.course_code || !form.title">
                      <i class="bi bi-check-circle-fill me-2" *ngIf="!editing()"></i>
                      <span>{{ editing() ? 'บันทึกการแก้ไข' : 'ยืนยันเพิ่มรายวิชา' }}</span>
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
      padding: 4rem 2rem 2rem 2rem; 
      font-family: 'Prompt', sans-serif;
      background-color: #f4f7f9; 
      min-height: calc(100vh - 70px);
      position: relative;
      z-index: 1;
    }

    /* 💎 Premium Add Button (ลื่น 100%) */
    .btn-add-premium {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 0.4rem 1.4rem 0.4rem 0.5rem; border-radius: 50px; 
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      border: none; color: #ffffff !important;
      white-space: nowrap !important; min-width: 160px;
      /* ใช้ Hardcode Easing เพื่อไม่ให้พังใน Angular */
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      box-shadow: 0 4px 12px rgba(37,99,235,0.25);
      will-change: transform, box-shadow;
    }
    .btn-add-premium .icon-circle {
      width: 34px; height: 34px; border-radius: 50%; margin-right: 0.6rem;
      background: rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem;
    }
    .btn-add-premium:hover:not(:disabled) { 
      transform: translateY(-2px); box-shadow: 0 8px 20px rgba(37,99,235,0.4);
    }

    /* Toolbar Inputs */
    .input-modern-group { position: relative; }
    .input-modern-group > i { position: absolute; left: 1.2rem; top: 50%; transform: translateY(-50%); font-size: 1.1rem; pointer-events: none; transition: 0.2s ease-out;}
    .input-modern-group .form-control { 
      padding-left: 3rem; height: 48px; border-radius: 12px; background-color: #ffffff; 
      border: 1px solid #cbd5e1; font-size: 0.95rem; color: #1e293b; 
      transition: all 0.2s ease-out;
    }
    .input-modern-group .form-control:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59,130,246,0.1); outline: none;}
    .input-modern-group .form-control:focus ~ i { color: #3b82f6 !important; }
    .form-select-modern { padding-left: 2.8rem !important; cursor: pointer; }

    /* 💎 Premium Card & Table */
    .premium-card {
      background: #ffffff; border-radius: 20px; border: 1px solid rgba(226, 232, 240, 0.8);
      box-shadow: 0 4px 15px rgba(0,0,0,0.02); overflow: hidden;
    }
    .custom-table th { 
      font-weight: 600; color: #475569; font-size: 0.85rem; border-bottom: 2px solid #e2e8f0; 
      padding: 1.2rem 1.5rem; background: #f8fafc; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .custom-table td { padding: 1rem 1.5rem; vertical-align: middle; border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease-out; }
    .custom-table tbody tr:hover td { background-color: #f8fafc; }

    /* Badges */
    .code-badge { background: #f1f5f9; color: #0f172a; padding: 0.3rem 0.6rem; border-radius: 8px; font-size: 0.9rem; border: 1px solid #e2e8f0; font-weight: 600; letter-spacing: 0.5px;}
    .badge-outline { padding: 0.35rem 0.7rem; border-radius: 8px; font-size: 0.85rem; font-weight: 500; border: 1px solid #e2e8f0; background: #ffffff; color: #475569;}
    .badge-soft { padding: 0.35rem 0.8rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center;}
    .bg-primary-soft { background: #eff6ff; }

    /* Action Buttons (Soft) */
    .action-btn { 
      width: 36px; height: 36px; border-radius: 10px; border: none; display: inline-flex; 
      align-items: center; justify-content: center; background: transparent; color: #94a3b8; 
      transition: all 0.2s ease-out; 
    }
    .action-btn:hover { background: #f1f5f9; transform: scale(1.05); }
    .action-btn.text-primary-hover:hover { background: #eff6ff; color: #2563eb; }
    .action-btn.text-danger-hover:hover { background: #fef2f2; color: #ef4444; }

    /* Empty States & Loaders */
    .empty-state-box { text-align: center; padding: 3rem 1rem; background: transparent; }
    .empty-icon-wrap { width: 80px; height: 80px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; color: #cbd5e1; }
    .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5rem 0; }

    /* 💎 Premium Modals (ถอด backdrop-filter ออกเพื่อลดภาระการ์ดจอ) */
    .modal-backdrop { background: rgba(15, 23, 42, 0.6); } 
    .ultra-clean-modal { background: #ffffff; border-radius: 24px; border: none; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); will-change: transform, opacity; }
    .modal-icon-box { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; }
    
    .btn-close-round { background: #f1f5f9; border: none; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #64748b; transition: 0.2s ease-out; }
    .btn-close-round:hover { background: #e2e8f0; color: #0f172a; transform: rotate(90deg); }
    
    .btn-cancel { height: 48px; border-radius: 12px; font-weight: 500; background: #f1f5f9; color: #475569; border: none; transition: 0.2s ease-out;}
    .btn-cancel:hover { background: #e2e8f0; color: #0f172a; }
    
    .btn-submit-solid { height: 48px; border-radius: 12px; font-weight: 600; background: #2563eb; color: white; border: none; transition: 0.2s ease-out; }
    .btn-submit-solid:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(37,99,235,0.2);}

    .bg-warning-soft { background: #fffbeb; }

    /* Animations (Hardware Accelerated & Hardcoded Easings) */
    @keyframes fadeSlideUp { 
      from { opacity: 0; transform: translateY(15px); } 
      to { opacity: 1; transform: translateY(0); } 
    }
    .stagger-item { 
      animation: fadeSlideUp 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; 
      opacity: 0; 
      will-change: transform, opacity;
    }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .fade-in { animation: fadeIn 0.2s ease-in forwards; }

    @keyframes modalPop { 
      0% { opacity: 0; transform: scale(0.95) translateY(10px); } 
      100% { opacity: 1; transform: scale(1) translateY(0); } 
    }
    .animate-modal-pop { animation: modalPop 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; }
  `]
})
export class AdminCoursesComponent implements OnInit {
  loading = signal(true);
  courses = signal<Course[]>([]);
  depts = signal<Department[]>([]);
  showModal = signal(false);
  editing = signal<Course | null>(null);
  search = ''; deptFilter = '';
  form: any = { course_code: '', title: '', credits: 3, dept_id: null };

  constructor(private api: AdminApiService) {}
  ngOnInit() { this.load(); this.api.getDepartments().subscribe(r => { if (r.data) this.depts.set(r.data as Department[]); }); }

  load() {
    this.loading.set(true);
    this.api.getCourses(1, 50, this.search, this.deptFilter ? +this.deptFilter : undefined).subscribe({
      next: r => { if (r.data) this.courses.set(r.data.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openModal(c?: Course) {
    this.editing.set(c ?? null);
    this.form = c ? { ...c } : { course_code: '', title: '', credits: 3, dept_id: null };
    this.showModal.set(true);
  }
  closeModal() { this.showModal.set(false); }

  save() {
    const ed = this.editing();
    const obs = ed ? this.api.updateCourse(ed.course_id, this.form) : this.api.createCourse(this.form);
    obs.subscribe(() => { this.closeModal(); this.load(); });
  }

  delete(c: Course) {
    if (confirm(`ยืนยันการลบรายวิชา "${c.course_code} - ${c.title}" ออกจากระบบ?`))
      this.api.deleteCourse(c.course_id).subscribe(() => this.load());
  }
}