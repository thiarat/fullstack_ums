import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { AdminApiService } from '../../core/services/admin-api.service';

const TIME_SLOTS = [
  { key: 'morning',   label: 'ช่วงเช้า',  sub: '08:00 – 12:00', start: '08:00', end: '12:00' },
  { key: 'afternoon', label: 'ช่วงบ่าย',  sub: '13:00 – 17:00', start: '13:00', end: '17:00' },
];

@Component({
  selector: 'app-admin-exam-schedules',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="main-content">
        <app-topbar title="ตารางสอบ" subtitle="ดูและแก้ไขตารางสอบทั้งหมด" />
        <div class="page-content">

          <!-- Filters -->
          <div class="d-flex gap-2 mb-3 flex-wrap">
            <div class="search-box" style="max-width:340px;flex:1">
              <i class="bi bi-search"></i>
              <input class="form-control" [(ngModel)]="searchQ" (ngModelChange)="load()"
                     placeholder="ค้นหารหัสวิชา, ชื่อวิชา, อาจารย์..." />
            </div>
            <select class="form-select" style="max-width:180px" [(ngModel)]="filterDept" (ngModelChange)="load()">
              <option value="">ทุกแผนก</option>
              <option *ngFor="let d of depts()" [value]="d.dept_id">{{ d.name }}</option>
            </select>
            <select class="form-select" style="max-width:150px" [(ngModel)]="filterType" (ngModelChange)="load()">
              <option value="">ทุกประเภท</option>
              <option value="Midterm">กลางภาค</option>
              <option value="Final">ปลายภาค</option>
            </select>
            <button class="btn btn-outline-secondary" (click)="load()">
              <i class="bi bi-arrow-clockwise me-1"></i>รีเฟรช
            </button>
          </div>

          <!-- Summary -->
          <div class="d-flex gap-2 mb-3 flex-wrap">
            <span class="badge-chip">ทั้งหมด <strong>{{ exams().length }}</strong></span>
            <span class="badge-chip mid">กลางภาค <strong>{{ countType('Midterm') }}</strong></span>
            <span class="badge-chip fin">ปลายภาค <strong>{{ countType('Final') }}</strong></span>
          </div>

          <!-- Table -->
          <div class="card">
            <div *ngIf="loading()" class="loading-overlay"><div class="spinner-border text-primary"></div></div>
            <div class="table-responsive" *ngIf="!loading()">
              <table class="table mb-0">
                <colgroup>
                  <col style="width:100px">
                  <col style="min-width:160px">
                  <col style="min-width:160px">
                  <col style="width:90px">
                  <col style="width:120px">
                  <col style="width:80px">
                  <col style="width:110px">
                  <col style="width:72px">
                </colgroup>
                <thead>
                  <tr>
                    <th>รหัสวิชา</th>
                    <th>ชื่อวิชา</th>
                    <th>อาจารย์ผู้สอน</th>
                    <th class="text-center">ประเภทสอบ</th>
                    <th>วันที่สอบ</th>
                    <th class="text-center">เวลา</th>
                    <th>ห้อง</th>
                    <th class="text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let e of exams()" class="stagger-item">
                    <td><code>{{ e.course_code }}</code></td>
                    <td><strong>{{ e.course_title }}</strong></td>
                    <td><strong>{{ e.prof_name || '—' }}</strong></td>
                    <td class="text-center">
                      <span class="exam-type-badge" [class.mid]="e.exam_type === 'Midterm'">
                        {{ e.exam_type === 'Midterm' ? 'กลางภาค' : 'ปลายภาค' }}
                      </span>
                    </td>
                    <td style="white-space:nowrap;font-size:.82rem">{{ e.exam_date | date:'d MMM yyyy' }}</td>
                    <td class="text-center">
                      <span class="time-slot-chip" [class.morning]="isMorning(e.start_time)">
                        <i class="bi" [class.bi-sun-fill]="isMorning(e.start_time)" [class.bi-cloud-sun-fill]="!isMorning(e.start_time)"></i>
                        {{ isMorning(e.start_time) ? 'เช้า' : 'บ่าย' }}
                      </span>
                    </td>
                    <td style="font-size:.82rem">{{ e.room_number }}</td>
                    <td class="text-center">
                      <div class="d-flex gap-1 justify-content-center">
                        <button class="btn btn-sm btn-icon-edit" (click)="openEdit(e)" title="แก้ไข">
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-icon-del" (click)="deleteExam(e.exam_id)" title="ลบ">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="empty-state" *ngIf="!loading() && exams().length === 0">
              <i class="bi bi-calendar-x"></i>
              <p>ไม่พบข้อมูลตารางสอบ</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    @if (showModal()) {
      <div class="modal-backdrop show" (click)="closeModal()"></div>
      <div class="modal show d-block">
        <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-pencil-square me-2 text-primary"></i>แก้ไขตารางสอบ
              </h5>
              <button class="btn-close" (click)="closeModal()"></button>
            </div>
            <div class="modal-body">
              <!-- Info row -->
              <div class="info-card mb-3">
                <div class="d-flex align-items-center gap-2 flex-wrap">
                  <code class="fw-700 text-primary">{{ form.course_code }}</code>
                  <strong>{{ form.course_title }}</strong>
                  <span class="exam-type-badge ms-auto" [class.mid]="form.exam_type === 'Midterm'">
                    {{ form.exam_type === 'Midterm' ? 'กลางภาค' : 'ปลายภาค' }}
                  </span>
                </div>
                <div class="text-muted mt-1" style="font-size:.8rem">
                  <i class="bi bi-person me-1"></i>{{ form.prof_name }}
                </div>
              </div>

              <!-- Date -->
              <div class="mb-3">
                <label class="form-label fw-600">วันที่สอบ <span class="text-danger">*</span></label>
                <input type="date" class="form-control" [(ngModel)]="form.exam_date" />
              </div>

              <!-- Time slots -->
              <div class="mb-3">
                <label class="form-label fw-600">ช่วงเวลาสอบ <span class="text-danger">*</span></label>
                <div class="time-slot-grid">
                  <button
                    *ngFor="let slot of timeSlots"
                    type="button"
                    class="time-slot-btn"
                    [class.selected]="selectedSlot === slot.key"
                    (click)="selectSlot(slot)">
                    <div class="slot-icon">
                      <i class="bi" [class.bi-sun-fill]="slot.key === 'morning'" [class.bi-cloud-sun-fill]="slot.key === 'afternoon'"></i>
                    </div>
                    <div class="slot-label">{{ slot.label }}</div>
                    <div class="slot-sub">{{ slot.sub }}</div>
                  </button>
                </div>
              </div>

              <!-- Room -->
              <div class="mb-3">
                <label class="form-label fw-600">ห้องสอบ <span class="text-danger">*</span></label>
                <input type="text" class="form-control" [(ngModel)]="form.room_number" placeholder="เช่น HALL-A, A301" />
              </div>

              <div class="alert alert-danger py-2" *ngIf="error()">{{ error() }}</div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-light" (click)="closeModal()">ยกเลิก</button>
              <button class="btn btn-primary" (click)="saveEdit()" [disabled]="saving()">
                <i class="bi bi-check-lg me-1"></i>{{ saving() ? 'กำลังบันทึก...' : 'บันทึก' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .badge-chip { background:#f1f5f9; color:#475569; padding:.35rem .75rem; border-radius:1rem; font-size:.8rem; border:1px solid #e2e8f0; }
    .badge-chip.mid { background:#dbeafe; color:#1d4ed8; border-color:#bfdbfe; }
    .badge-chip.fin { background:#fce7f3; color:#9d174d; border-color:#fbcfe8; }


    .exam-type-badge { padding:.2rem .55rem; border-radius:1rem; font-size:.73rem; font-weight:600; background:#fce7f3; color:#9d174d; white-space:nowrap; }
    .exam-type-badge.mid { background:#dbeafe; color:#1d4ed8; }

    .time-slot-chip { display:inline-flex; align-items:center; gap:.25rem; padding:.2rem .5rem; border-radius:1rem; font-size:.75rem; font-weight:700; background:#fef3c7; color:#92400e; }
    .time-slot-chip.morning { background:#dcfce7; color:#15803d; }

    .btn-icon-edit { background:#dbeafe; color:#1d4ed8; border:none; width:28px; height:28px; border-radius:.3rem; display:flex; align-items:center; justify-content:center; padding:0; font-size:.78rem; }
    .btn-icon-del  { background:#fee2e2; color:#dc2626; border:none; width:28px; height:28px; border-radius:.3rem; display:flex; align-items:center; justify-content:center; padding:0; font-size:.78rem; }
    .btn-icon-edit:hover { background:#bfdbfe; }
    .btn-icon-del:hover  { background:#fecaca; }

    /* Modal */
    .info-card { background:#f8fafc; border:1px solid #e2e8f0; border-radius:.5rem; padding:.875rem 1rem; }
    .fw-600 { font-weight:600; }
    .fw-700 { font-weight:700; }
    .ms-auto { margin-left:auto; }
    .me-1 { margin-right:.25rem; }
    .me-2 { margin-right:.5rem; }
    .mt-1 { margin-top:.25rem; }
    .mb-3 { margin-bottom:1rem; }
    .form-label { font-size:.82rem; margin-bottom:.35rem; display:block; }

    .time-slot-grid { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
    .time-slot-btn {
      display:flex; flex-direction:column; align-items:center; gap:.2rem;
      padding:.875rem; border:2px solid #e2e8f0; border-radius:.625rem;
      background:white; cursor:pointer; transition:all .15s; text-align:center;
    }
    .time-slot-btn:hover { border-color:#93c5fd; background:#eff6ff; }
    .time-slot-btn.selected { border-color:#16a34a; background:#f0fdf4; }
    .slot-icon { font-size:1.4rem; color:#64748b; }
    .time-slot-btn.selected .slot-icon { color:#16a34a; }
    .slot-label { font-weight:700; font-size:.95rem; color:#1e293b; }
    .time-slot-btn.selected .slot-label { color:#15803d; }
    .slot-sub { font-size:.78rem; color:#64748b; }
    .time-slot-btn.selected .slot-sub { color:#16a34a; }
  `]
})
export class AdminExamSchedulesComponent implements OnInit {
  exams   = signal<any[]>([]);
  depts   = signal<any[]>([]);
  loading = signal(true);
  showModal = signal(false);
  saving  = signal(false);
  error   = signal('');

  searchQ = ''; filterDept = ''; filterType = '';
  timeSlots = TIME_SLOTS;
  selectedSlot = '';
  form: any = {};
  private editId: number | null = null;

  constructor(private api: AdminApiService) {}
  ngOnInit() { this.loadDepts(); this.load(); }

  loadDepts() {
    this.api.getDepartments().subscribe({
      next: (res: any) => this.depts.set(res.data || res || []),
      error: () => {}
    });
  }

  isMorning(t: string) { return t?.startsWith('08') || t?.startsWith('09') || t?.startsWith('10') || t?.startsWith('11'); }

  load() {
    this.loading.set(true);
    const params: any = {};
    if (this.searchQ)    params.search    = this.searchQ;
    if (this.filterDept) params.dept_id   = this.filterDept;
    if (this.filterType) params.exam_type = this.filterType;

    this.api.getExamSchedules(params).subscribe({
      next: (res: any) => {
        this.exams.set(res.data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  countType(type: string) { return this.exams().filter(e => e.exam_type === type).length; }

  openEdit(e: any) {
    this.editId = e.exam_id;
    this.error.set('');
    this.selectedSlot = this.isMorning(e.start_time) ? 'morning' : 'afternoon';
    this.form = {
      course_code:  e.course_code,
      course_title: e.course_title,
      prof_name:    e.prof_name,
      exam_type:    e.exam_type,
      exam_date:    new Date(e.exam_date).toISOString().split('T')[0],
      start_time:   e.start_time?.substring(0,5),
      end_time:     e.end_time?.substring(0,5),
      room_number:  e.room_number
    };
    this.showModal.set(true);
  }

  selectSlot(slot: any) {
    this.selectedSlot = slot.key;
    this.form.start_time = slot.start;
    this.form.end_time   = slot.end;
  }

  closeModal() { this.showModal.set(false); this.error.set(''); }

  saveEdit() {
    if (!this.form.exam_date || !this.selectedSlot || !this.form.room_number) {
      this.error.set('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.api.updateExamSchedule(this.editId!, {
      exam_date:   this.form.exam_date,
      start_time:  this.form.start_time,
      end_time:    this.form.end_time,
      room_number: this.form.room_number
    }).subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.load(); },
      error: (err: any) => { this.saving.set(false); this.error.set(err?.error?.message || 'เกิดข้อผิดพลาด'); }
    });
  }

  deleteExam(examId: number) {
    if (!confirm('ยืนยันการลบตารางสอบนี้?')) return;
    this.api.deleteExamSchedule(examId).subscribe({
      next: () => this.load(),
      error: (err: any) => alert(err?.error?.message || 'เกิดข้อผิดพลาด')
    });
  }
}
