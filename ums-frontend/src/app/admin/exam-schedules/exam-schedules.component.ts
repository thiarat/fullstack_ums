import { Component, OnInit, signal, inject, computed } from '@angular/core';
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
            <span class="badge-chip total">
              <i class="bi bi-grid-3x3-gap me-1"></i>รายวิชาทั้งหมด (มีอาจารย์) <strong>{{ summary()?.total_sections ?? '…' }}</strong>
            </span>
            <span class="badge-chip noexam">
              <i class="bi bi-calendar-x me-1"></i>ยังไม่ตั้งวันสอบ <strong>{{ summary()?.no_exam ?? '…' }}</strong>
            </span>
            <span class="badge-chip hasexam">
              <i class="bi bi-calendar-check me-1"></i>ตั้งวันสอบแล้ว <strong>{{ summary()?.with_any_exam ?? '…' }}</strong>
            </span>
            <span class="badge-chip mid">
              <i class="bi bi-journal-bookmark me-1"></i>กลางภาค <strong>{{ countType('Midterm') }}</strong>
            </span>
            <span class="badge-chip fin">
              <i class="bi bi-journal-check me-1"></i>ปลายภาค <strong>{{ countType('Final') }}</strong>
            </span>
          </div>

          <!-- Tabs -->
          <div class="tab-bar mb-3">
            <button class="tab-btn" [class.active]="activeTab() === 'has-exam'" (click)="switchTab('has-exam')">
              <i class="bi bi-calendar-check me-1"></i>ตั้งวันสอบแล้ว
            </button>
            <button class="tab-btn" [class.active]="activeTab() === 'no-exam'" (click)="switchTab('no-exam')">
              <i class="bi bi-calendar-x me-1"></i>ไม่ได้ตั้งวันสอบ
            </button>
          </div>

          <!-- Tab: ตั้งวันสอบแล้ว -->
          @if (activeTab() === 'has-exam') {
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
          }

          <!-- Tab: ไม่ได้ตั้งวันสอบ -->
          @if (activeTab() === 'no-exam') {
            <div class="card">
              <div *ngIf="noExamLoading()" class="loading-overlay"><div class="spinner-border text-primary"></div></div>
              <div class="table-responsive" *ngIf="!noExamLoading()">
                <table class="table mb-0">
                  <thead>
                    <tr>
                      <th>รหัสวิชา</th>
                      <th>ชื่อวิชา</th>
                      <th>อาจารย์ผู้สอน</th>
                      <th class="text-center" style="min-width:180px">สอบกลางภาค</th>
                      <th class="text-center" style="min-width:180px">สอบปลายภาค</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let r of noExamList()" class="stagger-item">
                      <td><code class="text-primary">{{ r.course_code }}</code></td>
                      <td><strong>{{ r.title }}</strong></td>
                      <td>{{ r.professor_name }}</td>
                      <!-- สอบกลางภาค -->
                      <td class="text-center">
                        @if (r.midterm_date) {
                          <div class="exam-cell-set">
                            <div class="date-set-badge mid mb-1">{{ r.midterm_date | date:'d MMM yyyy' }}</div>
                            <div class="exam-cell-sub">
                              <span class="time-slot-chip" [class.morning]="isMorning(r.midterm_start)">
                                <i class="bi" [class.bi-sun-fill]="isMorning(r.midterm_start)" [class.bi-cloud-sun-fill]="!isMorning(r.midterm_start)"></i>
                                {{ isMorning(r.midterm_start) ? 'เช้า' : 'บ่าย' }}
                              </span>
                              <span class="room-chip">{{ r.midterm_room }}</span>
                            </div>
                            <button class="btn btn-xs btn-outline-primary mt-1" (click)="openEditFromNoExam(r, 'Midterm')">
                              <i class="bi bi-pencil"></i>
                            </button>
                          </div>
                        } @else {
                          <button class="btn-set-date" (click)="openCreateExam(r, 'Midterm')">
                            <i class="bi bi-plus-circle me-1"></i>กำหนดวัน
                          </button>
                        }
                      </td>
                      <!-- สอบปลายภาค -->
                      <td class="text-center">
                        @if (r.final_date) {
                          <div class="exam-cell-set">
                            <div class="date-set-badge fin mb-1">{{ r.final_date | date:'d MMM yyyy' }}</div>
                            <div class="exam-cell-sub">
                              <span class="time-slot-chip" [class.morning]="isMorning(r.final_start)">
                                <i class="bi" [class.bi-sun-fill]="isMorning(r.final_start)" [class.bi-cloud-sun-fill]="!isMorning(r.final_start)"></i>
                                {{ isMorning(r.final_start) ? 'เช้า' : 'บ่าย' }}
                              </span>
                              <span class="room-chip">{{ r.final_room }}</span>
                            </div>
                            <button class="btn btn-xs btn-outline-primary mt-1" (click)="openEditFromNoExam(r, 'Final')">
                              <i class="bi bi-pencil"></i>
                            </button>
                          </div>
                        } @else {
                          <button class="btn-set-date" (click)="openCreateExam(r, 'Final')">
                            <i class="bi bi-plus-circle me-1"></i>กำหนดวัน
                          </button>
                        }
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="empty-state" *ngIf="!noExamLoading() && noExamList().length === 0">
                <i class="bi bi-check-circle text-success"></i>
                <p>ทุกรายวิชาตั้งวันสอบครบแล้ว</p>
              </div>
            </div>
          }
        </div>
      </div>
    </div>

    <!-- Create Exam Modal (จากหน้า no-exam) -->
    @if (showCreateModal()) {
      <div class="modal-backdrop show" (click)="closeCreateModal()"></div>
      <div class="modal show d-block">
        <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-calendar-plus me-2 text-primary"></i>กำหนดวันสอบ
              </h5>
              <button class="btn-close" (click)="closeCreateModal()"></button>
            </div>
            <div class="modal-body">
              <div class="info-card mb-3">
                <div class="d-flex align-items-center gap-2 flex-wrap">
                  <code class="fw-700 text-primary">{{ createForm.course_code }}</code>
                  <strong>{{ createForm.course_title }}</strong>
                  <span class="exam-type-badge ms-auto" [class.mid]="createForm.exam_type === 'Midterm'">
                    {{ createForm.exam_type === 'Midterm' ? 'กลางภาค' : 'ปลายภาค' }}
                  </span>
                </div>
                <div class="text-muted mt-1" style="font-size:.8rem">
                  <i class="bi bi-person me-1"></i>{{ createForm.prof_name }}
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label fw-600">วันที่สอบ <span class="text-danger">*</span></label>
                <input type="date" class="form-control" [(ngModel)]="createForm.exam_date" />
              </div>
              <div class="mb-3">
                <label class="form-label fw-600">ช่วงเวลาสอบ <span class="text-danger">*</span></label>
                <div class="time-slot-grid">
                  <button *ngFor="let slot of timeSlots" type="button" class="time-slot-btn"
                    [class.selected]="createSelectedSlot === slot.key" (click)="selectCreateSlot(slot)">
                    <div class="slot-icon"><i class="bi" [class.bi-sun-fill]="slot.key === 'morning'" [class.bi-cloud-sun-fill]="slot.key === 'afternoon'"></i></div>
                    <div class="slot-label">{{ slot.label }}</div>
                    <div class="slot-sub">{{ slot.sub }}</div>
                  </button>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label fw-600">ห้องสอบ <span class="text-danger">*</span></label>
                <input type="text" class="form-control" [(ngModel)]="createForm.room_number" placeholder="เช่น HALL-A, A301" />
              </div>
              <div class="alert alert-danger py-2" *ngIf="createError()">{{ createError() }}</div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-light" (click)="closeCreateModal()">ยกเลิก</button>
              <button class="btn btn-primary" (click)="saveCreate()" [disabled]="saving()">
                <i class="bi bi-check-lg me-1"></i>{{ saving() ? 'กำลังบันทึก...' : 'บันทึก' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }

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
    .tab-bar { display:flex; gap:.5rem; border-bottom:2px solid #e2e8f0; }
    .tab-btn { background:none; border:none; padding:.5rem 1.25rem; font-size:.88rem; font-weight:600; color:#64748b; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-2px; transition:all .15s; }
    .tab-btn:hover { color:#334155; }
    .tab-btn.active { color:#2563eb; border-bottom-color:#2563eb; }

    .date-set-badge { font-size:.75rem; font-weight:600; padding:.2rem .55rem; border-radius:1rem; display:inline-block; }
    .date-set-badge.mid { background:#dbeafe; color:#1d4ed8; }
    .date-set-badge.fin { background:#fce7f3; color:#9d174d; }
    .date-unset-badge { font-size:.75rem; font-weight:600; color:#dc2626; background:#fee2e2; padding:.2rem .55rem; border-radius:1rem; display:inline-flex; align-items:center; }

    .btn-set-date { display:inline-flex; align-items:center; gap:.3rem; padding:.3rem .7rem; border:1.5px dashed #93c5fd; border-radius:.5rem; background:#eff6ff; color:#2563eb; font-size:.78rem; font-weight:600; cursor:pointer; transition:all .15s; }
    .btn-set-date:hover { background:#dbeafe; border-color:#2563eb; }
    .btn.btn-xs { padding:.15rem .4rem; font-size:.72rem; }
    .exam-cell-set { display:flex; flex-direction:column; align-items:center; gap:.15rem; }
    .exam-cell-sub { display:flex; align-items:center; gap:.3rem; }
    .room-chip { font-size:.72rem; color:#475569; background:#f1f5f9; border:1px solid #e2e8f0; padding:.1rem .4rem; border-radius:.4rem; }

    .badge-chip { background:#f1f5f9; color:#475569; padding:.35rem .75rem; border-radius:1rem; font-size:.8rem; border:1px solid #e2e8f0; display:inline-flex; align-items:center; }
    .badge-chip.total   { background:#f8fafc; color:#334155; border-color:#cbd5e1; }
    .badge-chip.noexam  { background:#fff7ed; color:#c2410c; border-color:#fed7aa; }
    .badge-chip.hasexam { background:#f0fdf4; color:#15803d; border-color:#bbf7d0; }
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
  private api = inject(AdminApiService);
  exams   = signal<any[]>([]);
  depts   = signal<any[]>([]);
  summary = signal<any>(null);
  loading = signal(true);
  showModal = signal(false);
  saving  = signal(false);
  error   = signal('');

  activeTab     = signal<'has-exam' | 'no-exam'>('has-exam');
  noExamList    = signal<any[]>([]);
  noExamLoading = signal(false);

  // Create exam modal (จากหน้า no-exam)
  showCreateModal = signal(false);
  createError     = signal('');
  createForm: any = {};
  createSelectedSlot = '';

  searchQ = ''; filterDept = ''; filterType = '';
  timeSlots = TIME_SLOTS;
  selectedSlot = '';
  form: any = {};
  private editId: number | null = null;

  ngOnInit() { this.loadDepts(); this.load(); this.loadSummary(); }

  switchTab(tab: 'has-exam' | 'no-exam') {
    this.activeTab.set(tab);
    if (tab === 'no-exam') {
      this.loadNoExamList();
    }
  }

  loadNoExamList() {
    this.noExamLoading.set(true);
    this.api.getNoExamList().subscribe({
      next: (r: any) => { this.noExamList.set(r.data ?? []); this.noExamLoading.set(false); },
      error: () => this.noExamLoading.set(false),
    });
  }

  loadSummary() {
    this.api.getExamSummary().subscribe({
      next: (r: any) => this.summary.set(r.data),
      error: () => {}
    });
  }

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

  // Open create modal for a specific exam type (from no-exam tab)
  openCreateExam(row: any, examType: 'Midterm' | 'Final') {
    this.createError.set('');
    this.createSelectedSlot = '';
    this.createForm = {
      schedule_id:  row.schedule_id,
      course_id:    row.course_id,
      course_code:  row.course_code,
      course_title: row.title,
      prof_name:    row.professor_name,
      exam_type:    examType,
      exam_date:    '',
      start_time:   '',
      end_time:     '',
      room_number:  '',
    };
    this.showCreateModal.set(true);
  }

  selectCreateSlot(slot: any) {
    this.createSelectedSlot = slot.key;
    this.createForm.start_time = slot.start;
    this.createForm.end_time   = slot.end;
  }

  closeCreateModal() { this.showCreateModal.set(false); this.createError.set(''); }

  saveCreate() {
    if (!this.createForm.exam_date || !this.createSelectedSlot || !this.createForm.room_number) {
      this.createError.set('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    this.saving.set(true);
    this.createError.set('');
    this.api.createExamSchedule({
      schedule_id:  this.createForm.schedule_id,
      course_id:    this.createForm.course_id,
      exam_type:    this.createForm.exam_type,
      exam_date:    this.createForm.exam_date,
      start_time:   this.createForm.start_time,
      end_time:     this.createForm.end_time,
      room_number:  this.createForm.room_number,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeCreateModal();
        this.load();
        this.loadSummary();
        this.loadNoExamList();
      },
      error: (err: any) => {
        this.saving.set(false);
        this.createError.set(err?.error?.message || 'เกิดข้อผิดพลาด');
      },
    });
  }

  // Open edit modal from no-exam tab (exam already exists for one type)
  openEditFromNoExam(row: any, examType: 'Midterm' | 'Final') {
    const examId  = examType === 'Midterm' ? row.midterm_exam_id  : row.final_exam_id;
    const date    = examType === 'Midterm' ? row.midterm_date      : row.final_date;
    const start   = examType === 'Midterm' ? row.midterm_start     : row.final_start;
    const room    = examType === 'Midterm' ? row.midterm_room      : row.final_room;
    this.editId = examId;
    this.error.set('');
    this.selectedSlot = this.isMorning(start) ? 'morning' : 'afternoon';
    this.form = {
      course_code:  row.course_code,
      course_title: row.title,
      prof_name:    row.professor_name,
      exam_type:    examType,
      exam_date:    new Date(date).toISOString().split('T')[0],
      start_time:   start?.substring(0, 5),
      end_time:     '',
      room_number:  room,
    };
    this.showModal.set(true);
  }

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
      next: () => { this.saving.set(false); this.closeModal(); this.load(); this.loadSummary(); this.loadNoExamList(); },
      error: (err: any) => { this.saving.set(false); this.error.set(err?.error?.message || 'เกิดข้อผิดพลาด'); }
    });
  }

  deleteExam(examId: number) {
    if (!confirm('ยืนยันการลบตารางสอบนี้?')) return;
    this.api.deleteExamSchedule(examId).subscribe({
      next: () => { this.load(); this.loadSummary(); this.loadNoExamList(); },
      error: (err: any) => alert(err?.error?.message || 'เกิดข้อผิดพลาด')
    });
  }
}
