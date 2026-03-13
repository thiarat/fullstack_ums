import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { AdminApiService } from '../../core/services/admin-api.service';

const DAY_TH: Record<string,string> = {
  Monday:'จันทร์', Tuesday:'อังคาร', Wednesday:'พุธ',
  Thursday:'พฤหัส', Friday:'ศุกร์', Saturday:'เสาร์', Sunday:'อาทิตย์'
};

@Component({
  selector: 'app-admin-courses-profs',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="main-content">
        <app-topbar title="รายวิชา - อาจารย์" subtitle="รายการวิชาและอาจารย์ผู้สอนทั้งหมด" />
        <div class="page-content">

          <div class="d-flex gap-2 mb-3 flex-wrap">
            <div class="search-box" style="max-width:320px;flex:1">
              <i class="bi bi-search"></i>
              <input class="form-control" [(ngModel)]="search" (ngModelChange)="onFilterChange()" placeholder="ค้นหารหัสวิชา, ชื่อ, อาจารย์...">
            </div>
            <select class="form-select" style="max-width:200px" [(ngModel)]="deptFilter" (ngModelChange)="onFilterChange()">
              <option value="">ทุกแผนก</option>
              <option *ngFor="let d of depts()" [value]="d.dept_id">{{ d.name }}</option>
            </select>
          </div>

          <div class="card">
            <div *ngIf="loading()" class="loading-overlay"><div class="spinner-border"></div></div>
            <div class="table-responsive" *ngIf="!loading()">
              <table class="table">
                <thead>
                  <tr>
                    <th>รหัสวิชา</th>
                    <th>ชื่อวิชา</th>
                    <th>ชื่ออาจารย์</th>
                    <th>หน่วยกิต</th>
                    <th>แผนก</th>
                    <th class="text-center">นักศึกษา</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let row of rows()" class="stagger-item clickable-row" (click)="viewStudents(row)">
                    <td><code>{{ row.course_code }}</code></td>
                    <td><strong>{{ row.title }}</strong></td>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <div class="avatar-xs">{{ row.professor_name?.[0] || '?' }}</div>
                        <div>
                          <div class="fw-600">{{ row.professor_name || '(ยังไม่ระบุ)' }}</div>
                          <div class="text-muted" style="font-size:.75rem" *ngIf="row.day_of_week">
                            {{ dayTh(row.day_of_week) }} {{ row.start_time | slice:0:5 }}–{{ row.end_time | slice:0:5 }}
                            <span *ngIf="row.room_number"> · ห้อง {{ row.room_number }}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td><span class="badge bg-primary">{{ row.credits }} หน่วยกิต</span></td>
                    <td><span class="badge bg-light text-dark border">{{ row.department }}</span></td>
                    <td class="text-center">
                      <span class="badge bg-info">{{ row.enrolled_students ?? 0 }} คน</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="empty-state" *ngIf="!loading() && !rows().length">
              <i class="bi bi-person-video2"></i><p>ยังไม่มีข้อมูล</p>
            </div>
          </div>

          <div class="d-flex justify-content-between align-items-center mt-3" *ngIf="!loading() && rows().length > 0">
            <span class="text-muted small">แสดง {{ rows().length }} จาก {{ total() }} รายการ</span>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-secondary" [disabled]="currentPage() === 1" (click)="goPage(currentPage()-1)">‹</button>
              <button *ngFor="let p of pages()" class="btn btn-sm" [class]="p === currentPage() ? 'btn-primary' : 'btn-outline-secondary'" (click)="goPage(p)">{{ p }}</button>
              <button class="btn btn-sm btn-outline-secondary" [disabled]="currentPage() === totalPages()" (click)="goPage(currentPage()+1)">›</button>
            </div>
          </div>

          <!-- Students Popup -->
          @if (studModal()) {
            <div class="modal-backdrop show" (click)="studModal.set(null)"></div>
            <div class="modal show d-block">
              <div class="modal-dialog modal-dialog-centered modal-lg" (click)="$event.stopPropagation()">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title">
                      <i class="bi bi-people me-2 text-primary"></i>
                      นักศึกษาใน
                      <code class="text-primary ms-1">{{ studModal()!.course_code }}</code>
                      <span class="ms-2 text-dark fw-normal">{{ studModal()!.title }}</span>
                      <small class="text-muted ms-2">— {{ studModal()!.professor_name }}</small>
                    </h5>
                    <button class="btn-close" (click)="studModal.set(null)"></button>
                  </div>
                  <div class="modal-body">
                    @if (studLoading()) {
                      <div class="text-center p-5"><div class="spinner-border text-primary"></div></div>
                    } @else if (studData().length === 0) {
                      <div class="text-center py-5 text-muted">
                        <i class="bi bi-people display-4"></i>
                        <p class="mt-3">ยังไม่มีนักศึกษาลงทะเบียน</p>
                      </div>
                    } @else {
                      <table class="table table-hover">
                        <thead class="table-light">
                          <tr><th>#</th><th>ชื่อ-นามสกุล</th><th>รหัสนักศึกษา</th><th>อีเมล</th><th class="text-center">เกรด</th></tr>
                        </thead>
                        <tbody>
                          @for (s of studData(); track s.student_id; let i = $index) {
                            <tr>
                              <td class="text-muted">{{ i + 1 }}</td>
                              <td><strong>{{ s.first_name }} {{ s.last_name }}</strong></td>
                              <td><code>{{ s.student_code }}</code></td>
                              <td class="text-muted" style="font-size:.82rem">{{ s.email }}</td>
                              <td class="text-center">
                                @if (s.grade) {
                                  <span class="badge" [class]="gradeColor(s.grade)">{{ s.grade }}</span>
                                } @else {
                                  <span class="text-muted">—</span>
                                }
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                      <div class="text-muted text-end mt-2" style="font-size:.8rem">
                        รวม {{ studData().length }} คน
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          }

        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:1040; }
    .modal { z-index:1050; }
    .loading-overlay { display:flex; justify-content:center; padding:60px; }
    .clickable-row { cursor:pointer; }
    .clickable-row:hover { background:#f0f4ff; }
    .avatar-xs { width:30px; height:30px; border-radius:50%; background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:.85rem; flex-shrink:0; }
    .fw-600 { font-weight:600; }
    .search-box { position:relative; }
    .search-box i { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#94a3b8; z-index:1; }
    .search-box .form-control { padding-left:36px; }
  `]
})
export class AdminCourseProfsComponent implements OnInit {
  loading     = signal(true);
  rows        = signal<any[]>([]);
  depts       = signal<any[]>([]);
  total       = signal(0);
  currentPage = signal(1);
  totalPages  = computed(() => Math.max(1, Math.ceil(this.total() / 25)));
  pages       = computed(() => {
    const t = this.totalPages(), c = this.currentPage();
    const start = Math.max(1, Math.min(c - 2, t - 4));
    return Array.from({ length: Math.min(5, t) }, (_, i) => start + i);
  });
  studModal   = signal<any>(null);
  studData    = signal<any[]>([]);
  studLoading = signal(false);
  search = ''; deptFilter = '';

  dayTh = (d: string) => DAY_TH[d] || d;

  constructor(private api: AdminApiService) {}

  ngOnInit() {
    this.load();
    this.api.getDepartments().subscribe(r => { if (r.data) this.depts.set(r.data as any[]); });
  }

  load() {
    this.loading.set(true);
    const params: any = { page: this.currentPage(), limit: 25 };
    if (this.search) params.search = this.search;
    if (this.deptFilter) params.dept_id = this.deptFilter;
    this.api.getCourseProfList(params).subscribe({
      next: (r: any) => { this.rows.set(r.data?.data ?? []); this.total.set(r.data?.total ?? 0); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  goPage(p: number) { this.currentPage.set(p); this.load(); }
  onFilterChange() { this.currentPage.set(1); this.load(); }

  viewStudents(row: any) {
    this.studModal.set(row);
    this.studData.set([]);
    this.studLoading.set(true);
    this.api.getCourseProfStudents(row.schedule_id).subscribe({
      next: r => { this.studData.set(r.data ?? []); this.studLoading.set(false); },
      error: () => this.studLoading.set(false),
    });
  }

  gradeColor(g: string) {
    if (['A','B+','B'].includes(g)) return 'bg-success';
    if (['C+','C'].includes(g)) return 'bg-warning text-dark';
    if (['D+','D'].includes(g)) return 'bg-secondary';
    return 'bg-danger';
  }
}
