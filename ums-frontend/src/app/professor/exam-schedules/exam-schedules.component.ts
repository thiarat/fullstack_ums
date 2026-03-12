import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { ProfessorApiService } from '../../core/services/professor-api.service';

const DAYS_TH: Record<string, string> = {
  Monday: 'จันทร์', Tuesday: 'อังคาร', Wednesday: 'พุธ',
  Thursday: 'พฤหัส', Friday: 'ศุกร์', Saturday: 'เสาร์', Sunday: 'อาทิตย์'
};

const TIME_SLOTS = [
  { key: 'morning',   label: 'ช่วงเช้า',  sub: '08:00 – 12:00', start: '08:00', end: '12:00' },
  { key: 'afternoon', label: 'ช่วงบ่าย',  sub: '13:00 – 17:00', start: '13:00', end: '17:00' },
];

@Component({
  selector: 'app-prof-exam-schedules',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="main-content">
        <app-topbar title="กำหนดวันสอบ" subtitle="จัดการตารางสอบกลางภาคและปลายภาคของรายวิชาที่สอน" />
        <div class="page-content">

          @if (loading()) {
            <div class="loading-center"><div class="spinner-border text-primary"></div></div>
          } @else {
            <div class="card">
              <div class="table-responsive">
                <table class="table mb-0">
                  <thead>
                    <tr>
                      <th>รหัสวิชา</th>
                      <th>ชื่อวิชา</th>
                      <th>วัน/เวลา</th>
                      <th>ห้องเรียน</th>
                      <th>สอบกลางภาค</th>
                      <th>สอบปลายภาค</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let row of courses()" class="stagger-item">
                      <td><code>{{ row.course_code }}</code></td>
                      <td><strong>{{ row.course_title }}</strong></td>
                      <td>
                        <span class="sched-chip">
                          <span class="day-tag">{{ daysTh[row.day_of_week] }}</span>
                          {{ row.start_time | slice:0:5 }}–{{ row.end_time | slice:0:5 }}
                        </span>
                      </td>
                      <td><span class="room-tag">{{ row.room_number }}</span></td>

                      <!-- Midterm -->
                      <td>
                        <div class="exam-cell" *ngIf="row.mid_exam_id; else addMid">
                          <div class="exam-info">
                            <div class="exam-date-text">{{ row.mid_date | date:'d MMM yyyy' }}</div>
                            <div class="exam-time-text">
                              <span class="slot-mini" [class.morning]="isMorning(row.mid_start)">
                                {{ isMorning(row.mid_start) ? 'เช้า' : 'บ่าย' }}
                              </span>
                              {{ row.mid_start | slice:0:5 }}–{{ row.mid_end | slice:0:5 }}
                            </div>
                            <div class="exam-room-text">{{ row.mid_room }}</div>
                          </div>
                          <div class="exam-btns">
                            <button class="btn-xs btn-edit" (click)="openModal(row, 'Midterm')" title="แก้ไข"><i class="bi bi-pencil"></i></button>
                            <button class="btn-xs btn-del"  (click)="deleteExam(row.mid_exam_id)" title="ลบ"><i class="bi bi-trash"></i></button>
                          </div>
                        </div>
                        <ng-template #addMid>
                          <button class="btn-add-exam" (click)="openModal(row, 'Midterm')">
                            <i class="bi bi-plus-circle"></i> กำหนดวัน
                          </button>
                        </ng-template>
                      </td>

                      <!-- Final -->
                      <td>
                        <div class="exam-cell" *ngIf="row.fin_exam_id; else addFin">
                          <div class="exam-info">
                            <div class="exam-date-text">{{ row.fin_date | date:'d MMM yyyy' }}</div>
                            <div class="exam-time-text">
                              <span class="slot-mini" [class.morning]="isMorning(row.fin_start)">
                                {{ isMorning(row.fin_start) ? 'เช้า' : 'บ่าย' }}
                              </span>
                              {{ row.fin_start | slice:0:5 }}–{{ row.fin_end | slice:0:5 }}
                            </div>
                            <div class="exam-room-text">{{ row.fin_room }}</div>
                          </div>
                          <div class="exam-btns">
                            <button class="btn-xs btn-edit" (click)="openModal(row, 'Final')" title="แก้ไข"><i class="bi bi-pencil"></i></button>
                            <button class="btn-xs btn-del"  (click)="deleteExam(row.fin_exam_id)" title="ลบ"><i class="bi bi-trash"></i></button>
                          </div>
                        </div>
                        <ng-template #addFin>
                          <button class="btn-add-exam" (click)="openModal(row, 'Final')">
                            <i class="bi bi-plus-circle"></i> กำหนดวัน
                          </button>
                        </ng-template>
                      </td>
                    </tr>
                    <tr *ngIf="courses().length === 0">
                      <td colspan="6" class="empty-td">ไม่พบรายวิชา</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          }
        </div>
      </div>
    </div>

    <!-- Modal -->
    @if (showModal()) {
      <div class="modal-backdrop show" (click)="closeModal()"></div>
      <div class="modal show d-block">
        <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
          <div class="modal-content">

            <!-- Header -->
            <div class="modal-header">
              <div>
                <h5 class="modal-title mb-0">
                  {{ modalExamId() ? 'แก้ไข' : 'กำหนด' }}วันสอบ
                  <span class="exam-type-pill" [class.mid]="form.exam_type === 'Midterm'">
                    {{ form.exam_type === 'Midterm' ? 'กลางภาค' : 'ปลายภาค' }}
                  </span>
                </h5>
                <div class="modal-sub">
                  <code>{{ form.course_code }}</code> {{ form.course_title }}
                </div>
              </div>
              <button class="btn-close" (click)="closeModal()"></button>
            </div>

            <div class="modal-body">
              <!-- Section 1: วันที่ -->
              <div class="form-section">
                <div class="section-title"><i class="bi bi-calendar3 me-2"></i>วันที่สอบ</div>
                <input type="date" class="form-control" [(ngModel)]="form.exam_date" />
              </div>

              <!-- Section 2: เวลา -->
              <div class="form-section">
                <div class="section-title"><i class="bi bi-clock me-2"></i>ช่วงเวลาสอบ</div>
                <div class="slot-grid">
                  <button
                    *ngFor="let slot of timeSlots"
                    type="button"
                    class="slot-btn"
                    [class.selected]="selectedSlot === slot.key"
                    (click)="selectSlot(slot)">
                    <div class="slot-icon-wrap">
                      <i class="bi fs-4" [class.bi-sun-fill]="slot.key === 'morning'" [class.bi-cloud-sun-fill]="slot.key === 'afternoon'"></i>
                    </div>
                    <div class="slot-name">{{ slot.label }}</div>
                    <div class="slot-time">{{ slot.sub }}</div>
                  </button>
                </div>
              </div>

              <!-- Section 3: ห้อง -->
              <div class="form-section">
                <div class="section-title"><i class="bi bi-geo-alt me-2"></i>ห้องสอบ</div>
                <input type="text" class="form-control" [(ngModel)]="form.room_number"
                       placeholder="เช่น HALL-A, A301, B-501" />
              </div>

              <div class="alert alert-danger py-2 mb-0" *ngIf="error()">
                <i class="bi bi-exclamation-circle me-1"></i>{{ error() }}
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-light" (click)="closeModal()">ยกเลิก</button>
              <button class="btn btn-primary" (click)="saveExam()" [disabled]="saving()">
                <i class="bi bi-check-lg me-1"></i>{{ saving() ? 'กำลังบันทึก...' : 'บันทึก' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .loading-center { display:flex; justify-content:center; padding:4rem; }

    /* Table */
    .sched-chip { display:inline-flex; align-items:center; gap:.4rem; font-size:.8rem; }
    .day-tag { background:#f0fdf4; color:#15803d; padding:.15rem .4rem; border-radius:.25rem; font-size:.75rem; font-weight:600; }
    .room-tag { background:#fef9c3; color:#92400e; padding:.15rem .4rem; border-radius:.25rem; font-size:.78rem; }

    .exam-cell { display:flex; align-items:flex-start; gap:.5rem; }
    .exam-info { display:flex; flex-direction:column; gap:.1rem; flex:1; }
    .exam-date-text { font-weight:600; font-size:.82rem; }
    .exam-time-text { display:flex; align-items:center; gap:.3rem; font-size:.75rem; color:#64748b; }
    .exam-room-text { font-size:.72rem; color:#94a3b8; }
    .slot-mini { display:inline-flex; align-items:center; padding:.05rem .35rem; border-radius:.25rem; font-size:.7rem; font-weight:700; background:#fef3c7; color:#92400e; }
    .slot-mini.morning { background:#dcfce7; color:#15803d; }

    .exam-btns { display:flex; flex-direction:column; gap:.25rem; }
    .btn-xs { width:22px; height:22px; border:none; border-radius:.25rem; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:.7rem; padding:0; transition:opacity .15s; }
    .btn-edit { background:#dbeafe; color:#1d4ed8; }
    .btn-del  { background:#fee2e2; color:#dc2626; }
    .btn-xs:hover { opacity:.75; }

    .btn-add-exam { background:none; border:1.5px dashed #d1d5db; border-radius:.375rem; color:#94a3b8; padding:.3rem .6rem; font-size:.78rem; cursor:pointer; display:inline-flex; align-items:center; gap:.3rem; transition:border-color .15s,color .15s; white-space:nowrap; }
    .btn-add-exam:hover { border-color:#6366f1; color:#6366f1; }

    .empty-td { text-align:center; color:#94a3b8; padding:2.5rem; }

    /* Modal */
    .modal-sub { font-size:.82rem; color:#64748b; margin-top:.2rem; }
    .modal-sub code { color:#3b82f6; font-size:.82rem; }
    .exam-type-pill { margin-left:.5rem; padding:.15rem .55rem; border-radius:1rem; font-size:.75rem; font-weight:700; background:#fce7f3; color:#9d174d; vertical-align:middle; }
    .exam-type-pill.mid { background:#dbeafe; color:#1d4ed8; }

    .form-section { border:1px solid #e2e8f0; border-radius:.625rem; padding:1rem 1.125rem; margin-bottom:.875rem; }
    .form-section:last-of-type { margin-bottom:0; }
    .section-title { font-size:.78rem; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:#64748b; margin-bottom:.75rem; display:flex; align-items:center; }
    .me-2 { margin-right:.5rem; }
    .me-1 { margin-right:.25rem; }
    .mb-0 { margin-bottom:0; }

    .slot-grid { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
    .slot-btn {
      display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.2rem;
      padding:1rem .75rem; border:2px solid #e2e8f0; border-radius:.75rem;
      background:white; cursor:pointer; transition:all .15s; text-align:center;
    }
    .slot-btn:hover { border-color:#93c5fd; background:#eff6ff; }
    .slot-btn.selected { border-color:#16a34a; background:#f0fdf4; box-shadow:0 0 0 3px rgba(22,163,74,.15); }
    .slot-icon-wrap { font-size:1.4rem; color:#94a3b8; }
    .slot-btn.selected .slot-icon-wrap { color:#16a34a; }
    .slot-name { font-weight:700; font-size:.95rem; color:#1e293b; }
    .slot-btn.selected .slot-name { color:#15803d; }
    .slot-time { font-size:.78rem; color:#64748b; }
    .slot-btn.selected .slot-time { color:#16a34a; }
    .fs-4 { font-size:1.4rem; }
  `]
})
export class ProfExamSchedulesComponent implements OnInit {
  courses    = signal<any[]>([]);
  loading    = signal(true);
  showModal  = signal(false);
  saving     = signal(false);
  error      = signal('');
  modalExamId = signal<number | null>(null);

  daysTh = DAYS_TH;
  timeSlots = TIME_SLOTS;
  selectedSlot = '';

  form: any = {
    schedule_id: null, course_code: '', course_title: '',
    exam_type: 'Midterm', exam_date: '', start_time: '', end_time: '', room_number: ''
  };

  constructor(private api: ProfessorApiService) {}
  ngOnInit() { this.load(); }

  isMorning(t: string) { return t?.startsWith('08') || t?.startsWith('09') || t?.startsWith('10') || t?.startsWith('11'); }

  load() {
    this.loading.set(true);
    this.api.getCourseExams().subscribe({
      next: (res: any) => { this.courses.set(res.data || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openModal(row: any, examType: 'Midterm' | 'Final') {
    const isEdit = examType === 'Midterm' ? !!row.mid_exam_id : !!row.fin_exam_id;
    this.modalExamId.set(isEdit ? (examType === 'Midterm' ? row.mid_exam_id : row.fin_exam_id) : null);
    this.error.set('');

    const existDate  = examType === 'Midterm' ? row.mid_date  : row.fin_date;
    const existStart = examType === 'Midterm' ? row.mid_start : row.fin_start;
    const existRoom  = examType === 'Midterm' ? row.mid_room  : row.fin_room;

    this.selectedSlot = isEdit ? (this.isMorning(existStart) ? 'morning' : 'afternoon') : '';

    this.form = {
      schedule_id:  row.schedule_id,
      course_code:  row.course_code,
      course_title: row.course_title,
      exam_type:    examType,
      exam_date:    isEdit ? new Date(existDate).toISOString().split('T')[0] : '',
      start_time:   isEdit ? existStart?.substring(0,5) : '',
      end_time:     isEdit ? (examType === 'Midterm' ? row.mid_end : row.fin_end)?.substring(0,5) : '',
      room_number:  isEdit ? existRoom : ''
    };
    this.showModal.set(true);
  }

  selectSlot(slot: any) {
    this.selectedSlot   = slot.key;
    this.form.start_time = slot.start;
    this.form.end_time   = slot.end;
  }

  closeModal() { this.showModal.set(false); this.error.set(''); }

  saveExam() {
    if (!this.form.exam_date || !this.selectedSlot || !this.form.room_number) {
      this.error.set('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const body = {
      schedule_id:  this.form.schedule_id,
      exam_type:    this.form.exam_type,
      exam_date:    this.form.exam_date,
      start_time:   this.form.start_time,
      end_time:     this.form.end_time,
      room_number:  this.form.room_number
    };
    const req$ = this.modalExamId()
      ? this.api.updateExam(this.modalExamId()!, body)
      : this.api.createExam(body);

    req$.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.load(); },
      error: (err: any) => { this.saving.set(false); this.error.set(err?.error?.message || 'เกิดข้อผิดพลาด'); }
    });
  }

  deleteExam(examId: number) {
    if (!confirm('ยืนยันการลบตารางสอบนี้?')) return;
    this.api.deleteExam(examId).subscribe({
      next: () => this.load(),
      error: (err: any) => alert(err?.error?.message || 'เกิดข้อผิดพลาด')
    });
  }
}
