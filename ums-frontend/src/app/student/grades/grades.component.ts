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
          <div class="row g-3 mb-4" *ngIf="gradeData()">
            <div class="col-auto">
              <div class="gpa-card">
                <div class="gpa-label">GPA</div>
                <div class="gpa-value" [class]="gpaColor()">{{ gradeData().gpa ?? 'N/A' }}</div>
              </div>
            </div>
            <div class="col-auto">
              <div class="gpa-card">
                <div class="gpa-label">หน่วยกิตสะสม</div>
                <div class="gpa-value text-primary">{{ gradeData().totalCredits }}</div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">ผลการเรียนรายวิชา</div>
            <div class="table-responsive">
              <table class="table mb-0">
                <thead><tr><th>รหัสวิชา</th><th>ชื่อวิชา</th><th>หน่วยกิต</th><th>ภาคเรียน</th><th>เกรด</th></tr></thead>
                <tbody>
                  <tr *ngFor="let g of gradeData()?.grades" class="stagger-item">
                    <td><code>{{ g.course_code }}</code></td>
                    <td>{{ g.title }}</td>
                    <td>{{ g.credits }}</td>
                    <td>{{ g.semester }}</td>
                    <td>
                      <span *ngIf="g.grade" class="badge fs-6 px-3 py-2" [class]="gradeColor(g.grade)">{{ g.grade }}</span>
                      <span *ngIf="!g.grade" class="text-muted">ยังไม่มีเกรด</span>
                    </td>
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
    .gpa-card {
      background: white; border: 1.5px solid var(--border); border-radius: var(--radius-lg);
      padding: 1.25rem 2rem; text-align: center; box-shadow: var(--shadow-sm);
    }
    .gpa-label { font-size: .72rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--text-muted); margin-bottom: .25rem; }
    .gpa-value { font-size: 2.5rem; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1; }
    .gpa-good  { color: #10b981; }
    .gpa-avg   { color: #f59e0b; }
    .gpa-low   { color: #ef4444; }
  `]
})
export class StudentGradesComponent implements OnInit {
  gradeData = signal<any>(null);
  constructor(private api: StudentApiService) {}
  ngOnInit() {
    this.api.getGrades().subscribe(r => { if (r.data) this.gradeData.set(r.data); });
  }
  gpaColor() {
    const gpa = parseFloat(this.gradeData()?.gpa);
    if (gpa >= 3.0) return 'gpa-good';
    if (gpa >= 2.0) return 'gpa-avg';
    return 'gpa-low';
  }
  gradeColor(g: string) {
    if (['A','B+','B'].includes(g)) return 'bg-success';
    if (['C+','C'].includes(g)) return 'bg-warning text-dark';
    if (['D+','D'].includes(g)) return 'bg-secondary';
    if (g === 'F') return 'bg-danger';
    return 'bg-light text-dark border';
  }
}
