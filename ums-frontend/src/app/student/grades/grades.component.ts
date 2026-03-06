import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { StudentApiService } from '../../core/services/student-api.service';

@Component({
  selector: 'app-student-grades',
  standalone: true,
  imports: [CommonModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="main-content">
        <app-topbar title="ผลการเรียน" subtitle="GPA และเกรดรายวิชา" />
        <div class="page-content">

          @if (gradeData()) {
            <div class="d-flex gap-3 mb-4 flex-wrap">
              <div class="stat-card">
                <div class="stat-label">GPA สะสม</div>
                <div class="stat-val" [class]="gpaClass()">
                  {{ gradeData().gpa != null ? gradeData().gpa : 'N/A' }}
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-label">หน่วยกิตสะสม</div>
                <div class="stat-val text-primary">{{ gradeData().totalCredits ?? 0 }}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">รายวิชาทั้งหมด</div>
                <div class="stat-val text-secondary">{{ gradeData().grades?.length ?? 0 }}</div>
              </div>
            </div>
          }

          <div class="card">
            <div class="card-header">ผลการเรียนรายวิชา</div>
            <div *ngIf="loading()" class="loading-overlay"><div class="spinner-border"></div></div>
            <div class="table-responsive" *ngIf="!loading()">
              <table class="table mb-0">
                <thead>
                  <tr><th>รหัสวิชา</th><th>ชื่อวิชา</th><th>หน่วยกิต</th><th>ภาคเรียน</th><th>เกรด</th></tr>
                </thead>
                <tbody>
                  <tr *ngFor="let g of gradeData()?.grades" class="stagger-item">
                    <td><code>{{ g.course_code }}</code></td>
                    <td>{{ g.title }}</td>
                    <td class="text-center">{{ g.credits }}</td>
                    <td class="text-muted" style="font-size:.82rem">{{ g.semester }}</td>
                    <td>
                      <span *ngIf="g.grade" class="badge grade-badge" [class]="gradeClass(g.grade)">{{ g.grade }}</span>
                      <span *ngIf="!g.grade" class="text-muted small">รอประกาศ</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="empty-state" *ngIf="!loading() && !gradeData()?.grades?.length">
              <i class="bi bi-journal-x"></i><p>ยังไม่มีผลการเรียน</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      background: white; border: 1.5px solid var(--border); border-radius: var(--radius-lg);
      padding: 1.25rem 2rem; text-align: center; box-shadow: var(--shadow-sm); min-width: 140px;
    }
    .stat-label { font-size: .72rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--text-muted); margin-bottom: .25rem; }
    .stat-val { font-size: 2.25rem; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1; }
    .gpa-good { color: #10b981; }
    .gpa-avg  { color: #f59e0b; }
    .gpa-low  { color: #ef4444; }
    .gpa-na   { color: #94a3b8; }
    .grade-badge { font-size: .85rem; padding: .3rem .65rem; }
    .bg-A   { background:#10b981;color:white } .bg-Bp  { background:#3b82f6;color:white }
    .bg-B   { background:#6366f1;color:white } .bg-Cp  { background:#8b5cf6;color:white }
    .bg-C   { background:#f59e0b;color:white } .bg-Dp  { background:#f97316;color:white }
    .bg-D   { background:#ef4444;color:white } .bg-F   { background:#dc2626;color:white }
    .bg-W   { background:#94a3b8;color:white } .bg-I   { background:#64748b;color:white }
  `]
})
export class StudentGradesComponent implements OnInit {
  gradeData = signal<any>(null);
  loading = signal(true);

  constructor(private api: StudentApiService) {}

  ngOnInit() {
    this.api.getGrades().subscribe({
      next: r => { if (r.data) this.gradeData.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  gpaClass() {
    const gpa = this.gradeData()?.gpa;
    if (gpa == null) return 'gpa-na';
    if (gpa >= 3.0) return 'gpa-good';
    if (gpa >= 2.0) return 'gpa-avg';
    return 'gpa-low';
  }

  gradeClass(g: string) {
    const map: Record<string, string> = {
      'A': 'bg-A', 'B+': 'bg-Bp', 'B': 'bg-B', 'C+': 'bg-Cp',
      'C': 'bg-C', 'D+': 'bg-Dp', 'D': 'bg-D', 'F': 'bg-F', 'W': 'bg-W', 'I': 'bg-I'
    };
    return map[g] ?? 'bg-secondary';
  }
}
