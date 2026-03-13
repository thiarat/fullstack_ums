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
        <app-topbar title="จัดการนักศึกษา" subtitle="รายชื่อนักศึกษาทั้งหมด" />
        <div class="page-content">

  @if (resetRequests().length > 0) {
    <div class="alert-card" (click)="showResetPanel = !showResetPanel" style="cursor:pointer">
      <i class="bi bi-bell-fill text-warning"></i>
      <strong>มีคำขอรีเซ็ตรหัสผ่าน {{ resetRequests().length }} รายการ</strong>
      <span class="badge bg-danger ms-2">{{ resetRequests().length }}</span>
      <i class="bi" [class.bi-chevron-down]="!showResetPanel" [class.bi-chevron-up]="showResetPanel" style="margin-left:auto"></i>
    </div>
    @if (showResetPanel) {
      <div class="card mb-4"><div class="card-body p-0">
        <table class="data-table">
          <thead><tr><th>ชื่อ</th><th>Username</th><th>Role</th><th>เวลาส่ง</th><th>การดำเนินการ</th></tr></thead>
          <tbody>
            @for (r of resetRequests(); track r.request_id) {
              <tr>
                <td>{{ r.first_name }} {{ r.last_name }}</td>
                <td><code>{{ r.username }}</code></td>
                <td><span class="badge" [class]="r.role_name === 'Student' ? 'bg-info' : 'bg-primary'">{{ r.role_name }}</span></td>
                <td>{{ r.created_at | date:'dd/MM/yy HH:mm' }}</td>
                <td>
                  <div class="d-flex gap-2 align-items-center">
                    <input type="password" [(ngModel)]="r._newPassword" placeholder="รหัสใหม่" class="form-control form-control-sm" style="width:140px">
                    <button class="btn btn-sm btn-success" (click)="approveReset(r)" [disabled]="!r._newPassword">อนุมัติ</button>
                    <button class="btn btn-sm btn-danger" (click)="rejectReset(r)">ปฏิเสธ</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div></div>
    }
  }

  <!-- Toolbar — style เดียวกับ professors -->
  <div class="d-flex gap-2 mb-3 flex-wrap">
    <div class="search-box" style="max-width:320px;flex:1">
      <i class="bi bi-search"></i>
      <input type="text" class="form-control" [(ngModel)]="searchQuery"
             (ngModelChange)="onSearch()" placeholder="ค้นหาชื่อ, รหัส, อีเมล...">
    </div>
    <select class="form-select" style="max-width:160px" [(ngModel)]="statusFilter" (ngModelChange)="onFilterChange()">
      <option value="">ทุกสถานะ</option>
      <option value="true">Active</option>
      <option value="false">Inactive</option>
    </select>
    <button class="btn btn-primary ms-auto" (click)="openCreateModal()">
      <i class="bi bi-person-plus me-1"></i> เพิ่มนักศึกษา
    </button>
  </div>

  @if (loading()) {
    <div class="loading-overlay"><div class="spinner-border text-primary"></div></div>
  } @else {
    <div class="card">
      <div class="table-responsive">
        <table class="table mb-0">
          <thead><tr><th>นักศึกษา</th><th>รหัส / อีเมล</th><th>วันที่ลงทะเบียน</th><th class="text-center">จำนวนรายวิชาที่ลงทะเบียน</th><th>สถานะ</th><th></th></tr></thead>
          <tbody>
            @for (s of students(); track s.student_id) {
              <tr class="clickable-row stagger-item" (click)="viewSchedule(s)" title="คลิกดูตารางเรียน">
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <strong>{{ s.first_name }} {{ s.last_name }}</strong>
                  </div>
                </td>
                <td>
                  <code style="font-size:.82rem">{{ s.username }}</code>
                  <br><small class="text-muted">{{ s.email }}</small>
                </td>
                <td>{{ s.enrollment_date | date:'dd/MM/yyyy' }}</td>
                <td class="text-center">
                  <span class="badge bg-info text-dark">{{ s.enrollment_count ?? 0 }} วิชา</span>
                </td>
                <td>
                  <span class="badge" [class]="s.is_active ? 'bg-success' : 'bg-secondary'">
                    {{ s.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td (click)="$event.stopPropagation()">
                  <div class="d-flex gap-1">
                    <button class="btn btn-icon btn-sm btn-outline-primary" title="แก้ไข" (click)="openEditModal(s)">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-icon btn-sm btn-outline-warning" title="รีเซ็ตรหัส" (click)="openResetPasswordModal(s)">
                      <i class="bi bi-key"></i>
                    </button>
                    <button class="btn btn-icon btn-sm" [class]="s.is_active ? 'btn-outline-secondary' : 'btn-outline-success'"
                      title="{{ s.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน' }}" (click)="toggleStatus(s)">
                      <i class="bi" [class]="s.is_active ? 'bi-toggle-on' : 'bi-toggle-off'"></i>
                    </button>
                    <button class="btn btn-icon btn-sm btn-outline-danger" title="ลบ" (click)="confirmDelete(s)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <div class="empty-state" *ngIf="!loading() && !students().length">
        <i class="bi bi-person-x"></i><p>ไม่พบนักศึกษา</p>
      </div>
    </div>

    <div class="d-flex justify-content-between align-items-center mt-3">
      <span class="text-muted small">แสดง {{ students().length }} จาก {{ total() }} รายการ</span>
      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-outline-secondary" [disabled]="currentPage() === 1" (click)="goPage(currentPage()-1)">‹</button>
        @for (p of pages(); track p) {
          <button class="btn btn-sm" [class]="p === currentPage() ? 'btn-primary' : 'btn-outline-secondary'" (click)="goPage(p)">{{ p }}</button>
        }
        <button class="btn btn-sm btn-outline-secondary" [disabled]="currentPage() === totalPages()" (click)="goPage(currentPage()+1)">›</button>
      </div>
    </div>
  }
</div>

<!-- Schedule Popup -->
@if (scheduleModal()) {
  <div class="modal-backdrop show" (click)="scheduleModal.set(null)"></div>
  <div class="modal show d-block">
    <div class="modal-dialog modal-dialog-centered modal-lg" (click)="$event.stopPropagation()">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">ตารางเรียน — {{ scheduleModal()!.first_name }} {{ scheduleModal()!.last_name }}</h5>
          <button class="btn-close" (click)="scheduleModal.set(null)"></button>
        </div>
        <div class="modal-body">
          @if (scheduleLoading()) {
            <div class="text-center p-4"><div class="spinner-border text-primary"></div></div>
          } @else if (scheduleData().length === 0) {
            <p class="text-center text-muted py-4">ไม่มีตารางเรียน</p>
          } @else {
            <table class="table">
              <thead><tr><th>วิชา</th><th>วัน</th><th>เวลา</th><th>ห้อง</th><th>อาจารย์</th></tr></thead>
              <tbody>
                @for (sc of scheduleData(); track sc.schedule_id) {
                  <tr>
                    <td><strong>{{ sc.course_code }}</strong><br><small class="text-muted">{{ sc.course_title }}</small></td>
                    <td>{{ sc.day_of_week }}</td>
                    <td>{{ sc.start_time | slice:0:5 }}–{{ sc.end_time | slice:0:5 }}</td>
                    <td>{{ sc.room_number }}</td>
                    <td>{{ sc.professor_name }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      </div>
    </div>
  </div>
}

<!-- Create/Edit User Modal — layout เดียวกับ professors (ไม่มีแผนก) -->
@if (userModal()) {
  <div class="modal-backdrop show" (click)="userModal.set(null)"></div>
  <div class="modal show d-block">
    <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ editingUser()?.user_id ? 'แก้ไขข้อมูลนักศึกษา' : 'เพิ่มนักศึกษาใหม่' }}</h5>
          <button class="btn-close" (click)="userModal.set(null)"></button>
        </div>
        <div class="modal-body">
          @if (!editingUser()?.user_id) {
            <div class="mb-3">
              <label class="form-label">รหัสนักศึกษา (Username) *</label>
              <input class="form-control" [(ngModel)]="form.username" placeholder="เช่น 1166109001051">
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
          @if (editingUser()?.user_id) {
            <div class="mb-3">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" [(ngModel)]="form.email">
            </div>
          }
          <div class="alert alert-danger py-2 small" *ngIf="formError()">{{ formError() }}</div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="userModal.set(null)">ยกเลิก</button>
          <button class="btn btn-primary" (click)="saveUser()" [disabled]="saving()">
            <span class="spinner-border spinner-border-sm me-1" *ngIf="saving()"></span>
            {{ editingUser()?.user_id ? 'บันทึก' : 'เพิ่ม' }}
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
        <div class="modal-header">
          <h5 class="modal-title">รีเซ็ตรหัสผ่าน — {{ resetModal()!.first_name }} {{ resetModal()!.last_name }}</h5>
          <button class="btn-close" (click)="resetModal.set(null)"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">รหัสผ่านใหม่ *</label>
            <input type="password" class="form-control" [(ngModel)]="newPassword" placeholder="อย่างน้อย 6 ตัว">
          </div>
          <div class="alert alert-danger py-2 small" *ngIf="formError()">{{ formError() }}</div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="resetModal.set(null)">ยกเลิก</button>
          <button class="btn btn-primary" (click)="doResetPassword()" [disabled]="saving()">รีเซ็ต</button>
        </div>
      </div>
    </div>
  </div>
}
      </div>
    </div>
  `,
  styles: [`
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: #f0f4ff; }
    .alert-card { background:#fff8e1; border:1px solid #ffc107; border-radius:10px; padding:14px 20px; margin-bottom:16px; display:flex; align-items:center; gap:10px; }
    .search-box { position:relative; }
    .search-box i { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#94a3b8; z-index:1; }
    .search-box .form-control { padding-left:36px; }
    .loading-overlay { display:flex; justify-content:center; padding:60px; }
    .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:1040; }
    .modal { z-index:1050; }
  `]
})
export class AdminStudentsComponent implements OnInit {
  private api = inject(AdminApiService);

  students    = signal<any[]>([]);
  loading     = signal(true);
  total       = signal(0);
  currentPage = signal(1);
  searchQuery = '';
  statusFilter = '';
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
    return Array.from({ length: Math.min(t, 5) }, (_, i) => i + 1);
  });

  ngOnInit() { this.loadStudents(); this.loadResetRequests(); }

  loadStudents() {
    this.loading.set(true);
    const params: any = { page: this.currentPage(), limit: 20, search: this.searchQuery };
    if (this.statusFilter !== '') params.is_active = this.statusFilter;
    this.api.getStudents(params).subscribe({
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

  onFilterChange() { this.currentPage.set(1); this.loadStudents(); }

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

  rejectReset(r: any) { this.api.rejectPasswordReset(r.request_id).subscribe({ next: () => this.loadResetRequests() }); }
}
