import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { StudentApiService } from '../../core/services/student-api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="main-content">
        <app-topbar title="Dashboard" [subtitle]="'สวัสดี, ' + (auth.user()?.first_name ?? '')" />
        <div class="page-content">
          <div *ngIf="loading()" class="loading-overlay"><div class="spinner-border"></div></div>
          <ng-container *ngIf="!loading() && data()">
            <!-- Stats -->
            <div class="row g-3 mb-4">
              <div class="col-6 col-md-3 stagger-item">
                <div class="stat-card">
                  <div class="stat-icon"><i class="bi bi-book"></i></div>
                  <div class="stat-value">{{ data().stats.enrolledCourses }}</div>
                  <div class="stat-label">วิชาที่ลงทะเบียน</div>
                </div>
              </div>
              <div class="col-6 col-md-3 stagger-item">
                <div class="stat-card amber">
                  <div class="stat-icon" style="background:#fef3c7;color:#b45309"><i class="bi bi-bookmark-check"></i></div>
                  <div class="stat-value">{{ data().stats.borrowedBooks }}</div>
                  <div class="stat-label">หนังสือที่ยืม</div>
                </div>
              </div>
            </div>

            <!-- Upcoming Exams -->
            <div class="card fade-in-up">
              <div class="card-header d-flex align-items-center gap-2">
                <i class="bi bi-calendar-event text-danger"></i> สอบที่กำลังจะมาถึง (30 วัน)
              </div>
              <div class="card-body p-0">
                <div class="table-responsive">
                  <table class="table mb-0">
                    <thead><tr><th>วิชา</th><th>ประเภท</th><th>วันที่</th><th>เวลา</th><th>ห้อง</th></tr></thead>
                    <tbody>
                      <tr *ngFor="let e of data().upcomingExams" class="stagger-item">
                        <td><code>{{ e.course_code }}</code> <span class="text-muted">{{ e.course_title }}</span></td>
                        <td><span class="badge" [class]="e.exam_type === 'Final' ? 'bg-danger' : 'bg-warning text-dark'">{{ e.exam_type }}</span></td>
                        <td>{{ e.exam_date | date:'EEE dd MMM':'':'th' }}</td>
                        <td class="mono" style="font-size:.82rem">{{ e.start_time }} – {{ e.end_time }}</td>
                        <td>{{ e.room_number }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="empty-state" *ngIf="!data().upcomingExams.length">
                  <i class="bi bi-calendar-check"></i><p>ไม่มีการสอบในอีก 30 วัน</p>
                </div>
              </div>
            </div>
          </ng-container>
        </div>
      </div>
    </div>
  `
})
export class StudentDashboardComponent implements OnInit {
  loading = signal(true);
  data = signal<any>(null);
  constructor(public auth: AuthService, private api: StudentApiService) {}
  ngOnInit() {
    this.api.getDashboard().subscribe({
      next: r => { if (r.data) this.data.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
