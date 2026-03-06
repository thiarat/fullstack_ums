import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { ProfessorApiService } from '../../core/services/professor-api.service';

@Component({
  selector: 'app-prof-courses',
  standalone: true,
  imports: [CommonModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="main-content">
        <app-topbar title="รายวิชาของฉัน" subtitle="รายวิชาที่รับผิดชอบ" />
        <div class="page-content">
          <div class="row g-3">
            <div class="col-md-6 col-lg-4 stagger-item" *ngFor="let c of courses()">
              <div class="card course-card h-100" (click)="selectCourse(c)" [class.selected]="selected()?.course_id === c.course_id">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start">
                    <code class="text-primary fs-6">{{ c.course_code }}</code>
                    <span class="badge bg-primary">{{ c.credits }} หน่วยกิต</span>
                  </div>
                  <h5 class="mt-2 mb-1">{{ c.title }}</h5>
                  <div class="text-muted" style="font-size:.82rem" *ngIf="c.day_of_week">
                    <i class="bi bi-clock me-1"></i>{{ c.day_of_week }} {{ c.start_time }}–{{ c.end_time }}
                    <span class="ms-2"><i class="bi bi-geo-alt me-1"></i>{{ c.room_number }}</span>
                  </div>
                  <div class="mt-3 d-flex align-items-center gap-2">
                    <i class="bi bi-people"></i>
                    <span>{{ c.enrolled_students }} นักศึกษา</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Student List -->
          <div class="card mt-4" *ngIf="selected()">
            <div class="card-header">
              <i class="bi bi-people me-2"></i>นักศึกษาใน {{ selected().course_code }} – {{ selected().title }}
            </div>
            <div class="table-responsive">
              <table class="table mb-0">
                <thead><tr><th>รหัสนักศึกษา</th><th>ชื่อ-นามสกุล</th><th>Email</th><th>เกรด</th></tr></thead>
                <tbody>
                  <tr *ngFor="let s of students()" class="stagger-item">
                    <td><code>{{ s.student_code }}</code></td>
                    <td>{{ s.first_name }} {{ s.last_name }}</td>
                    <td class="text-muted" style="font-size:.82rem">{{ s.email }}</td>
                    <td>
                      <span *ngIf="s.grade" class="badge bg-success">{{ s.grade }}</span>
                      <span *ngIf="!s.grade" class="text-muted">ยังไม่มีเกรด</span>
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
    .course-card { cursor: pointer; transition: transform .2s, border-color .2s; }
    .course-card:hover { transform: translateY(-2px); }
    .course-card.selected { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(59,130,246,.15); }
  `]
})
export class ProfCoursesComponent implements OnInit {
  courses = signal<any[]>([]);
  selected = signal<any>(null);
  students = signal<any[]>([]);

  constructor(private api: ProfessorApiService) {}
  ngOnInit() { this.api.getMyCourses().subscribe(r => { if (r.data) this.courses.set(r.data as any[]); }); }

  selectCourse(c: any) {
    this.selected.set(c);
    this.api.getCourseStudents(c.course_id).subscribe(r => { if (r.data) this.students.set(r.data as any[]); });
  }
}
