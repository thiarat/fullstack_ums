import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { ProfessorApiService } from '../../core/services/professor-api.service';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAYS_TH: Record<string,string> = {
  Monday:'จันทร์', Tuesday:'อังคาร', Wednesday:'พุธ',
  Thursday:'พฤหัส', Friday:'ศุกร์', Saturday:'เสาร์', Sunday:'อาทิตย์'
};

@Component({
  selector: 'app-prof-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="main-content">
        <app-topbar title="ตารางสอน" subtitle="ตารางสอนรายสัปดาห์" />
        <div class="page-content">
          <div class="schedule-grid">
            <div class="day-column" *ngFor="let day of days">
              <div class="day-header">{{ daysTh[day] }}</div>
              <div class="schedule-block" *ngFor="let s of byDay()[day]">
                <div class="block-code">{{ s.course_code }}</div>
                <div class="block-title">{{ s.title }}</div>
                <div class="block-time"><i class="bi bi-clock"></i> {{ s.start_time }}–{{ s.end_time }}</div>
                <div class="block-room"><i class="bi bi-geo-alt"></i> {{ s.room_number }}</div>
                <div class="block-students"><i class="bi bi-people"></i> {{ s.enrolled_students }} คน</div>
              </div>
              <div class="day-empty" *ngIf="!byDay()[day]?.length">-</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .schedule-grid { display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 1rem; min-height: 400px; }
    .day-column { flex: 1; min-width: 140px; }
    .day-header { background: var(--sidebar-bg); color: white; text-align: center; padding: .625rem; border-radius: var(--radius-md) var(--radius-md) 0 0; font-size: .8rem; font-weight: 600; }
    .schedule-block { background: white; border: 1.5px solid #d1fae5; border-left: 3px solid #10b981; border-radius: 0 0 var(--radius-sm) var(--radius-sm); padding: .75rem; margin-top: .5rem; }
    .block-code { font-family: var(--font-mono); font-size: .75rem; color: #065f46; font-weight: 600; }
    .block-title { font-size: .82rem; font-weight: 600; margin: .2rem 0; }
    .block-time, .block-room, .block-students { font-size: .72rem; color: var(--text-muted); display: flex; align-items: center; gap: .3rem; }
    .day-empty { text-align: center; color: var(--text-muted); padding: 2rem 0; font-size: .8rem; }
  `]
})
export class ProfScheduleComponent implements OnInit {
  schedule = signal<any[]>([]);
  days = DAYS; daysTh = DAYS_TH;
  byDay = () => {
    const map: Record<string, any[]> = {};
    DAYS.forEach(d => map[d] = []);
    this.schedule().forEach(s => { if (map[s.day_of_week]) map[s.day_of_week].push(s); });
    return map;
  };
  constructor(private api: ProfessorApiService) {}
  ngOnInit() { this.api.getSchedule().subscribe(r => { if (r.data) this.schedule.set(r.data as any[]); }); }
}
