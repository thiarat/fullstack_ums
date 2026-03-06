import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentApiService } from '../../core/services/student-api.service';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="main-content">
        <app-topbar title="Dashboard" [subtitle]="'สวัสดี, ' + (profile()?.first_name ?? '') + ' 👋'" />
        <div class="page-content">

          @if (loading()) {
            <div class="loading-center"><div class="spinner-border text-primary"></div></div>
          } @else {
            <div class="stats-grid">
              <div class="stat-card green">
                <div class="stat-icon"><i class="bi bi-book"></i></div>
                <div class="stat-value">{{ stats()?.enrolledCourses ?? 0 }}</div>
                <div class="stat-label">วิชาที่ลงทะเบียน</div>
              </div>
              <div class="stat-card amber">
                <div class="stat-icon"><i class="bi bi-journal-bookmark"></i></div>
                <div class="stat-value">{{ stats()?.borrowedBooks ?? 0 }}</div>
                <div class="stat-label">หนังสือที่ยืม</div>
              </div>
              <div class="stat-card" [class]="gpaClass()">
                <div class="stat-icon"><i class="bi bi-award"></i></div>
                <div class="stat-value">{{ stats()?.gpa != null ? stats()!.gpa!.toFixed(2) : '—' }}</div>
                <div class="stat-label">เกรดเฉลี่ย (GPA)</div>
              </div>
            </div>

            <div class="card mt-4">
              <div class="card-header"><h3 class="card-title"><i class="bi bi-calendar-event me-2 text-danger"></i>ตารางสอบที่กำลังจะมาถึง</h3></div>
              <div class="card-body p-0">
                @if (upcomingExams().length === 0) {
                  <div class="empty-state py-5"><i class="bi bi-calendar-check display-4 text-muted"></i><p class="text-muted mt-3">ไม่มีตารางสอบ</p></div>
                } @else {
                  <div class="table-responsive">
                    <table class="table mb-0">
                      <thead><tr><th>วิชา</th><th>ประเภท</th><th>วันสอบ</th><th>เวลา</th><th>ห้อง</th><th>เหลืออีก</th></tr></thead>
                      <tbody>
                        @for (ex of upcomingExams(); track ex.exam_id) {
                          <tr>
                            <td><strong>{{ ex.course_code }}</strong><div class="text-muted small">{{ ex.course_title }}</div></td>
                            <td><span class="badge" [class]="ex.exam_type === 'Midterm' ? 'bg-warning text-dark' : 'bg-danger'">{{ ex.exam_type }}</span></td>
                            <td>{{ ex.exam_date | date:'dd/MM/yyyy' }}</td>
                            <td>{{ ex.start_time | slice:0:5 }}–{{ ex.end_time | slice:0:5 }}</td>
                            <td>{{ ex.room_number }}</td>
                            <td><span class="badge" [class]="daysClass(ex.days_until)">{{ ex.days_until === 0 ? 'วันนี้!' : ex.days_until + ' วัน' }}</span></td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            </div>
          }

        </div>
      </div>
    </div>
  `,
  styles: [`
    .loading-center { display:flex; justify-content:center; padding:80px; }
    .stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:1rem; margin-bottom:1rem; }
    .stat-card { background:#fff; border-radius:var(--radius-lg); padding:1.25rem; box-shadow:var(--shadow-sm); border-top:4px solid #e2e8f0; }
    .stat-card.green { border-top-color:#10b981; }
    .stat-card.amber { border-top-color:#f59e0b; }
    .stat-card.blue  { border-top-color:#3b82f6; }
    .stat-card.red   { border-top-color:#ef4444; }
    .stat-icon { font-size:1.6rem; margin-bottom:.5rem; }
    .stat-value { font-size:2rem; font-weight:800; color:#1e293b; }
    .stat-label { font-size:.82rem; color:#94a3b8; margin-top:4px; }
  `]
})
export class StudentDashboardComponent implements OnInit {
  private api = inject(StudentApiService);
  profile       = signal<any>(null);
  stats         = signal<any>(null);
  upcomingExams = signal<any[]>([]);
  loading       = signal(true);

  gpaClass() {
    const gpa = this.stats()?.gpa;
    if (gpa == null) return 'blue';
    if (gpa >= 3.0) return 'green';
    if (gpa >= 2.0) return 'amber';
    return 'red';
  }
  daysClass(days: number) {
    if (days <= 3) return 'bg-danger';
    if (days <= 7) return 'bg-warning text-dark';
    return 'bg-info text-dark';
  }

  ngOnInit() {
    this.api.getDashboard().subscribe({
      next: (r: any) => {
        this.profile.set(r.data.profile);
        this.stats.set(r.data.stats);
        this.upcomingExams.set(r.data.upcomingExams ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

