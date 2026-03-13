import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { StudentApiService } from '../../core/services/student-api.service';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAYS_TH: Record<string,string> = {
  Monday:'จันทร์', Tuesday:'อังคาร', Wednesday:'พุธ',
  Thursday:'พฤหัส', Friday:'ศุกร์', Saturday:'เสาร์', Sunday:'อาทิตย์'
};

@Component({
  selector: 'app-student-schedule',
  standalone: true,
  imports: [CommonModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="main-content">
        <app-topbar [title]="isExam ? 'ตารางสอบ' : 'ตารางเรียน'" />
        <div class="page-content">

          <!-- ตารางเรียน -->
          <div *ngIf="!isExam">
            <div class="schedule-grid">
              <div class="day-column" *ngFor="let day of days">
                <div class="day-header">{{ daysTh[day] }}</div>
                <ng-container *ngFor="let s of scheduleByDay()[day]">
                  <div class="schedule-block">
                    <div class="block-code">{{ s.course_code }}</div>
                    <div class="block-title">{{ s.course_title }}</div>
                    <div class="block-time"><i class="bi bi-clock"></i> {{ s.start_time | slice:0:5 }} – {{ s.end_time | slice:0:5 }}</div>
                    <div class="block-room"><i class="bi bi-geo-alt"></i> {{ s.room_number || '-' }}</div>
                    <div class="block-prof" *ngIf="s.professor_name"><i class="bi bi-person"></i> {{ s.professor_name }}</div>
                  </div>
                </ng-container>
                <div class="day-empty" *ngIf="!scheduleByDay()[day]?.length">-</div>
              </div>
            </div>
          </div>

          <!-- ตารางสอบ -->
          <div *ngIf="isExam">
            <!-- ตารางสอบที่ใกล้ถึง -->
            <div class="mb-4">
              <h6 class="fw-700 mb-3 d-flex align-items-center gap-2">
                <i class="bi bi-alarm text-warning"></i>
                ตารางสอบที่กำลังจะถึง
                <span class="badge bg-warning text-dark">{{ upcomingExams().length }}</span>
              </h6>
              @if (upcomingExams().length === 0) {
                <div class="empty-box">
                  <i class="bi bi-calendar-check"></i>
                  <p>ไม่มีตารางสอบที่กำลังจะถึง</p>
                </div>
              } @else {
                <div class="card">
                  <div class="table-responsive">
                    <table class="table mb-0">
                      <thead><tr><th>วิชา</th><th>ประเภท</th><th>วันที่</th><th>เวลา</th><th>ห้อง</th><th>อีกกี่วัน</th></tr></thead>
                      <tbody>
                        @for (e of upcomingExams(); track e.exam_id) {
                          <tr class="stagger-item">
                            <td><code>{{ e.course_code }}</code> {{ e.course_title }}</td>
                            <td><span class="badge" [class]="e.exam_type === 'Final' ? 'bg-danger' : 'bg-warning text-dark'">{{ e.exam_type }}</span></td>
                            <td>{{ e.exam_date | date:'EEE dd MMM yyyy' }}</td>
                            <td class="mono" style="font-size:.82rem">{{ e.start_time | slice:0:5 }} – {{ e.end_time | slice:0:5 }}</td>
                            <td>{{ e.room_number }}</td>
                            <td>
                              @if (e.days_until === 0) {
                                <span class="badge bg-danger">วันนี้!</span>
                              } @else {
                                <span class="badge bg-warning text-dark">อีก {{ e.days_until }} วัน</span>
                              }
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              }
            </div>

            <!-- ตารางสอบที่ผ่านมาแล้ว -->
            <div>
              <h6 class="fw-700 mb-3 d-flex align-items-center gap-2">
                <i class="bi bi-clock-history text-muted"></i>
                ตารางสอบที่ผ่านมาแล้ว
                <span class="badge bg-secondary">{{ pastExams().length }}</span>
              </h6>
              @if (pastExams().length === 0) {
                <div class="empty-box">
                  <i class="bi bi-calendar-x"></i>
                  <p>ยังไม่มีประวัติการสอบ</p>
                </div>
              } @else {
                <div class="card">
                  <div class="table-responsive">
                    <table class="table mb-0">
                      <thead><tr><th>วิชา</th><th>ประเภท</th><th>วันที่</th><th>เวลา</th><th>ห้อง</th></tr></thead>
                      <tbody>
                        @for (e of pastExams(); track e.exam_id) {
                          <tr class="stagger-item past-row">
                            <td><code>{{ e.course_code }}</code> {{ e.course_title }}</td>
                            <td><span class="badge" [class]="e.exam_type === 'Final' ? 'bg-secondary' : 'bg-light text-dark border'">{{ e.exam_type }}</span></td>
                            <td>{{ e.exam_date | date:'EEE dd MMM yyyy' }}</td>
                            <td class="mono" style="font-size:.82rem">{{ e.start_time | slice:0:5 }} – {{ e.end_time | slice:0:5 }}</td>
                            <td>{{ e.room_number }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              }
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .schedule-grid { display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 1rem; min-height: 400px; }
    .day-column { flex: 1; min-width: 140px; }
    .day-header {
      background: var(--sidebar-bg); color: white;
      text-align: center; padding: .625rem;
      border-radius: var(--radius-md) var(--radius-md) 0 0;
      font-size: .8rem; font-weight: 600;
    }
    .schedule-block {
      background: white; border: 1.5px solid var(--accent-light);
      border-left: 3px solid var(--accent);
      border-radius: 0 0 var(--radius-sm) var(--radius-sm);
      padding: .75rem; margin-top: .5rem;
    }
    .block-code { font-family: var(--font-mono); font-size: .75rem; color: var(--accent); font-weight: 600; }
    .block-title { font-size: .82rem; font-weight: 600; margin: .2rem 0; }
    .block-time, .block-room, .block-prof { font-size: .72rem; color: var(--text-muted); display: flex; align-items: center; gap: .3rem; }
    .day-empty { text-align: center; color: var(--text-muted); padding: 2rem 0; font-size: .8rem; }
    .fw-700 { font-weight:700; }
    .mono { font-family: monospace; }
    .past-row td { opacity:.6; }
    .empty-box { text-align:center; padding:32px; color:#94a3b8; background:#f8fafc; border-radius:12px; border:1px dashed #e2e8f0; }
    .empty-box i { font-size:2rem; display:block; margin-bottom:8px; }
    .empty-box p { margin:0; font-size:.9rem; }
  `]
})
export class StudentScheduleComponent implements OnInit {
  schedule = signal<any[]>([]);
  allExams = signal<any[]>([]);
  days = DAYS;
  daysTh = DAYS_TH;
  isExam = false;

  // Split exams by date
  upcomingExams = computed(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    return this.allExams().filter(e => new Date(e.exam_date) >= today)
               .sort((a,b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime());
  });
  pastExams = computed(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    return this.allExams().filter(e => new Date(e.exam_date) < today)
               .sort((a,b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime());
  });

  scheduleByDay = () => {
    const map: Record<string, any[]> = {};
    DAYS.forEach(d => map[d] = []);
    this.schedule().forEach(s => { if (map[s.day_of_week]) map[s.day_of_week].push(s); });
    return map;
  };

  constructor(private api: StudentApiService, private router: Router) {
    this.isExam = this.router.url.includes('exams');
  }

  ngOnInit() {
    if (this.isExam) {
      this.api.getExams().subscribe(r => { if (r.data) this.allExams.set(r.data as any[]); });
    } else {
      this.api.getSchedule().subscribe(r => { if (r.data) this.schedule.set(r.data as any[]); });
    }
  }
}
