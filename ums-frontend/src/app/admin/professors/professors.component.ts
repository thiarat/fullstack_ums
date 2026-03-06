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
        <app-topbar title="จัดการอาจารย์" subtitle="รายชื่อและจัดการบัญชีอาจารย์" />
        <div class="page-content">

          <!-- Toolbar -->
          <div class="d-flex gap-2 mb-3 flex-wrap">
            <div class="search-box" style="max-width:280px;flex:1">
              <i class="bi bi-search"></i>
              <input type="text" class="form-control" [(ngModel)]="search"
                     (ngModelChange)="load()" placeholder="ค้นหาชื่อ, email...">
            </div>
            <select class="form-select" style="max-width:180px" [(ngModel)]="deptFilter" (ngModelChange)="load()">
              <option value="">ทุกแผนก</option>
              <option *ngFor="let d of depts()" [value]="d.dept_id">{{ d.name }}</option>
            </select>
            <button class="btn btn-primary ms-auto" (click)="openCreate()">
              <i class="bi bi-person-plus me-1"></i> เพิ่มอาจารย์
            </button>
          </div>

          <div class="card">
            <div *ngIf="loading()" class="loading-overlay"><div class="spinner-border"></div></div>
            <div class="table-responsive" *ngIf="!loading()">
              <table class="table mb-0">
                <thead><tr><th>ชื่อ-นามสกุล</th><th>Email</th><th>แผนก</th><th>สถานะ</th><th></th></tr></thead>
                <tbody>
                  <tr *ngFor="let p of professors()" class="stagger-item clickable-row" (click)="viewSchedule(p)">
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <strong>{{ p.first_name }} {{ p.last_name }}</strong>
                      </div>
                    </td>
                    <td class="text-muted" style="font-size:.82rem">{{ p.email }}</td>
                    <td><span class="badge bg-light text-dark border">{{ p.department || '-' }}</span></td>
                    <td>
                      <span class="badge" [class]="p.is_active ? 'bg-success' : 'bg-secondary'">
                        {{ p.is_active ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td (click)="$event.stopPropagation()">
                      <div class="d-flex gap-1">
                        <button class="btn btn-icon btn-sm btn-outline-primary" title="แก้ไข" (click)="openEdit(p)">
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-icon btn-sm btn-outline-warning" title="รีเซ็ตรหัส" (click)="openReset(p)">
                          <i class="bi bi-key"></i>
                        </button>
                        <button class="btn btn-icon btn-sm btn-outline-danger" title="ลบ" (click)="deleteProf(p)">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="empty-state" *ngIf="!loading() && !professors().length">
              <i class="bi bi-person-x"></i><p>ยังไม่มีอาจารย์</p>
            </div>
          </div>

          <!-- Schedule Modal -->
          @if (scheduleModal()) {
            <div class="modal-backdrop show" (click)="scheduleModal.set(null)"></div>
            <div class="modal show d-block">
              <div class="modal-dialog modal-dialog-centered modal-lg" (click)="$event.stopPropagation()">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title">
                      <i class="bi bi-calendar-week me-2 text-primary"></i>
                      ตารางสอน — {{ scheduleModal()!.first_name }} {{ scheduleModal()!.last_name }}
                    </h5>
                    <button class="btn-close" (click)="scheduleModal.set(null)"></button>
                  </div>
                  <div class="modal-body">
                    @if (schedLoading()) {
                      <div class="text-center p-5"><div class="spinner-border text-primary"></div></div>
                    } @else if (schedData().length === 0) {
                      <div class="text-center py-5 text-muted">
                        <i class="bi bi-calendar-x display-4"></i>
                        <p class="mt-3">ยังไม่มีตารางสอน</p>
                      </div>
                    } @else {
                      <table class="table">
                        <thead><tr><th>รหัสวิชา</th><th>ชื่อวิชา</th><th>วัน</th><th>เวลา</th><th>ห้อง</th><th>หน่วยกิต</th></tr></thead>
                        <tbody>
                          @for (s of schedData(); track s.schedule_id) {
                            <tr>
                              <td><code class="text-primary">{{ s.course_code }}</code></td>
                              <td><strong>{{ s.course_title || s.title }}</strong></td>
                              <td>
                                <span class="badge bg-light text-dark border">{{ dayTh(s.day_of_week) }}</span>
                              </td>
                              <td>{{ s.start_time | slice:0:5 }}–{{ s.end_time | slice:0:5 }}</td>
                              <td>{{ s.room_number || '-' }}</td>
                              <td>{{ s.credits }} หน่วยกิต</td>
                            </tr>
                          }
                        </tbody>
                      </table>
                      <div class="mt-3 p-3 bg-light rounded d-flex gap-4">
                        <div><strong>{{ schedData().length }}</strong> <span class="text-muted">รายวิชา</span></div>
                        <div><strong>{{ totalCredits() }}</strong> <span class="text-muted">หน่วยกิตรวม</span></div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Create/Edit Modal -->
          @if (showForm()) {
            <div class="modal-backdrop show" (click)="showForm.set(false)"></div>
            <div class="modal show d-block">
              <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title">{{ editingProf() ? 'แก้ไขข้อมูลอาจารย์' : 'เพิ่มอาจารย์ใหม่' }}</h5>
                    <button class="btn-close" (click)="showForm.set(false)"></button>
                  </div>
                  <div class="modal-body">
                    @if (!editingProf()) {
                      <div class="mb-3">
                        <label class="form-label">Username *</label>
                        <input class="form-control" [(ngModel)]="form.username" placeholder="username">
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Password *</label>
                        <input type="password" class="form-control" [(ngModel)]="form.password">
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Email *</label>
                        <input type="email" class="form-control" [(ngModel)]="form.email" placeholder="email@example.com">
                      </div>
                    }
                    <div class="row g-2 mb-3">
                      <div class="col">
                        <label class="form-label">ชื่อ *</label>
                        <input class="form-control" [(ngModel)]="form.first_name">
                      </div>
                      <div class="col">
                        <label class="form-label">นามสกุล *</label>
                        <input class="form-control" [(ngModel)]="form.last_name">
                      </div>
                    </div>
                    <div class="mb-3">
                      <label class="form-label">แผนก</label>
                      <select class="form-select" [(ngModel)]="form.dept_id">
                        <option [value]="null">-- ไม่ระบุ --</option>
                        <option *ngFor="let d of depts()" [value]="d.dept_id">{{ d.name }}</option>
                      </select>
                    </div>
                    @if (editingProf()) {
                      <div class="mb-3">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-control" [(ngModel)]="form.email">
                      </div>
                    }
                    <div class="alert alert-danger py-2 small" *ngIf="formErr()">{{ formErr() }}</div>
                  </div>
                  <div class="modal-footer">
                    <button class="btn btn-secondary" (click)="showForm.set(false)">ยกเลิก</button>
                    <button class="btn btn-primary" (click)="saveForm()" [disabled]="saving()">
                      <span class="spinner-border spinner-border-sm me-1" *ngIf="saving()"></span>
                      {{ editingProf() ? 'บันทึก' : 'เพิ่ม' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Reset Password Modal -->
          @if (showReset()) {
            <div class="modal-backdrop show" (click)="showReset.set(false)"></div>
            <div class="modal show d-block">
              <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title">รีเซ็ตรหัสผ่าน — {{ resetTarget()?.first_name }} {{ resetTarget()?.last_name }}</h5>
                    <button class="btn-close" (click)="showReset.set(false)"></button>
                  </div>
                  <div class="modal-body">
                    <div class="mb-3">
                      <label class="form-label">รหัสผ่านใหม่ *</label>
                      <input type="password" class="form-control" [(ngModel)]="newPw" placeholder="อย่างน้อย 6 ตัว">
                    </div>
                    <div class="alert alert-danger py-2 small" *ngIf="formErr()">{{ formErr() }}</div>
                  </div>
                  <div class="modal-footer">
                    <button class="btn btn-secondary" (click)="showReset.set(false)">ยกเลิก</button>
                    <button class="btn btn-primary" (click)="doReset()" [disabled]="saving()">รีเซ็ต</button>
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
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: #f0f4ff; }
    .search-box { position:relative; }
    .search-box i { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#94a3b8; z-index:1; }
    .search-box .form-control { padding-left:36px; }
    .loading-overlay { display:flex; justify-content:center; padding:60px; }
    .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:1040; }
    .modal { z-index:1050; }
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
    if (!confirm(`ลบอาจารย์ "${p.first_name} ${p.last_name}"?`)) return;
    this.api.deleteUser(p.user_id).subscribe({ next: () => this.load() });
  }

  openReset(p: any) { this.resetTarget.set(p); this.newPw = ''; this.formErr.set(''); this.showReset.set(true); }

  doReset() {
    if (!this.newPw || this.newPw.length < 6) { this.formErr.set('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return; }
    this.saving.set(true);
    this.api.adminResetPassword(this.resetTarget().user_id, this.newPw).subscribe({
      next: () => { this.showReset.set(false); this.saving.set(false); alert('รีเซ็ตรหัสผ่านเรียบร้อย'); },
      error: (e: any) => { this.formErr.set(e.error?.message || 'เกิดข้อผิดพลาด'); this.saving.set(false); },
    });
  }
}
