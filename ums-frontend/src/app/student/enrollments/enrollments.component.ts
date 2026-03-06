import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { StudentApiService } from '../../core/services/student-api.service';

@Component({
  selector: 'app-student-enrollments',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="main-content">
        <app-topbar title="ลงทะเบียนเรียน" subtitle="รายวิชาที่ลงทะเบียน" />
        <div class="page-content">
          <ul class="nav nav-tabs mb-3">
            <li class="nav-item">
              <button class="nav-link" [class.active]="tab() === 'my'" (click)="tab.set('my')">วิชาของฉัน</button>
            </li>
            <li class="nav-item">
              <button class="nav-link" [class.active]="tab() === 'available'" (click)="tab.set('available'); loadAvailable()">เพิ่มรายวิชา</button>
            </li>
          </ul>

          <!-- My Enrollments -->
          <div *ngIf="tab() === 'my'">
            <div class="card">
              <div class="table-responsive">
                <table class="table">
                  <thead><tr><th>รหัสวิชา</th><th>ชื่อวิชา</th><th>หน่วยกิต</th><th>แผนก</th><th>อาจารย์</th><th>เกรด</th><th></th></tr></thead>
                  <tbody>
                    <tr *ngFor="let e of enrollments()" class="stagger-item">
                      <td><code>{{ e.course_code }}</code></td>
                      <td><strong>{{ e.title }}</strong></td>
                      <td>{{ e.credits }}</td>
                      <td>{{ e.department }}</td>
                      <td class="text-muted" style="font-size:.82rem">{{ e.professor_name || '-' }}</td>
                      <td>
                        <span *ngIf="e.grade" class="badge" [class]="gradeColor(e.grade)">{{ e.grade }}</span>
                        <span *ngIf="!e.grade" class="text-muted">-</span>
                      </td>
                      <td>
                        <button class="btn btn-sm btn-outline-danger" (click)="withdraw(e)"
                                *ngIf="!e.grade">ถอน</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Available Courses -->
          <div *ngIf="tab() === 'available'">
            <div class="d-flex gap-2 mb-3 align-items-center">
              <label class="form-label mb-0">ภาคเรียน:</label>
              <input type="text" class="form-control" style="max-width:120px" [(ngModel)]="semester" placeholder="1/2567">
            </div>
            <div class="row g-3">
              <div class="col-md-6 col-lg-4 stagger-item" *ngFor="let c of available()">
                <div class="card h-100">
                  <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                      <code class="text-primary">{{ c.course_code }}</code>
                      <span class="badge bg-primary">{{ c.credits }} หน่วยกิต</span>
                    </div>
                    <h6 class="mt-2 mb-1">{{ c.title }}</h6>
                    <div class="text-muted" style="font-size:.8rem">
                      <div><i class="bi bi-person me-1"></i>{{ c.professor_name || 'ยังไม่มีอาจารย์' }}</div>
                      <div *ngIf="c.day_of_week"><i class="bi bi-clock me-1"></i>{{ c.day_of_week }} {{ c.start_time }}–{{ c.end_time }}</div>
                    </div>
                    <button class="btn btn-sm btn-primary w-100 mt-3" (click)="enroll(c.course_id)" [disabled]="!semester">
                      ลงทะเบียน
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StudentEnrollmentsComponent implements OnInit {
  tab = signal<'my'|'available'>('my');
  enrollments = signal<any[]>([]);
  available = signal<any[]>([]);
  semester = '1/2567';
  conflictError = signal('');

  constructor(private api: StudentApiService) {}
  ngOnInit() { this.loadMy(); }

  loadMy() {
    this.api.getEnrollments().subscribe(r => { if (r.data) this.enrollments.set(r.data as any[]); });
  }

  loadAvailable() {
    this.api.getAvailableCourses().subscribe(r => { if (r.data) this.available.set(r.data as any[]); });
  }

  enroll(courseId: number) {
    if (!this.semester) return;
    this.conflictError.set('');
    this.api.enrollCourse(courseId, this.semester).subscribe({
      next: () => { this.loadMy(); this.loadAvailable(); this.tab.set('my'); },
      error: (e: any) => {
        const msg = e?.error?.message || 'เกิดข้อผิดพลาด';
        this.conflictError.set(msg);
        setTimeout(() => this.conflictError.set(''), 6000);
      }
    });
  }

  withdraw(e: any) {
    if (confirm(`ถอน ${e.course_code}?`))
      this.api.withdrawCourse(e.enrollment_id).subscribe(() => this.loadMy());
  }

  gradeColor(g: string) {
    if (['A','B+','B'].includes(g)) return 'bg-success';
    if (['C+','C'].includes(g)) return 'bg-warning text-dark';
    if (['D+','D'].includes(g)) return 'bg-secondary';
    if (g === 'F') return 'bg-danger';
    return 'bg-light text-dark border';
  }
}
