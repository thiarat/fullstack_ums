import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { FormsModule } from '@angular/forms';
import { ProfessorApiService } from '../../core/services/professor-api.service';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAY_TH: Record<string,string> = {
  Monday:'จันทร์',Tuesday:'อังคาร',Wednesday:'พุธ',
  Thursday:'พฤหัส',Friday:'ศุกร์',Saturday:'เสาร์',Sunday:'อาทิตย์'
};

// Time slots available for selection
const TIME_SLOTS = [
  { key: 'morning',   label: 'ช่วงเช้า',   sub: '8:00 ถึง 12:00',  start: '08:00', end: '12:00' },
  { key: 'afternoon', label: 'ช่วงบ่าย',  sub: '13:00 ถึง 17:00', start: '13:00', end: '17:00' },
];

@Component({
  selector: 'app-professor-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="main-content">
        <app-topbar title="รายวิชาของฉัน" subtitle="จัดการรายวิชาและตารางสอน" />
        <div class="page-content">
  <div class="d-flex gap-2 mb-4 flex-wrap align-items-center">
    <div>
      <h4 class="mb-0 fw-700" style="color:#1e293b">รายวิชาของฉัน</h4>
      <p class="text-muted small mb-0">{{ courses().length }} วิชาที่สอน</p>
    </div>
    <button class="btn btn-primary ms-auto" (click)="openAddSchedule()">
      <i class="bi bi-plus-circle me-1"></i> เพิ่มตารางสอน
    </button>
  </div>

  @if (loading()) {
    <div class="loading-center"><div class="spinner-border text-primary"></div></div>
  } @else if (courses().length === 0) {
    <div class="empty-state">
      <i class="bi bi-journal-x display-3 text-muted"></i>
      <p class="text-muted mt-3">ยังไม่มีรายวิชา</p>
    </div>
  } @else {
    <div class="courses-grid">
      @for (c of courses(); track c.schedule_id) {
        <div class="course-card">
          <div class="course-header">
            <div class="course-code">{{ c.course_code }}</div>
            <div class="schedule-actions">
              <button class="icon-btn" title="แก้ไขตารางสอน" (click)="openEditSchedule(c)">
                <i class="bi bi-pencil-square"></i>
              </button>
              <button class="icon-btn danger" title="ลบตารางสอน" (click)="deleteSchedule(c)">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
          <h3 class="course-title">{{ c.title }}</h3>
          <div class="course-meta">
            <span><i class="bi bi-people"></i> {{ c.enrolled_students }} นักศึกษา</span>
            <span><i class="bi bi-award"></i> {{ c.credits }} หน่วยกิต</span>
          </div>
          @if (c.day_of_week) {
            <div class="schedule-chip">
              <i class="bi bi-clock"></i>
              {{ dayTh(c.day_of_week) }} {{ c.start_time | slice:0:5 }}–{{ c.end_time | slice:0:5 }}
              @if (c.room_number) { · ห้อง {{ c.room_number }} }
            </div>
          }
          <button class="btn-outline-full mt-3" (click)="viewStudents(c)">
            <i class="bi bi-person-lines-fill"></i> ดูรายชื่อนักศึกษา
          </button>
        </div>
      }
    </div>
  }
</div>

<!-- ── STUDENTS MODAL ──────────────────────────────────────── -->
@if (studentsModal()) {
  <div class="modal-backdrop" (click)="studentsModal.set(null)">
    <div class="modal-box large-modal" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h5>{{ selectedCourse()?.course_code }} — รายชื่อนักศึกษา</h5>
        <button class="btn-close" (click)="studentsModal.set(null)"></button>
      </div>
      <div class="modal-body p-0">
        @if (studentsLoading()) {
          <div class="text-center p-5"><div class="spinner-border text-primary"></div></div>
        } @else {
          <table class="data-table">
            <thead><tr><th>ชื่อ-นามสกุล</th><th>รหัสนักศึกษา</th><th>อีเมล</th><th>เกรด</th></tr></thead>
            <tbody>
              @for (s of students(); track s.student_id) {
                <tr>
                  <td>{{ s.first_name }} {{ s.last_name }}</td>
                  <td><code>{{ s.student_code }}</code></td>
                  <td>{{ s.email }}</td>
                  <td>
                    @if (s.grade) {
                      <span class="badge" [class]="gradeColor(s.grade)">{{ s.grade }}</span>
                    } @else {
                      <span class="text-muted">—</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  </div>
}

<!-- ── ADD/EDIT SCHEDULE MODAL ────────────────────────────── -->
@if (scheduleModal()) {
  <div class="modal-backdrop" (click)="scheduleModal.set(null)">
    <div class="modal-box" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h5>{{ editingSchedule()?.schedule_id ? 'แก้ไขตารางสอน' : 'เพิ่มตารางสอน' }}</h5>
        <button class="btn-close" (click)="scheduleModal.set(null)"></button>
      </div>
      <div class="modal-body">
        <div class="form-grid">
          @if (!editingSchedule()?.schedule_id) {
            <div class="form-group full-width">
              <label>วิชา *</label>
              <select [(ngModel)]="schedForm.course_id" class="form-control">
                <option value="">-- เลือกวิชา --</option>
                @for (c of allCourses(); track c.course_id) {
                  <option [value]="c.course_id">{{ c.course_code }} — {{ c.title }}</option>
                }
              </select>
            </div>
          }
          <div class="form-group full-width">
            <label>วัน *</label>
            <select [(ngModel)]="schedForm.day_of_week" class="form-control">
              @for (d of days; track d) { <option [value]="d">{{ dayTh(d) }}</option> }
            </select>
          </div>

          <!-- Time Slot Selector -->
          <div class="form-group full-width">
            <label>เวลาการสอน *</label>
            <div class="time-slot-group">
              @for (slot of timeSlots; track slot.key) {
                <button
                  type="button"
                  class="time-slot-btn"
                  [class.selected]="selectedSlot() === slot.key"
                  (click)="selectSlot(slot)">
                  <div class="slot-label">{{ slot.label }}</div>
                  <div class="slot-time">{{ slot.sub }}</div>
                </button>
              }
            </div>
            @if (!selectedSlot() && formError()) {
              <small class="text-danger mt-1">กรุณาเลือกช่วงเวลา</small>
            }
          </div>

          <div class="form-group full-width">
            <label>ห้อง</label>
            <input [(ngModel)]="schedForm.room_number" class="form-control" placeholder="เช่น A301">
          </div>
        </div>
        @if (formError()) { <div class="alert alert-danger mt-2">{{ formError() }}</div> }
      </div>
      <div class="modal-footer">
        <button class="btn-outline" (click)="scheduleModal.set(null)">ยกเลิก</button>
        <button class="btn-primary" (click)="saveSchedule()" [disabled]="saving()">
          {{ saving() ? 'กำลังบันทึก...' : 'บันทึก' }}
        </button>
      </div>
    </div>
  </div>
}
      </div>
    </div>
  `,
  styles: [`
    .loading-center { display:flex; justify-content:center; padding:80px; }
    .empty-state { text-align:center; padding:80px; }
    .courses-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:20px; }
    .course-card { background:#fff; border-radius:16px; padding:24px; box-shadow:0 2px 12px rgba(0,0,0,.06); border:1px solid #f1f5f9; }
    .course-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
    .course-code { background:#eff6ff; color:#3b82f6; font-weight:800; font-size:.9rem; padding:4px 12px; border-radius:20px; }
    .course-title { font-size:1.05rem; font-weight:700; color:#1e293b; margin:8px 0; }
    .course-meta { display:flex; gap:16px; color:#64748b; font-size:.85rem; margin-bottom:12px; }
    .schedule-chip { background:#f0fdf4; color:#16a34a; padding:6px 12px; border-radius:8px; font-size:.85rem; font-weight:600; display:inline-flex; align-items:center; gap:6px; }
    .schedule-actions { display:flex; gap:6px; }
    .icon-btn { background:none; border:1px solid #e2e8f0; border-radius:8px; padding:5px 8px; cursor:pointer; color:#64748b; }
    .icon-btn:hover { background:#f8fafc; }
    .icon-btn.danger:hover { background:#fee2e2; color:#dc2626; border-color:#fca5a5; }
    .btn-outline-full { width:100%; padding:8px; border:1px solid #e2e8f0; border-radius:10px; background:#fff; cursor:pointer; color:#475569; font-weight:600; font-size:.9rem; display:flex; align-items:center; justify-content:center; gap:8px; }
    .btn-outline-full:hover { background:#f8fafc; }
    .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:1000; display:flex; align-items:center; justify-content:center; }
    .modal-box { background:#fff; border-radius:16px; width:520px; max-width:95vw; max-height:90vh; overflow-y:auto; box-shadow:0 20px 60px rgba(0,0,0,.3); }
    .large-modal { width:700px; }
    .modal-header { display:flex; align-items:center; justify-content:space-between; padding:20px 24px 0; }
    .modal-header h5 { font-weight:700; margin:0; }
    .modal-body { padding:20px 24px; }
    .modal-footer { padding:16px 24px; display:flex; justify-content:flex-end; gap:12px; border-top:1px solid #f1f5f9; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .form-group { display:flex; flex-direction:column; }
    .form-group.full-width { grid-column:1/-1; }
    .form-group label { font-size:.85rem; font-weight:600; color:#64748b; margin-bottom:6px; }
    .data-table { width:100%; border-collapse:collapse; }
    .data-table th { padding:12px 16px; background:#f8fafc; font-size:.8rem; font-weight:700; color:#64748b; }
    .data-table td { padding:12px 16px; border-top:1px solid #f1f5f9; }
    /* Time slot buttons */
    .time-slot-group { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .time-slot-btn {
      padding:16px; border:2px solid #e2e8f0; border-radius:12px;
      background:#fff; cursor:pointer; text-align:center; transition:all .18s;
    }
    .time-slot-btn:hover { border-color:#93c5fd; background:#eff6ff; }
    .time-slot-btn.selected { border-color:#16a34a; background:#f0fdf4; }
    .slot-label { font-weight:700; font-size:.95rem; color:#1e293b; }
    .time-slot-btn.selected .slot-label { color:#15803d; }
    .slot-time { font-size:.8rem; color:#64748b; margin-top:4px; }
    .time-slot-btn.selected .slot-time { color:#16a34a; }
  `]
})
export class ProfCoursesComponent implements OnInit {
  private api = inject(ProfessorApiService);

  courses       = signal<any[]>([]);
  allCourses    = signal<any[]>([]);
  loading       = signal(true);
  students      = signal<any[]>([]);
  studentsLoading = signal(false);
  studentsModal = signal<any>(null);
  selectedCourse = signal<any>(null);
  scheduleModal = signal<any>(null);
  editingSchedule = signal<any>(null);
  saving        = signal(false);
  formError     = signal('');
  selectedSlot  = signal<string>('');
  days = DAYS;
  timeSlots = TIME_SLOTS;
  schedForm: any = {};

  dayTh = (d: string) => DAY_TH[d] || d;

  gradeColor(g: string) {
    if (['A','B+','B'].includes(g)) return 'bg-success';
    if (['C+','C'].includes(g)) return 'bg-warning text-dark';
    if (['D+','D'].includes(g)) return 'bg-secondary';
    return 'bg-danger';
  }

  ngOnInit() { this.loadCourses(); this.loadDeptCourses(); }

  loadCourses() {
    this.api.getMyCourses().subscribe({
      next: (r: any) => { this.courses.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  loadDeptCourses() {
    this.api.getDeptCourses().subscribe({
      next: (r: any) => { this.allCourses.set(r.data ?? []); },
      error: () => {
        this.api.getMyCourses().subscribe((r: any) => this.allCourses.set(r.data ?? []));
      }
    });
  }

  viewStudents(c: any) {
    this.selectedCourse.set(c);
    this.studentsModal.set(true);
    this.studentsLoading.set(true);
    this.api.getCourseStudents(c.schedule_id).subscribe({
      next: (r: any) => { this.students.set(r.data); this.studentsLoading.set(false); },
      error: () => this.studentsLoading.set(false),
    });
  }

  selectSlot(slot: any) {
    this.selectedSlot.set(slot.key);
    this.schedForm.start_time = slot.start;
    this.schedForm.end_time   = slot.end;
  }

  openAddSchedule() {
    this.editingSchedule.set({});
    this.selectedSlot.set('');
    this.schedForm = { day_of_week: 'Monday', start_time: '', end_time: '', room_number: '', course_id: '' };
    this.formError.set('');
    this.scheduleModal.set(true);
  }

  openEditSchedule(c: any) {
    this.editingSchedule.set(c);
    // Detect which slot matches
    const slotKey = c.start_time?.startsWith('08') ? 'morning'
                  : c.start_time?.startsWith('13') ? 'afternoon' : '';
    this.selectedSlot.set(slotKey);
    this.schedForm = {
      day_of_week: c.day_of_week || 'Monday',
      start_time: c.start_time ? c.start_time.slice(0,5) : '',
      end_time: c.end_time ? c.end_time.slice(0,5) : '',
      room_number: c.room_number || '',
    };
    this.formError.set('');
    this.scheduleModal.set(true);
  }

  saveSchedule() {
    if (!this.schedForm.start_time || !this.schedForm.end_time) {
      this.formError.set('กรุณาเลือกช่วงเวลาการสอน');
      return;
    }
    this.saving.set(true);
    this.formError.set('');
    const isEdit = !!this.editingSchedule()?.schedule_id;
    const call = isEdit
      ? this.api.updateSchedule(this.editingSchedule().schedule_id, this.schedForm)
      : this.api.addSchedule({ ...this.schedForm, course_id: this.schedForm.course_id });

    call.subscribe({
      next: () => { this.scheduleModal.set(null); this.saving.set(false); this.loadCourses(); },
      error: (e: any) => { this.formError.set(e.error?.message || 'เกิดข้อผิดพลาด'); this.saving.set(false); },
    });
  }

  deleteSchedule(c: any) {
    if (!c.schedule_id) { alert('ไม่พบ Schedule ID'); return; }
    if (!confirm(`ลบตารางสอน "${c.course_code}" ?`)) return;
    this.api.deleteSchedule(c.schedule_id).subscribe({ next: () => this.loadCourses() });
  }
}
