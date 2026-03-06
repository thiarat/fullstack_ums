import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { AdminApiService } from '../../core/services/admin-api.service';
import { Course, Department } from '../../shared/models';

@Component({
  selector: 'app-admin-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="main-content">
        <app-topbar title="รายวิชา" subtitle="จัดการรายวิชาทั้งหมด" />
        <div class="page-content">
          <div class="d-flex gap-2 mb-3 flex-wrap">
            <div class="search-box" style="max-width:300px;flex:1">
              <i class="bi bi-search"></i>
              <input class="form-control" [(ngModel)]="search" (ngModelChange)="load()" placeholder="ค้นหารหัส, ชื่อวิชา...">
            </div>
            <select class="form-select" style="max-width:200px" [(ngModel)]="deptFilter" (ngModelChange)="load()">
              <option value="">ทุกแผนก</option>
              <option *ngFor="let d of depts()" [value]="d.dept_id">{{ d.name }}</option>
            </select>
            <button class="btn btn-primary ms-auto" (click)="openModal()">
              <i class="bi bi-plus-lg me-1"></i> เพิ่มวิชา
            </button>
          </div>

          <div class="card">
            <div *ngIf="loading()" class="loading-overlay"><div class="spinner-border"></div></div>
            <div class="table-responsive" *ngIf="!loading()">
              <table class="table">
                <thead>
                  <tr><th>รหัสวิชา</th><th>ชื่อวิชา</th><th>หน่วยกิต</th><th>แผนก</th><th>นักศึกษา</th><th></th></tr>
                </thead>
                <tbody>
                  <tr *ngFor="let c of courses()" class="stagger-item">
                    <td><code>{{ c.course_code }}</code></td>
                    <td><strong>{{ c.title }}</strong></td>
                    <td><span class="badge bg-primary">{{ c.credits }} หน่วยกิต</span></td>
                    <td><span class="badge bg-light text-dark border">{{ c.department }}</span></td>
                    <td>{{ c.enrolled_students ?? 0 }} คน</td>
                    <td>
                      <div class="d-flex gap-1">
                        <button class="btn btn-icon btn-sm btn-outline-secondary" (click)="openModal(c)"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-icon btn-sm btn-outline-danger" (click)="delete(c)"><i class="bi bi-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Modal -->
          <div class="modal-backdrop show" *ngIf="showModal()" (click)="closeModal()"></div>
          <div class="modal show d-block" *ngIf="showModal()">
            <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">{{ editing() ? 'แก้ไขรายวิชา' : 'เพิ่มรายวิชา' }}</h5>
                  <button class="btn-close" (click)="closeModal()"></button>
                </div>
                <div class="modal-body">
                  <div class="mb-3">
                    <label class="form-label">รหัสวิชา *</label>
                    <input class="form-control" [(ngModel)]="form.course_code" placeholder="CS101">
                  </div>
                  <div class="mb-3">
                    <label class="form-label">ชื่อวิชา *</label>
                    <input class="form-control" [(ngModel)]="form.title" placeholder="Introduction to Programming">
                  </div>
                  <div class="row">
                    <div class="col-6 mb-3">
                      <label class="form-label">หน่วยกิต</label>
                      <input type="number" class="form-control" [(ngModel)]="form.credits" min="1" max="6">
                    </div>
                    <div class="col-6 mb-3">
                      <label class="form-label">แผนก</label>
                      <select class="form-select" [(ngModel)]="form.dept_id">
                        <option [ngValue]="null">เลือกแผนก</option>
                        <option *ngFor="let d of depts()" [value]="d.dept_id">{{ d.name }}</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div class="modal-footer">
                  <button class="btn btn-secondary" (click)="closeModal()">ยกเลิก</button>
                  <button class="btn btn-primary" (click)="save()">{{ editing() ? 'บันทึก' : 'เพิ่ม' }}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`.modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1040}.modal{z-index:1050}`]
})
export class AdminCoursesComponent implements OnInit {
  loading = signal(true);
  courses = signal<Course[]>([]);
  depts = signal<Department[]>([]);
  showModal = signal(false);
  editing = signal<Course | null>(null);
  search = ''; deptFilter = '';
  form: any = { course_code: '', title: '', credits: 3, dept_id: null };

  constructor(private api: AdminApiService) {}
  ngOnInit() { this.load(); this.api.getDepartments().subscribe(r => { if (r.data) this.depts.set(r.data as Department[]); }); }

  load() {
    this.loading.set(true);
    this.api.getCourses(1, 50, this.search, this.deptFilter ? +this.deptFilter : undefined).subscribe({
      next: r => { if (r.data) this.courses.set(r.data.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openModal(c?: Course) {
    this.editing.set(c ?? null);
    this.form = c ? { ...c } : { course_code: '', title: '', credits: 3, dept_id: null };
    this.showModal.set(true);
  }
  closeModal() { this.showModal.set(false); }

  save() {
    const ed = this.editing();
    const obs = ed ? this.api.updateCourse(ed.course_id, this.form) : this.api.createCourse(this.form);
    obs.subscribe(() => { this.closeModal(); this.load(); });
  }

  delete(c: Course) {
    if (confirm(`ลบ "${c.course_code} - ${c.title}"?`))
      this.api.deleteCourse(c.course_id).subscribe(() => this.load());
  }
}
