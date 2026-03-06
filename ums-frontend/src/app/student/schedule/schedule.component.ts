import { Component, OnInit, signal } from '@angular/core';
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
          <div *ngIf="!isExam">
            <div class="schedule-grid">
              <div class="day-column" *ngFor="let day of days">
                <div class="day-header">{{ daysTh[day] }}</div>
                <ng-container *ngFor="let s of scheduleByDay()[day]">
                  <div class="schedule-block">
                    <div class="block-code">{{ s.course_code }}</div>
                    <div class="block-title">{{ s.course_title }}</div>
                    <div class="block-time"><i class="bi bi-clock"></i> {{ s.start_time }} – {{ s.end_time }}</div>
                    <div class="block-room"><i class="bi bi-geo-alt"></i> {{ s.room_number }}</div>
                  </div>
                </ng-container>
                <div class="day-empty" *ngIf="!scheduleByDay()[day]?.length">-</div>
              </div>
            </div>
          </div>

          <div *ngIf="isExam" class="card">
            <div class="card-header">ตารางสอบทั้งหมด</div>
            <div class="table-responsive">
              <table class="table mb-0">
                <thead><tr><th>วิชา</th><th>ประเภท</th><th>วันที่</th><th>เวลา</th><th>ห้อง</th></tr></thead>
                <tbody>
                  <tr *ngFor="let e of exams()" class="stagger-item">
                    <td><code>{{ e.course_code }}</code> {{ e.course_title }}</td>
                    <td><span class="badge" [class]="e.exam_type === 'Final' ? 'bg-danger' : 'bg-warning text-dark'">{{ e.exam_type }}</span></td>
                    <td>{{ e.exam_date | date:'EEE dd MMM yyyy' }}</td>
                    <td class="mono" style="font-size:.82rem">{{ e.start_time }} – {{ e.end_time }}</td>
                    <td>{{ e.room_number }}</td>
                  </tr>
                </tbody>
              </table>
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
    .block-time, .block-room { font-size: .72rem; color: var(--text-muted); display: flex; align-items: center; gap: .3rem; }
    .day-empty { text-align: center; color: var(--text-muted); padding: 2rem 0; font-size: .8rem; }
  `]
})
export class StudentScheduleComponent implements OnInit {
  schedule = signal<any[]>([]);
  exams = signal<any[]>([]);
  days = DAYS;
  daysTh = DAYS_TH;
  isExam = false;

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
      this.api.getExams().subscribe(r => { if (r.data) this.exams.set(r.data as any[]); });
    } else {
      this.api.getSchedule().subscribe(r => { if (r.data) this.schedule.set(r.data as any[]); });
    }
  }
}
