import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page-container">
  <div class="page-header">
    <div>
      <h1 class="page-title">จัดการนักศึกษา</h1>
      <p class="page-subtitle">{{ total() }} คนในระบบ</p>
    </div>
    <button class="btn-primary" (click)="openCreateModal()">
      <i class="bi bi-person-plus"></i> เพิ่มผู้ใช้ใหม่
    </button>
  </div>

  <!-- Password Reset Requests Badge -->
  @if (resetRequests().length > 0) {
    <div class="alert-card" (click)="showResetPanel = !showResetPanel" style="cursor:pointer">
      <i class="bi bi-bell-fill text-warning"></i>
      <strong>มีคำขอรีเซ็ตรหัสผ่าน {{ resetRequests().length }} รายการ</strong>
      <span class="badge bg-danger ms-2">{{ resetRequests().length }}</span>
      <i class="bi" [class.bi-chevron-down]="!showResetPanel" [class.bi-chevron-up]="showResetPanel" style="margin-left:auto"></i>
    </div>
    @if (showResetPanel) {
      <div class="card mb-4">
        <div class="card-body p-0">
          <table class="data-table">
            <thead><tr>
              <th>ชื่อ</th><th>Username</th><th>Role</th><th>เวลาส่ง</th><th>การดำเนินการ</th>
            </tr></thead>
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
                      <button class="btn-sm btn-success" (click)="approveReset(r)" [disabled]="!r._newPassword">อนุมัติ</button>
                      <button class="btn-sm btn-danger" (click)="rejectReset(r)">ปฏิเสธ</button>
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

  <!-- Search Bar -->
  <div class="card mb-4">
    <div class="card-body">
      <div class="search-box">
        <i class="bi bi-search"></i>
        <input [(ngModel)]="searchQuery" (ngModelChange)="onSearch()" placeholder="ค้นหาชื่อ, รหัส, อีเมล..." class="search-input">
      </div>
    </div>
  </div>

  <!-- Table -->
  @if (loading()) {
    <div class="loading-overlay"><div class="spinner-border text-primary"></div></div>
  } @else {
    <div class="card">
      <div class="card-body p-0">
        <table class="data-table">
          <thead><tr>
            <th>นักศึกษา</th><th>รหัส / อีเมล</th><th>วันที่ลงทะเบียน</th><th>สถานะ</th><th>การดำเนินการ</th>
          </tr></thead>
          <tbody>
            @for (s of students(); track s.student_id) {
              <tr class="clickable-row" (click)="viewSchedule(s)" title="คลิกดูตารางเรียน">
                <td>
                  <div class="user-info">
                    <div class="avatar">{{ s.first_name[0] }}</div>
                    <div>
                      <div class="fw-600">{{ s.first_name }} {{ s.last_name }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div><code>{{ s.username }}</code></div>
                  <div class="text-muted small">{{ s.email }}</div>
                </td>
                <td>{{ s.enrollment_date | date:'dd MMM yyyy' }}</td>
                <td>
                  <span class="badge" [class]="s.is_active ? 'bg-success' : 'bg-secondary'">
                    {{ s.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td (click)="$event.stopPropagation()">
                  <div class="d-flex gap-2">
                    <button class="btn-sm btn-outline" (click)="openEditModal(s)"><i class="bi bi-pencil"></i></button>
                    <button class="btn-sm btn-outline" (click)="openResetPasswordModal(s)"><i class="bi bi-key"></i></button>
                    <button class="btn-sm" [class]="s.is_active ? 'btn-warning' : 'btn-success'"
                      (click)="toggleStatus(s)">{{ s.is_active ? 'ปิด' : 'เปิด' }}</button>
                    <button class="btn-sm btn-danger" (click)="confirmDelete(s)"><i class="bi bi-trash"></i></button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination-bar">
      <span class="text-muted small">แสดง {{ students().length }} จาก {{ total() }} รายการ</span>
      <div class="d-flex gap-2">
        <button class="btn-sm btn-outline" [disabled]="currentPage() === 1" (click)="goPage(currentPage()-1)">‹</button>
        @for (p of pages(); track p) {
          <button class="btn-sm" [class]="p === currentPage() ? 'btn-primary' : 'btn-outline'" (click)="goPage(p)">{{ p }}</button>
        }
        <button class="btn-sm btn-outline" [disabled]="currentPage() === totalPages()" (click)="goPage(currentPage()+1)">›</button>
      </div>
    </div>
  }
</div>

<!-- ── SCHEDULE POPUP ────────────────────────────────────────── -->
@if (scheduleModal()) {
  <div class="modal-backdrop" (click)="scheduleModal.set(null)">
    <div class="modal-box" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h5>ตารางเรียน — {{ scheduleModal()!.first_name }} {{ scheduleModal()!.last_name }}</h5>
        <button class="btn-close" (click)="scheduleModal.set(null)"></button>
      </div>
      <div class="modal-body">
        @if (scheduleLoading()) {
          <div class="text-center p-4"><div class="spinner-border text-primary"></div></div>
        } @else if (scheduleData().length === 0) {
          <p class="text-center text-muted py-4">ไม่มีตารางเรียน</p>
        } @else {
          <table class="data-table">
            <thead><tr><th>วิชา</th><th>วัน</th><th>เวลา</th><th>ห้อง</th><th>อาจารย์</th></tr></thead>
            <tbody>
              @for (sc of scheduleData(); track sc.schedule_id) {
                <tr>
                  <td><strong>{{ sc.course_code }}</strong><br><small>{{ sc.course_title }}</small></td>
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
}

<!-- ── CREATE / EDIT USER MODAL ─────────────────────────────── -->
@if (userModal()) {
  <div class="modal-backdrop" (click)="userModal.set(null)">
    <div class="modal-box" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h5>{{ editingUser()?.user_id ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่' }}</h5>
        <button class="btn-close" (click)="userModal.set(null)"></button>
      </div>
      <div class="modal-body">
        <div class="form-grid">
          @if (!editingUser()?.user_id) {
            <div class="form-group">
              <label>Username *</label>
              <input [(ngModel)]="form.username" class="form-control" placeholder="เช่น 6601234567891">
            </div>
            <div class="form-group">
              <label>Password *</label>
              <input type="password" [(ngModel)]="form.password" class="form-control">
            </div>
            <div class="form-group">
              <label>Role *</label>
              <select [(ngModel)]="form.role_name" class="form-control">
                <option value="Student">Student</option>
                <option value="Professor">Professor</option>
              </select>
            </div>
          }
          <div class="form-group">
            <label>ชื่อ *</label>
            <input [(ngModel)]="form.first_name" class="form-control">
          </div>
          <div class="form-group">
            <label>นามสกุล *</label>
            <input [(ngModel)]="form.last_name" class="form-control">
          </div>
          <div class="form-group full-width">
            <label>อีเมล *</label>
            <input [(ngModel)]="form.email" class="form-control" type="email">
          </div>
        </div>
        @if (formError()) {
          <div class="alert alert-danger mt-2">{{ formError() }}</div>
        }
      </div>
      <div class="modal-footer">
        <button class="btn-outline" (click)="userModal.set(null)">ยกเลิก</button>
        <button class="btn-primary" (click)="saveUser()" [disabled]="saving()">
          {{ saving() ? 'กำลังบันทึก...' : 'บันทึก' }}
        </button>
      </div>
    </div>
  </div>
}

<!-- ── RESET PASSWORD MODAL ──────────────────────────────────── -->
@if (resetModal()) {
  <div class="modal-backdrop" (click)="resetModal.set(null)">
    <div class="modal-box small-modal" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h5>รีเซ็ตรหัสผ่าน — {{ resetModal()!.first_name }} {{ resetModal()!.last_name }}</h5>
        <button class="btn-close" (click)="resetModal.set(null)"></button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>รหัสผ่านใหม่ *</label>
          <input type="password" [(ngModel)]="newPassword" class="form-control" placeholder="อย่างน้อย 6 ตัว">
        </div>
        @if (formError()) { <div class="alert alert-danger">{{ formError() }}</div> }
      </div>
      <div class="modal-footer">
        <button class="btn-outline" (click)="resetModal.set(null)">ยกเลิก</button>
        <button class="btn-primary" (click)="doResetPassword()" [disabled]="saving()">รีเซ็ต</button>
      </div>
    </div>
  </div>
}
  `,
  styles: [`
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: #f0f4ff; }
    .alert-card { background:#fff8e1; border:1px solid #ffc107; border-radius:10px; padding:14px 20px; margin-bottom:16px; display:flex; align-items:center; gap:10px; }
    .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:1000; display:flex; align-items:center; justify-content:center; }
    .modal-box { background:#fff; border-radius:16px; width:560px; max-width:95vw; max-height:85vh; overflow-y:auto; box-shadow:0 20px 60px rgba(0,0,0,.3); }
    .small-modal { width:400px; }
    .modal-header { display:flex; align-items:center; justify-content:space-between; padding:20px 24px 0; }
    .modal-header h5 { font-weight:700; margin:0; }
    .modal-body { padding:20px 24px; }
    .modal-footer { padding:16px 24px; display:flex; justify-content:flex-end; gap:12px; border-top:1px solid #f1f5f9; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .form-grid .full-width { grid-column: 1 / -1; }
    .form-group label { font-size:.85rem; font-weight:600; color:#64748b; display:block; margin-bottom:6px; }
    .user-info { display:flex; align-items:center; gap:12px; }
    .avatar { width:38px; height:38px; border-radius:50%; background:linear-gradient(135deg,#3b82f6,#6366f1); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; flex-shrink:0; }
    .fw-600 { font-weight:600; }
    .btn-sm { padding:5px 12px; border-radius:8px; font-size:.82rem; font-weight:600; cursor:pointer; border:none; }
    .btn-outline { background:#fff; border:1px solid #e2e8f0; color:#475569; }
    .btn-success { background:#10b981; color:#fff; }
    .btn-danger { background:#ef4444; color:#fff; }
    .btn-warning { background:#f59e0b; color:#fff; }
    .pagination-bar { display:flex; align-items:center; justify-content:space-between; margin-top:16px; }
    .search-box { position:relative; }
    .search-box i { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#94a3b8; }
    .search-input { width:100%; padding:10px 10px 10px 40px; border:1px solid #e2e8f0; border-radius:10px; font-size:.9rem; outline:none; }
    .search-input:focus { border-color:#3b82f6; }
    .data-table { width:100%; border-collapse:collapse; }
    .data-table th { padding:12px 16px; background:#f8fafc; font-size:.8rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.5px; }
    .data-table td { padding:12px 16px; border-top:1px solid #f1f5f9; font-size:.9rem; }
    .loading-overlay { display:flex; justify-content:center; padding:60px; }
  `]
})
export class StudentsComponent implements OnInit {
  private api = inject(AdminApiService);

  students    = signal<any[]>([]);
  loading     = signal(true);
  total       = signal(0);
  currentPage = signal(1);
  searchQuery = '';
  private searchTimer: any;

  scheduleModal  = signal<any>(null);
  scheduleData   = signal<any[]>([]);
  scheduleLoading= signal(false);

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

  ngOnInit() {
    this.loadStudents();
    this.loadResetRequests();
  }

  loadStudents() {
    this.loading.set(true);
    this.api.getStudents({ page: this.currentPage(), limit: 20, search: this.searchQuery }).subscribe({
      next: (r: any) => { this.students.set(r.data.data); this.total.set(r.data.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  loadResetRequests() {
    this.api.getPasswordResetRequests().subscribe({
      next: (r: any) => this.resetRequests.set(r.data),
      error: () => {},
    });
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.currentPage.set(1); this.loadStudents(); }, 400);
  }

  goPage(p: number) { this.currentPage.set(p); this.loadStudents(); }

  // ── Schedule popup ──
  viewSchedule(s: any) {
    this.scheduleModal.set(s);
    this.scheduleData.set([]);
    this.scheduleLoading.set(true);
    this.api.getStudentSchedule(s.student_id).subscribe({
      next: (r: any) => { this.scheduleData.set(r.data); this.scheduleLoading.set(false); },
      error: () => this.scheduleLoading.set(false),
    });
  }

  // ── User CRUD ──
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
    this.saving.set(true);
    this.formError.set('');
    const isEdit = !!this.editingUser()?.user_id;
    const call = isEdit
      ? this.api.updateUser(this.editingUser().user_id, this.form)
      : this.api.createUser(this.form);

    call.subscribe({
      next: () => { this.userModal.set(null); this.saving.set(false); this.loadStudents(); },
      error: (e: any) => { this.formError.set(e.error?.message || 'เกิดข้อผิดพลาด'); this.saving.set(false); },
    });
  }

  confirmDelete(s: any) {
    if (!confirm(`ลบผู้ใช้ "${s.first_name} ${s.last_name}" ออกจากระบบ?`)) return;
    this.api.deleteUser(s.user_id).subscribe({ next: () => this.loadStudents() });
  }

  toggleStatus(s: any) {
    this.api.updateStudentStatus(s.student_id, !s.is_active).subscribe({ next: () => this.loadStudents() });
  }

  // ── Reset Password ──
  openResetPasswordModal(s: any) {
    this.resetModal.set(s);
    this.newPassword = '';
    this.formError.set('');
  }

  doResetPassword() {
    if (!this.newPassword || this.newPassword.length < 6) {
      this.formError.set('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return;
    }
    this.saving.set(true);
    this.api.adminResetPassword(this.resetModal().user_id, this.newPassword).subscribe({
      next: () => { this.resetModal.set(null); this.saving.set(false); alert('รีเซ็ตรหัสผ่านเรียบร้อย'); },
      error: (e: any) => { this.formError.set(e.error?.message || 'เกิดข้อผิดพลาด'); this.saving.set(false); },
    });
  }

  approveReset(r: any) {
    if (!r._newPassword) return;
    this.api.approvePasswordReset(r.request_id, r._newPassword).subscribe({
      next: () => { alert('อนุมัติเรียบร้อย'); this.loadResetRequests(); },
    });
  }

  rejectReset(r: any) {
    this.api.rejectPasswordReset(r.request_id).subscribe({
      next: () => this.loadResetRequests(),
    });
  }
}
