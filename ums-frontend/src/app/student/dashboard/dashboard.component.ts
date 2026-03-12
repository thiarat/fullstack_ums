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
    
.loading-center { 
  display: flex; justify-content: center; align-items: center; 
  padding: 80px; color: #3b82f6; 
}


.stats-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); 
  gap: 1.5rem; 
  margin-bottom: 2rem; 
}


.stat-card { 
  background: #ffffff; 
  border-radius: 1.25rem; 
  padding: 1.5rem; 
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  
  box-shadow: 
    0 10px 15px -3px rgba(0, 0, 0, 0.05), 
    0 4px 6px -2px rgba(0, 0, 0, 0.025), 
    0 25px 50px -12px rgba(59, 130, 246, 0.1), 
    inset 0 1px 2px rgba(255,255,255,0.9);
  
  border: 1px solid rgba(255, 255, 255, 0.6);
  z-index: 1;
}


.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.05), 
    0 10px 10px -5px rgba(0, 0, 0, 0.02),
    0 30px 60px -15px rgba(59, 130, 246, 0.15),
    inset 0 1px 2px rgba(255,255,255,1);
}


.stat-card::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 6px;
  transition: width 0.3s ease;
}
.stat-card:hover::before { width: 8px; }


.stat-card.green::before { background: linear-gradient(to bottom, #34d399, #10b981); }
.stat-card.amber::before { background: linear-gradient(to bottom, #fbbf24, #f59e0b); }
.stat-card.blue::before  { background: linear-gradient(to bottom, #60a5fa, #3b82f6); }
.stat-card.red::before   { background: linear-gradient(to bottom, #f87171, #ef4444); }


.stat-icon { 
  display: inline-flex; align-items: center; justify-content: center;
  width: 52px; height: 52px; 
  border-radius: 1rem; 
  font-size: 1.5rem; 
  margin-bottom: 1.2rem;
}


.stat-card.green .stat-icon { color: #10b981; background: #ecfdf5; box-shadow: 0 4px 10px rgba(16,185,129,0.2), inset 0 2px 4px rgba(255,255,255,0.8); }
.stat-card.amber .stat-icon { color: #f59e0b; background: #fffbeb; box-shadow: 0 4px 10px rgba(245,158,11,0.2), inset 0 2px 4px rgba(255,255,255,0.8); }
.stat-card.blue .stat-icon  { color: #3b82f6; background: #eff6ff; box-shadow: 0 4px 10px rgba(59,130,246,0.2), inset 0 2px 4px rgba(255,255,255,0.8); }
.stat-card.red .stat-icon   { color: #ef4444; background: #fef2f2; box-shadow: 0 4px 10px rgba(239,68,68,0.2), inset 0 2px 4px rgba(255,255,255,0.8); }


.stat-value { 
  font-size: 2.25rem; 
  font-weight: 800; 
  color: #0f172a; 
  line-height: 1.1;
  text-shadow: 0 2px 4px rgba(0,0,0,0.05); 
}
.stat-label { 
  font-size: 0.95rem; 
  font-weight: 500; 
  color: #64748b; 
  margin-top: 8px; 
}
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
