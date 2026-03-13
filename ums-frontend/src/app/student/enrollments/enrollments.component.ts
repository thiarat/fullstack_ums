import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { StudentApiService } from '../../core/services/student-api.service';

const DAY_TH: Record<string,string> = {
  Monday:'จันทร์', Tuesday:'อังคาร', Wednesday:'พุธ',
  Thursday:'พฤหัส', Friday:'ศุกร์', Saturday:'เสาร์', Sunday:'อาทิตย์'
};

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
              <button class="nav-link" [class.active]="tab() === 'available'" (click)="switchToAvailable()">เพิ่มรายวิชา</button>
            </li>
          </ul>

          <!-- My Enrollments -->
          <div *ngIf="tab() === 'my'">
            <!-- Active enrollments -->
            <h6 class="fw-700 mb-2 text-dark">
              <i class="bi bi-journal-check me-1 text-success"></i>วิชาที่เรียน
              <span class="badge bg-success ms-2">{{ activeEnrollments().length }}</span>
            </h6>
            <div class="card mb-4">
              <div class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th>รหัสวิชา</th><th>ชื่อวิชา</th><th>หน่วยกิต</th>
                      <th>แผนก</th><th>อาจารย์</th><th>วัน/เวลา</th><th>เกรด</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let e of activeEnrollments()" class="stagger-item">
                      <td><code>{{ e.course_code }}</code></td>
                      <td><strong>{{ e.title }}</strong></td>
                      <td>{{ e.credits }}</td>
                      <td>{{ e.department }}</td>
                      <td class="text-muted" style="font-size:.82rem">{{ e.professor_name || '-' }}</td>
                      <td class="text-muted" style="font-size:.78rem">
                        <span *ngIf="e.day_of_week">{{ dayTh(e.day_of_week) }} {{ e.start_time | slice:0:5 }}–{{ e.end_time | slice:0:5 }}</span>
                        <span *ngIf="!e.day_of_week">-</span>
                      </td>
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
              <div class="empty-state" *ngIf="!activeEnrollments().length">
                <i class="bi bi-journal-x"></i><p>ยังไม่มีรายวิชา</p>
              </div>
            </div>

            <!-- Withdrawn enrollments -->
            <div *ngIf="withdrawnEnrollments().length > 0">
              <h6 class="fw-700 mb-2 text-muted">
                <i class="bi bi-journal-x me-1 text-danger"></i>วิชาที่ถอน
                <span class="badge bg-secondary ms-2">{{ withdrawnEnrollments().length }}</span>
              </h6>
              <div class="card">
                <div class="table-responsive">
                  <table class="table">
                    <thead>
                      <tr>
                        <th>รหัสวิชา</th><th>ชื่อวิชา</th><th>หน่วยกิต</th>
                        <th>แผนก</th><th>อาจารย์</th><th>วัน/เวลา</th><th>เกรด</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let e of withdrawnEnrollments()" class="stagger-item withdrawn-row">
                        <td><code>{{ e.course_code }}</code></td>
                        <td class="text-muted">{{ e.title }}</td>
                        <td>{{ e.credits }}</td>
                        <td>{{ e.department }}</td>
                        <td class="text-muted" style="font-size:.82rem">{{ e.professor_name || '-' }}</td>
                        <td class="text-muted" style="font-size:.78rem">
                          <span *ngIf="e.day_of_week">{{ dayTh(e.day_of_week) }} {{ e.start_time | slice:0:5 }}–{{ e.end_time | slice:0:5 }}</span>
                          <span *ngIf="!e.day_of_week">-</span>
                        </td>
                        <td><span class="badge bg-secondary">W</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- Available Courses -->
          <div *ngIf="tab() === 'available'">
            <div class="d-flex gap-2 mb-3 flex-wrap align-items-center">
              <div class="d-flex align-items-center gap-2">
                <label class="form-label mb-0 text-nowrap">ภาคเรียน:</label>
                <input type="text" class="form-control" style="max-width:110px" [(ngModel)]="semester" placeholder="1/2567">
              </div>
              <div class="search-box" style="flex:1;max-width:280px">
                <i class="bi bi-search"></i>
                <input class="form-control" [(ngModel)]="courseSearch" (ngModelChange)="applyFilter()"
                       placeholder="ค้นหารายวิชา, อาจารย์...">
              </div>
              <select class="form-select" style="max-width:200px" [(ngModel)]="deptFilter" (ngModelChange)="applyFilter()">
                <option value="">ทุกแผนก</option>
                <option *ngFor="let d of depts()" [value]="d">{{ d }}</option>
              </select>
            </div>

            <div class="alert alert-danger d-flex align-items-center gap-2" *ngIf="conflictError()">
              <i class="bi bi-exclamation-triangle-fill"></i>
              {{ conflictError() }}
            </div>

            <div class="row g-3">
              <div class="col-md-6 col-lg-4 stagger-item" *ngFor="let c of filtered()">
                <div class="card h-100" [class.enrolled-card]="isEnrolled(c)">
                  <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-1">
                      <code class="text-primary fw-bold">{{ c.course_code }}</code>
                      <div class="d-flex gap-1 align-items-center">
                        <span class="badge bg-primary">{{ c.credits }} หน่วยกิต</span>
                        <span class="badge bg-success" *ngIf="isEnrolled(c)">ลงแล้ว ✓</span>
                      </div>
                    </div>
                    <h6 class="mb-1 fw-700">{{ c.title }}</h6>
                    <div class="text-muted" style="font-size:.8rem">
                      <div><i class="bi bi-building me-1"></i>{{ c.department || '-' }}</div>
                      <div><i class="bi bi-person me-1"></i>{{ c.professor_name || 'ยังไม่มีอาจารย์' }}</div>
                      <div *ngIf="c.day_of_week" [class.text-danger]="hasTimeConflict(c)">
                        <i class="bi bi-clock me-1"></i>{{ dayTh(c.day_of_week) }}
                        {{ c.start_time | slice:0:5 }}–{{ c.end_time | slice:0:5 }}
                        <i class="bi bi-exclamation-triangle-fill text-danger ms-1" *ngIf="hasTimeConflict(c)" title="เวลาทับกับวิชาที่ลงแล้ว"></i>
                      </div>
                    </div>
                    <button class="btn btn-sm w-100 mt-3"
                            [class]="isEnrolled(c) ? 'btn-secondary' : hasTimeConflict(c) ? 'btn-outline-danger' : 'btn-primary'"
                            [disabled]="isEnrolled(c) || !semester"
                            (click)="enroll(c)">
                      <span *ngIf="isEnrolled(c)">ลงทะเบียนแล้ว</span>
                      <span *ngIf="!isEnrolled(c) && hasTimeConflict(c)">เวลาทับกัน</span>
                      <span *ngIf="!isEnrolled(c) && !hasTimeConflict(c)">ลงทะเบียน</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="empty-state" *ngIf="!filtered().length && !loadingAvail()">
              <i class="bi bi-search"></i><p>ไม่พบรายวิชา</p>
            </div>
            <div class="text-center py-4" *ngIf="loadingAvail()">
              <div class="spinner-border text-primary"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-box { position:relative; }
    .search-box i { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#94a3b8; z-index:1; }
    .search-box .form-control { padding-left:36px; }
    .enrolled-card { border-color:#bbf7d0 !important; background:#f0fdf4; }
    .fw-700 { font-weight:700; }
    .empty-state { text-align:center; padding:60px; color:#94a3b8; }
    .empty-state i { font-size:2.5rem; display:block; margin-bottom:12px; }
    .withdrawn-row td { opacity:.55; }
  `]
})
export class StudentEnrollmentsComponent implements OnInit {
  tab = signal<'my'|'available'>('my');
  allEnrollments   = signal<any[]>([]);
  available        = signal<any[]>([]);
  filtered         = signal<any[]>([]);
  depts            = signal<string[]>([]);
  loadingAvail     = signal(false);
  semester         = '1/2568';
  courseSearch     = '';
  deptFilter       = '';
  conflictError    = signal('');

  dayTh = (d: string) => DAY_TH[d] || d;

  // Split active vs withdrawn
  activeEnrollments   = computed(() => this.allEnrollments().filter(e => e.grade !== 'W'));
  withdrawnEnrollments = computed(() => this.allEnrollments().filter(e => e.grade === 'W'));

  constructor(private api: StudentApiService) {}
  ngOnInit() { this.loadMy(); }

  switchToAvailable() {
    this.tab.set('available');
    if (!this.available().length) this.loadAvailable();
  }

  loadMy() {
    this.api.getEnrollments().subscribe(r => {
      if (r.data) this.allEnrollments.set(r.data as any[]);
    });
  }

  loadAvailable() {
    this.loadingAvail.set(true);
    this.api.getAvailableCourses().subscribe(r => {
      const data = (r.data as any) ?? [];
      this.available.set(data);
      const ds = [...new Set(data.map((c: any) => c.department).filter(Boolean))] as string[];
      this.depts.set(ds.sort());
      this.applyFilter();
      this.loadingAvail.set(false);
    });
  }

  applyFilter() {
    let result = this.available();
    if (this.deptFilter) result = result.filter(c => c.department === this.deptFilter);
    if (this.courseSearch) {
      const q = this.courseSearch.toLowerCase();
      result = result.filter(c =>
        c.title?.toLowerCase().includes(q) ||
        c.course_code?.toLowerCase().includes(q) ||
        c.professor_name?.toLowerCase().includes(q)
      );
    }
    this.filtered.set(result);
  }

  // Check enrollment by schedule_id (each section is unique)
  isEnrolled(c: any): boolean {
    return this.activeEnrollments().some(e => e.schedule_id === c.schedule_id);
  }

  hasTimeConflict(c: any): boolean {
    if (!c.day_of_week || !c.start_time || !c.end_time) return false;
    const toMin = (t: string) => { const [h,m] = t.split(':').map(Number); return h*60+m; };
    const cStart = toMin(c.start_time), cEnd = toMin(c.end_time);
    return this.activeEnrollments().some(e => {
      if (e.day_of_week !== c.day_of_week || !e.start_time || !e.end_time) return false;
      const eStart = toMin(e.start_time), eEnd = toMin(e.end_time);
      return cStart < eEnd && cEnd > eStart;
    });
  }

  enroll(c: any) {
    if (!this.semester || this.isEnrolled(c)) return;
    this.conflictError.set('');
    // Pass schedule_id to enroll in this specific section/professor
    this.api.enrollCourse(c.course_id, this.semester, c.schedule_id).subscribe({
      next: () => { this.loadMy(); this.loadAvailable(); this.tab.set('my'); },
      error: (e: any) => {
        const msg = e?.error?.message || 'เกิดข้อผิดพลาด';
        this.conflictError.set(msg);
        setTimeout(() => this.conflictError.set(''), 8000);
      }
    });
  }

  withdraw(e: any) {
    if (confirm(`ถอนวิชา ${e.course_code} (${e.professor_name || '-'})?`))
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
