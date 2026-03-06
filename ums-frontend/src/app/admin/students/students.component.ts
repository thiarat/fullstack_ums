import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { AdminApiService } from '../../core/services/admin-api.service';
import { Student, PaginatedData } from '../../shared/models';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-admin-students',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="main-content">
        <app-topbar title="จัดการนักศึกษา" [subtitle]="'ทั้งหมด ' + (result()?.total ?? 0) + ' คน'" />
        <div class="page-content">

          <!-- Toolbar -->
          <div class="d-flex gap-2 mb-3 flex-wrap">
            <div class="search-box flex-grow-1" style="max-width:360px">
              <i class="bi bi-search"></i>
              <input type="text" class="form-control" [(ngModel)]="search"
                     (ngModelChange)="onSearch($event)" placeholder="ค้นหาชื่อ, username, email...">
            </div>
          </div>

          <div class="card">
            <div *ngIf="loading()" class="loading-overlay"><div class="spinner-border"></div></div>

            <div class="table-responsive" *ngIf="!loading()">
              <table class="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>รหัส</th>
                    <th>ชื่อ-นามสกุล</th>
                    <th>Email</th>
                    <th>วันลงทะเบียน</th>
                    <th>เข้าระบบล่าสุด</th>
                    <th>สถานะ</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let s of result()?.data; let i = index" class="stagger-item">
                    <td class="text-muted" style="font-size:.75rem">{{ i + 1 + (page - 1) * limit }}</td>
                    <td><code>{{ s.username }}</code></td>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <div class="avatar-sm">{{ s.first_name[0] }}{{ s.last_name[0] }}</div>
                        <div>
                          <div style="font-weight:500">{{ s.first_name }} {{ s.last_name }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="text-muted" style="font-size:.82rem">{{ s.email }}</td>
                    <td style="font-size:.82rem">{{ s.enrollment_date | date:'dd MMM yyyy' }}</td>
                    <td style="font-size:.78rem" class="text-muted">{{ s.last_login ? (s.last_login | date:'dd/MM/yy HH:mm') : '-' }}</td>
                    <td>
                      <span class="badge" [class]="s.is_active ? 'bg-success' : 'bg-secondary'">
                        {{ s.is_active ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-sm" [class]="s.is_active ? 'btn-outline-danger' : 'btn-outline-success'"
                              (click)="toggleStatus(s)">
                        {{ s.is_active ? 'ระงับ' : 'เปิดใช้' }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div class="d-flex align-items-center justify-content-between px-3 py-2 border-top" *ngIf="result()">
              <small class="text-muted">
                แสดง {{ (page-1)*limit + 1 }}–{{ min(page*limit, result()!.total) }} จาก {{ result()!.total }}
              </small>
              <nav>
                <ul class="pagination pagination-sm mb-0">
                  <li class="page-item" [class.disabled]="page <= 1">
                    <button class="page-link" (click)="changePage(page - 1)">‹</button>
                  </li>
                  <li class="page-item" *ngFor="let p of pages()" [class.active]="p === page">
                    <button class="page-link" (click)="changePage(p)">{{ p }}</button>
                  </li>
                  <li class="page-item" [class.disabled]="page >= totalPages()">
                    <button class="page-link" (click)="changePage(page + 1)">›</button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .avatar-sm {
      width: 30px; height: 30px; border-radius: 50%;
      background: linear-gradient(135deg, #dbeafe, #ede9fe);
      color: #3b82f6; font-weight: 700; font-size: .72rem;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
  `]
})
export class AdminStudentsComponent implements OnInit {
  loading = signal(true);
  result = signal<PaginatedData<Student> | null>(null);
  search = '';
  page = 1;
  limit = 20;
  private searchSubject = new Subject<string>();

  constructor(private api: AdminApiService) {
    this.searchSubject.pipe(debounceTime(400)).subscribe(v => {
      this.search = v; this.page = 1; this.load();
    });
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getStudents(this.page, this.limit, this.search).subscribe({
      next: res => { if (res.data) this.result.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSearch(v: string) { this.searchSubject.next(v); }

  changePage(p: number) {
    if (p < 1 || p > this.totalPages()) return;
    this.page = p; this.load();
  }

  toggleStatus(s: Student) {
    this.api.updateStudentStatus(s.student_id, !s.is_active).subscribe(() => this.load());
  }

  totalPages() { return Math.ceil((this.result()?.total ?? 0) / this.limit); }
  pages() {
    const t = this.totalPages();
    return Array.from({ length: Math.min(t, 5) }, (_, i) => i + 1);
  }
  min(a: number, b: number) { return Math.min(a, b); }
}
