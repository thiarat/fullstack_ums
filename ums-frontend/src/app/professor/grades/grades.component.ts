import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { ProfessorApiService } from '../../core/services/professor-api.service';

const GRADES = ['A','B+','B','C+','C','D+','D','F','W','I'];

@Component({
  selector: 'app-prof-grades',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="main-content">
        <app-topbar title="บันทึกเกรด" subtitle="เลือกรายวิชาแล้วบันทึกเกรดนักศึกษา" />
        <div class="page-content">
          <!-- Course Selector -->
          <div class="d-flex gap-2 mb-4 align-items-center">
            <label class="form-label mb-0 fw-semibold">เลือกรายวิชา:</label>
            <select class="form-select" style="max-width:280px" [(ngModel)]="selectedCourse" (ngModelChange)="loadStudents()">
              <option value="">-- เลือกรายวิชา --</option>
              <option *ngFor="let c of courses()" [value]="c.course_id">
                {{ c.course_code }} – {{ c.title }}
              </option>
            </select>
          </div>

          <div class="card" *ngIf="students().length">
            <div class="card-header d-flex align-items-center gap-2">
              <i class="bi bi-pencil-square me-1"></i>
              บันทึกเกรด ({{ students().length }} คน)
              <button class="btn btn-sm btn-primary ms-auto" (click)="submitAll()" [disabled]="saving()">
                <span class="spinner-border spinner-border-sm me-1" *ngIf="saving()"></span>
                บันทึกทั้งหมด
              </button>
            </div>
            <div class="alert alert-success mx-3 mt-3" *ngIf="savedMsg()">
              <i class="bi bi-check-circle me-2"></i>{{ savedMsg() }}
            </div>
            <div class="table-responsive">
              <table class="table mb-0">
                <thead>
                  <tr>
                    <th>รหัสนักศึกษา</th>
                    <th>ชื่อ-นามสกุล</th>
                    <th style="width:160px">เกรด</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let s of students(); let i = index" class="stagger-item">
                    <td><code>{{ s.student_code }}</code></td>
                    <td>{{ s.first_name }} {{ s.last_name }}</td>
                    <td>
                      <select class="form-select form-select-sm" [(ngModel)]="gradeInputs[s.enrollment_id]">
                        <option value="">เลือกเกรด</option>
                        <option *ngFor="let g of gradeList" [value]="g">{{ g }}</option>
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="empty-state" *ngIf="selectedCourse && !students().length && !loading()">
            <i class="bi bi-people"></i><p>ไม่มีนักศึกษาในรายวิชานี้</p>
          </div>

          <div *ngIf="loading()" class="loading-overlay"><div class="spinner-border"></div></div>
        </div>
      </div>
    </div>
  `
})
export class ProfGradesComponent implements OnInit {
  courses = signal<any[]>([]);
  students = signal<any[]>([]);
  selectedCourse = '';
  gradeInputs: Record<number, string> = {};
  gradeList = GRADES;
  loading = signal(false);
  saving = signal(false);
  savedMsg = signal('');

  constructor(private api: ProfessorApiService) {}

  ngOnInit() {
    this.api.getMyCourses().subscribe(r => { if (r.data) this.courses.set(r.data as any[]); });
  }

  loadStudents() {
    if (!this.selectedCourse) return;
    this.loading.set(true);
    this.savedMsg.set('');
    this.api.getCourseStudents(+this.selectedCourse).subscribe({
      next: r => {
        if (r.data) {
          this.students.set(r.data as any[]);
          this.gradeInputs = {};
          (r.data as any[]).forEach((s: any) => { this.gradeInputs[s.enrollment_id] = s.grade ?? ''; });
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  submitAll() {
    const grades = this.students()
      .filter(s => this.gradeInputs[s.enrollment_id])
      .map(s => ({ enrollment_id: s.enrollment_id, grade: this.gradeInputs[s.enrollment_id] }));

    if (!grades.length) return;
    this.saving.set(true);
    this.api.submitBulkGrades(+this.selectedCourse, grades).subscribe({
      next: r => {
        this.savedMsg.set(`บันทึกเกรดสำเร็จ ${grades.length} รายการ`);
        this.saving.set(false);
        this.loadStudents();
      },
      error: () => this.saving.set(false)
    });
  }
}
