import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { AdminApiService } from '../../core/services/admin-api.service';

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
            <div class="search-box" style="max-width:320px;flex:1">
              <i class="bi bi-search"></i>
              <input type="text" class="form-control" [(ngModel)]="search"
                     (ngModelChange)="load()" placeholder="ค้นหาชื่อ, email...">
            </div>
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
                  <tr *ngFor="let p of professors()" class="stagger-item">
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <div class="avatar-sm green">{{ p.first_name?.[0] }}{{ p.last_name?.[0] }}</div>
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
                    <td>
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
                        <input type="password" class="form-control" [(ngModel)]="form.password" placeholder="รหัสผ่าน">
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Email *</label>
                        <input type="email" class="form-control" [(ngModel)]="form.email" placeholder="email@example.com">
                      </div>
                    }
                    <div class="row g-2 mb-3">
                      <div class="col"><label class="form-label">ชื่อ *</label>
                        <input class="form-control" [(ngModel)]="form.first_name"></div>
                      <div class="col"><label class="form-label">นามสกุล *</label>
                        <input class="form-control" [(ngModel)]="form.last_name"></div>
                    </div>
                    <div class="mb-3">
                      <label class="form-label">แผนก</label>
                      <select class="form-select" [(ngModel)]="form.dept_id">
                        <option [value]="null">-- ไม่ระบุ --</option>
                        <option *ngFor="let d of depts()" [value]="d.dept_id">{{ d.name }}</option>
                      </select>
                    </div>
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
          @if (resetModal()) {
            <div class="modal-backdrop show" (click)="resetModal.set(null)"></div>
            <div class="modal show d-block">
              <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
                <div class="modal-content">
                  <div class="modal-header"><h5 class="modal-title">รีเซ็ตรหัสผ่าน</h5>
                    <button class="btn-close" (click)="resetModal.set(null)"></button></div>
                  <div class="modal-body">
                    <p class="text-muted small mb-3">รีเซ็ตรหัสผ่านของ <strong>{{ resetModal()?.first_name }} {{ resetModal()?.last_name }}</strong></p>
                    <input type="password" class="form-control" [(ngModel)]="newPassword" placeholder="รหัสผ่านใหม่">
                    <div class="alert alert-danger py-2 small mt-2" *ngIf="resetErr()">{{ resetErr() }}</div>
                  </div>
                  <div class="modal-footer">
                    <button class="btn btn-secondary" (click)="resetModal.set(null)">ยกเลิก</button>
                    <button class="btn btn-warning" (click)="doReset()">รีเซ็ต</button>
                  </div>
                </div>
              </div>
            </div>
          }

        </div>
      </div>
    </div>
  `,
  styles: [
    `.avatar-sm{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#d1fae5,#a7f3d0);color:#065f46;font-weight:700;font-size:.72rem;display:flex;align-items:center;justify-content:center;flex-shrink:0}`,
    `.modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1040}.modal{z-index:1050}`
  ]
})
export class AdminProfessorsComponent implements OnInit {
  loading = signal(true);
  professors = signal<any[]>([]);
  depts = signal<any[]>([]);
  search = '';
  showForm = signal(false);
  editingProf = signal<any>(null);
  saving = signal(false);
  formErr = signal('');
  resetModal = signal<any>(null);
  newPassword = '';
  resetErr = signal('');
  form: any = {};

  constructor(private api: AdminApiService) {}

  ngOnInit() {
    this.load();
    this.api.getDepartments().subscribe(r => { if (r.data) this.depts.set(r.data as any[]); });
  }

  load() {
    this.loading.set(true);
    this.api.getProfessors(1, 50, this.search).subscribe({
      next: res => { if (res.data) this.professors.set((res.data as any).data ?? res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreate() {
    this.editingProf.set(null);
    this.form = { username: '', password: '', email: '', first_name: '', last_name: '', dept_id: null, role_name: 'Professor' };
    this.formErr.set('');
    this.showForm.set(true);
  }

  openEdit(p: any) {
    this.editingProf.set(p);
    this.form = { first_name: p.first_name, last_name: p.last_name, email: p.email, dept_id: p.dept_id ?? null };
    this.formErr.set('');
    this.showForm.set(true);
  }

  saveForm() {
    this.saving.set(true); this.formErr.set('');
    const obs = this.editingProf()
      ? this.api.updateUser(this.editingProf().user_id, this.form)
      : this.api.createUser({ ...this.form, role_name: 'Professor' });
    obs.subscribe({
      next: () => { this.showForm.set(false); this.load(); this.saving.set(false); },
      error: (e: any) => { this.formErr.set(e.error?.message || 'เกิดข้อผิดพลาด'); this.saving.set(false); }
    });
  }

  deleteProf(p: any) {
    if (!confirm(`ลบอาจารย์ ${p.first_name} ${p.last_name}?`)) return;
    this.api.deleteUser(p.user_id).subscribe({ next: () => this.load() });
  }

  openReset(p: any) { this.resetModal.set(p); this.newPassword = ''; this.resetErr.set(''); }

  doReset() {
    if (!this.newPassword) { this.resetErr.set('กรุณากรอกรหัสผ่านใหม่'); return; }
    this.api.adminResetPassword(this.resetModal().user_id, this.newPassword).subscribe({
      next: () => { this.resetModal.set(null); alert('รีเซ็ตรหัสผ่านสำเร็จ'); },
      error: (e: any) => this.resetErr.set(e.error?.message || 'เกิดข้อผิดพลาด')
    });
  }
}
