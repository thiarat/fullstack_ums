import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { AdminApiService } from '../../core/services/admin-api.service';
import { Department } from '../../shared/models';

@Component({
  selector: 'app-admin-departments',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="main-content">
        <app-topbar title="จัดการคณะ/แผนก" subtitle="ระบบข้อมูลคณะและแผนกทั้งหมด" />
        
        <div class="page-content">

        <div class="row align-items-center mb-4 pt-3 mt-4 stagger-item">
            <div class="col-sm-7 col-12 mb-3 mb-sm-0">
              <h4 class="fw-bold text-dark mb-1">รายการคณะในระบบ</h4>
              <p class="text-muted small mb-0">พบ <strong class="text-primary">{{ departments().length }}</strong> คณะที่เปิดสอน</p>
            </div>
            
            <div class="col-sm-5 col-12 text-sm-end">
              <button class="btn btn-add-faculty shadow-sm" (click)="openModal()">
                <i class="bi bi-plus-circle-fill me-2 fs-5"></i>
                <span class="fw-bold">เพิ่มคณะใหม่</span>
              </button>
            </div>
          </div>

          <div class="row g-4 mt-1">
            @for (d of departments(); track d.dept_id) {
              <div class="col-12 col-md-6 col-lg-4 col-xl-3 stagger-item">
                <div class="card card-modern h-100 faculty-card">
                  
                  <div class="card-body p-4 pb-0 d-flex flex-column position-relative">
                    
                    <div class="floating-actions">
                      <button class="btn-action-glass text-primary" (click)="openModal(d)" title="แก้ไข">
                        <i class="bi bi-pencil-fill"></i>
                      </button>
                      <button class="btn-action-glass text-danger" (click)="delete(d)" title="ลบ">
                        <i class="bi bi-trash-fill"></i>
                      </button>
                    </div>

                    <div class="faculty-icon-wrap mb-3">
                      <div class="faculty-icon">
                        <i class="bi bi-building-fill"></i>
                      </div>
                    </div>
                    
                    <h5 class="fw-bold text-dark mb-1 text-truncate" [title]="d.name">{{ d.name }}</h5>
                    
                    <div class="text-muted small mb-4 flex-grow-1 d-flex align-items-start gap-2">
                      <i class="bi bi-geo-alt-fill text-primary opacity-50 mt-1"></i> 
                      <span class="lh-sm">{{ d.location || 'ไม่ได้ระบุสถานที่ตั้งอาคาร' }}</span>
                    </div>
                    
                  </div>

                  <div class="faculty-card-footer mt-auto">
                    <div class="row g-0 text-center">
                      <div class="col-6 position-relative">
                        <div class="stat-val text-dark">{{ d.professor_count || 0 }}</div>
                        <div class="stat-lbl">บุคลากร/อาจารย์</div>
                        <div class="divider-vertical"></div>
                      </div>
                      <div class="col-6">
                        <div class="stat-val text-dark">{{ d.course_count || 0 }}</div>
                        <div class="stat-lbl">รายวิชาทั้งหมด</div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            } @empty {
              <div class="col-12 fade-in">
                <div class="empty-state-premium">
                  <div class="empty-icon-wrap mb-3">
                    <i class="bi bi-buildings"></i>
                  </div>
                  <h5 class="fw-bold text-dark mb-2">ยังไม่มีข้อมูลคณะในระบบ</h5>
                  <p class="text-muted mb-4">เริ่มต้นสร้างโครงสร้างมหาวิทยาลัยโดยการเพิ่มคณะแรกของคุณ</p>
                  <button class="btn btn-add-faculty" (click)="openModal()">
                    <i class="bi bi-plus-circle-fill me-2 fs-5"></i>
                    <span class="fw-bold">สร้างคณะแรก</span>
                  </button>
                </div>
              </div>
            }
          </div>

          @if (showModal()) {
            <div class="modal-backdrop show" (click)="closeModal()"></div>
            <div class="modal show d-block fade-in">
              <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
                <div class="modal-content modal-ultra-clean">
                  
                  <div class="modal-header border-0 pb-0 pt-4 px-4">
                    <div class="d-flex align-items-center gap-3">
                      <div class="modal-icon-box" [class]="editing() ? 'bg-warning-soft text-warning' : 'bg-primary-soft text-primary'">
                        <i class="bi" [class]="editing() ? 'bi-building-gear' : 'bi-building-add'"></i>
                      </div>
                      <div>
                        <h4 class="modal-title fw-bold text-dark mb-0">
                          {{ editing() ? 'แก้ไขข้อมูลคณะ' : 'เพิ่มคณะใหม่' }}
                        </h4>
                        <p class="text-muted small mb-0 mt-1">กรอกรายละเอียดเพื่อบันทึกข้อมูลเข้าสู่ระบบ</p>
                      </div>
                    </div>
                    <button type="button" class="btn-close-round" (click)="closeModal()">
                      <i class="bi bi-x-lg"></i>
                    </button>
                  </div>
                  
                  <div class="modal-body p-4">
                    <div class="mb-4">
                      <label class="form-label fw-semibold text-dark small mb-2">ชื่อคณะ <span class="text-danger">*</span></label>
                      <div class="input-modern">
                        <i class="bi bi-building text-muted"></i>
                        <input type="text" class="form-control" [(ngModel)]="form.name" placeholder="เช่น คณะวิทยาศาสตร์และเทคโนโลยี">
                      </div>
                    </div>
                    
                    <div class="mb-2">
                      <label class="form-label fw-semibold text-dark small mb-2">ที่ตั้ง (อาคาร/ชั้น)</label>
                      <div class="input-modern">
                        <i class="bi bi-geo-alt text-muted"></i>
                        <input type="text" class="form-control" [(ngModel)]="form.location" placeholder="เช่น อาคาร A ชั้น 3">
                      </div>
                    </div>
                  </div>
                  
                  <div class="modal-footer border-0 p-4 pt-0 gap-2">
                    <button class="btn btn-light btn-cancel flex-grow-1" (click)="closeModal()">ยกเลิก</button>
                    <button class="btn btn-add-faculty flex-grow-1" style="min-width: unset; height: 48px;" (click)="save()" [disabled]="!form.name">
                      <i class="bi bi-check-circle-fill me-2" *ngIf="!editing()"></i>
                      <span class="fw-bold">{{ editing() ? 'บันทึกการแก้ไข' : 'ยืนยันเพิ่มคณะ' }}</span>
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
      /* ปรับตัวเลขแรก (4rem) ให้เยอะขึ้นถ้า Topbar ของคุณหนามาก */
      padding: 4rem 2rem 2rem 2rem; 
      font-family: 'Prompt', sans-serif;
      background-color: #f4f7fa; 
      min-height: calc(100vh - 70px);
      position: relative;
      z-index: 1;
    }

    /* 🔥 CSS ปุ่มเพิ่มคณะตัวใหม่ แก้ปัญหาโดนบีบ 100% 🔥 */
    .btn-add-faculty {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.6rem 1.6rem;
      border-radius: 50px; /* ทำให้ขอบมนเป็นทรงแคปซูล */
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      border: none;
      color: #ffffff !important;
      white-space: nowrap !important; /* ห้ามเบราว์เซอร์ตัดคำเด็ดขาด */
      min-width: 170px; /* บังคับความกว้างขั้นต่ำ */
      transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
      box-shadow: 0 4px 12px rgba(37,99,235,0.25);
    }
    .btn-add-faculty:hover:not(:disabled) {
      background: linear-gradient(135deg, #1d4ed8, #2563eb);
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(37,99,235,0.4);
    }
    .btn-add-faculty:disabled { background: #94a3b8; opacity: 0.7; box-shadow: none; cursor: not-allowed; }

    /* Department Cards */
    .card-modern {
      background: #ffffff; 
      border-radius: 20px; 
      border: 1px solid rgba(226, 232, 240, 0.8);
      box-shadow: 0 4px 15px rgba(0,0,0,0.02);
      transition: all 0.3s ease;
      overflow: hidden;
      position: relative;
    }
    .faculty-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 15px 30px -5px rgba(37,99,235,0.1);
      border-color: #bfdbfe;
    }

    /* Top Accent Line */
    .faculty-card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
      background: linear-gradient(90deg, #3b82f6, #60a5fa);
      opacity: 0; transition: opacity 0.3s ease;
    }
    .faculty-card:hover::before { opacity: 1; }

    /* Icon Styling */
    .faculty-icon-wrap { display: inline-block; }
    .faculty-icon {
      width: 54px; height: 54px; border-radius: 14px;
      background: #eff6ff; display: inline-flex; align-items: center; justify-content: center;
      color: #3b82f6; font-size: 1.5rem;
      transition: transform 0.3s ease;
      border: 1px solid #dbeafe;
    }
    .faculty-card:hover .faculty-icon { transform: scale(1.1) rotate(-5deg); background: #dbeafe; color: #2563eb; }

    /* Floating Actions */
    .floating-actions {
      position: absolute; top: 1.2rem; right: 1.2rem;
      display: flex; gap: 0.4rem;
      opacity: 0; transform: translateX(10px);
      transition: all 0.3s ease;
    }
    .faculty-card:hover .floating-actions { opacity: 1; transform: translateX(0); }
    
    .btn-action-glass {
      width: 34px; height: 34px; border-radius: 10px; border: none;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.9rem; transition: 0.2s;
      background: rgba(241, 245, 249, 0.8);
      backdrop-filter: blur(4px);
    }
    .btn-action-glass:hover { transform: scale(1.1); }
    .btn-action-glass.text-primary:hover { background: #eff6ff; color: #2563eb !important; }
    .btn-action-glass.text-danger:hover { background: #fef2f2; color: #ef4444 !important; }

    /* Footer Stats */
    .faculty-card-footer {
      background: #f8fafc;
      border-top: 1px solid #f1f5f9;
      padding: 1.25rem 0;
      margin: 0 -1.5rem;
    }
    .stat-val { font-size: 1.3rem; font-weight: 800; line-height: 1; }
    .stat-lbl { font-size: 0.75rem; font-weight: 500; color: #64748b; margin-top: 0.4rem; }
    .divider-vertical { position: absolute; right: 0; top: 15%; height: 70%; width: 1px; background: #e2e8f0; }

    /* Modern Inputs */
    .input-modern { position: relative; }
    .input-modern > i { position: absolute; left: 1.2rem; top: 50%; transform: translateY(-50%); font-size: 1.1rem; pointer-events: none; }
    .input-modern .form-control { 
      padding-left: 3rem; height: 50px; border-radius: 12px; background-color: #f8fafc; 
      border: 1.5px solid #e2e8f0; font-size: 0.95rem; color: #1e293b; transition: 0.2s;
    }
    .input-modern .form-control:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59,130,246,0.1); outline: none; background-color: #fff;}
    .input-modern .form-control:focus ~ i { color: #3b82f6 !important; }

    /* Empty State Premium */
    .empty-state-premium {
      text-align: center; padding: 4rem 1rem;
      background: white; border-radius: 20px; border: 1px dashed #e2e8f0;
    }
    .empty-icon-wrap { 
      width: 80px; height: 80px; margin: 0 auto; border-radius: 50%; 
      background: #f1f5f9; display: flex; align-items: center; justify-content: center;
      font-size: 2.5rem; color: #94a3b8;
    }

    /* Modal Ultra Clean */
    .modal-backdrop { background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(3px); }
    .modal-ultra-clean { background: #ffffff; border-radius: 24px; border: none; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
    .modal-icon-box { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; }
    
    .btn-close-round { 
      background: #f1f5f9; border: none; width: 36px; height: 36px; border-radius: 50%; 
      display: flex; align-items: center; justify-content: center; color: #64748b; transition: 0.2s; 
    }
    .btn-close-round:hover { background: #e2e8f0; color: #0f172a; transform: rotate(90deg); }
    
    .btn-cancel { height: 48px; border-radius: 12px; font-weight: 500; background: #f1f5f9; color: #475569; border: none; transition: 0.2s;}
    .btn-cancel:hover { background: #e2e8f0; color: #0f172a; }

    /* Colors */
    .bg-primary-soft { background: #eff6ff; }
    .bg-warning-soft { background: #fffbeb; }

    /* Animations */
    @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
    .stagger-item { animation: fadeSlideUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; }
    .row > div:nth-child(1) { animation-delay: 0.05s; }
    .row > div:nth-child(2) { animation-delay: 0.1s; }
    .row > div:nth-child(3) { animation-delay: 0.15s; }
    .row > div:nth-child(4) { animation-delay: 0.2s; }
    .row > div:nth-child(5) { animation-delay: 0.25s; }
    .row > div:nth-child(6) { animation-delay: 0.3s; }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .fade-in { animation: fadeIn 0.2s ease-in; }
  `]
})
export class AdminDepartmentsComponent implements OnInit {
  departments = signal<Department[]>([]);
  showModal = signal(false);
  editing = signal<Department | null>(null);
  form = { name: '', location: '' };

  constructor(private api: AdminApiService) {}
  ngOnInit() { this.load(); }

  load() {
    this.api.getDepartments().subscribe(res => {
      if (res.data) this.departments.set(res.data as Department[]);
    });
  }

  openModal(d?: Department) {
    this.editing.set(d ?? null);
    this.form = { name: d?.name ?? '', location: d?.location ?? '' };
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  save() {
    const ed = this.editing();
    const obs = ed
      ? this.api.updateDepartment(ed.dept_id, this.form)
      : this.api.createDepartment(this.form as any);
    obs.subscribe(() => { this.closeModal(); this.load(); });
  }

  delete(d: Department) {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบคณะ "${d.name}"?\nข้อมูลที่เกี่ยวข้องอาจได้รับผลกระทบ`)) {
      this.api.deleteDepartment(d.dept_id).subscribe(() => this.load());
    }
  }
}