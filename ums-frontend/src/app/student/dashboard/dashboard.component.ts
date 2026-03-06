import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentApiService } from '../../core/services/student-api.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="page-container">
  <div class="page-header">
    <div>
      <h1 class="page-title">สวัสดี, {{ profile()?.first_name }} 👋</h1>
      <p class="page-subtitle">ภาพรวมการเรียนของคุณ</p>
    </div>
  </div>

  @if (loading()) {
    <div class="loading-center"><div class="spinner-border text-primary"></div></div>
  } @else {
    <!-- Stat Cards -->
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

    <!-- Upcoming Exams -->
    <div class="card mt-4">
      <div class="card-header">
        <h3 class="card-title"><i class="bi bi-calendar-event me-2 text-danger"></i>ตารางสอบที่กำลังจะมาถึง</h3>
      </div>
      <div class="card-body p-0">
        @if (upcomingExams().length === 0) {
          <div class="empty-state py-5">
            <i class="bi bi-calendar-check display-4 text-muted"></i>
            <p class="text-muted mt-3">ไม่มีตารางสอบที่กำลังจะมาถึง</p>
          </div>
        } @else {
          <table class="data-table">
            <thead><tr>
              <th>วิชา</th><th>ประเภท</th><th>วันสอบ</th><th>เวลา</th><th>ห้อง</th><th>เหลืออีก</th>
            </tr></thead>
            <tbody>
              @for (ex of upcomingExams(); track ex.exam_id) {
                <tr>
                  <td>
                    <strong>{{ ex.course_code }}</strong>
                    <div class="text-muted small">{{ ex.course_title }}</div>
                  </td>
                  <td>
                    <span class="badge" [class]="ex.exam_type === 'Midterm' ? 'bg-warning text-dark' : 'bg-danger'">
                      {{ ex.exam_type }}
                    </span>
                  </td>
                  <td>{{ ex.exam_date | date:'EEE dd MMM yyyy' }}</td>
                  <td>{{ ex.start_time | slice:0:5 }}–{{ ex.end_time | slice:0:5 }}</td>
                  <td>{{ ex.room_number }}</td>
                  <td>
                    <span class="days-badge" [class]="daysClass(ex.days_until)">
                      @if (ex.days_until === 0) { วันนี้! }
                      @else { {{ ex.days_until }} วัน }
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  }
</div>
  `,
  styles: [`
    .loading-center { display:flex; justify-content:center; padding:80px; }
    .stats-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
    .stat-card { background:#fff; border-radius:16px; padding:24px; box-shadow:0 2px 12px rgba(0,0,0,.06); border-top:4px solid #e2e8f0; }
    .stat-card.green { border-top-color:#10b981; }
    .stat-card.amber { border-top-color:#f59e0b; }
    .stat-card.blue  { border-top-color:#3b82f6; }
    .stat-card.red   { border-top-color:#ef4444; }
    .stat-icon { font-size:1.8rem; margin-bottom:10px; }
    .stat-value { font-size:2.2rem; font-weight:800; color:#1e293b; }
    .stat-label { font-size:.85rem; color:#94a3b8; margin-top:4px; font-weight:500; }
    .card { background:#fff; border-radius:16px; box-shadow:0 2px 12px rgba(0,0,0,.06); overflow:hidden; }
    .card-header { padding:20px 24px; border-bottom:1px solid #f1f5f9; }
    .card-title { font-size:1.1rem; font-weight:700; margin:0; }
    .data-table { width:100%; border-collapse:collapse; }
    .data-table th { padding:12px 16px; background:#f8fafc; font-size:.8rem; font-weight:700; color:#64748b; text-transform:uppercase; }
    .data-table td { padding:14px 16px; border-top:1px solid #f1f5f9; font-size:.9rem; }
    .empty-state { text-align:center; padding:40px; }
    .days-badge { padding:4px 10px; border-radius:20px; font-size:.8rem; font-weight:700; }
    .days-badge.urgent { background:#fee2e2; color:#dc2626; }
    .days-badge.soon   { background:#fef3c7; color:#d97706; }
    .days-badge.normal { background:#dbeafe; color:#2563eb; }
  `]
})
export class StudentDashboardComponent implements OnInit {
  private api = inject(StudentApiService);
  profile     = signal<any>(null);
  stats       = signal<any>(null);
  upcomingExams = signal<any[]>([]);
  loading     = signal(true);

  gpaClass = () => {
    const gpa = this.stats()?.gpa;
    if (gpa == null) return 'blue';
    if (gpa >= 3.0) return 'green';
    if (gpa >= 2.0) return 'amber';
    return 'red';
  };

  daysClass = (days: number) => {
    if (days <= 3) return 'urgent';
    if (days <= 7) return 'soon';
    return 'normal';
  };

  ngOnInit() {
    this.api.getDashboard().subscribe({
      next: (r: any) => {
        this.profile.set(r.data.profile);
        this.stats.set(r.data.stats);
        this.upcomingExams.set(r.data.upcomingExams);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

