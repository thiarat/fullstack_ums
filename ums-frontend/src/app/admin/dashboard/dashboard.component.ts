import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { AdminApiService } from '../../core/services/admin-api.service';
import { AdminDashboard } from '../../shared/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="main-content">
        <app-topbar title="Dashboard" subtitle="ภาพรวมระบบมหาวิทยาลัย" />
        <div class="page-content">

          <div *ngIf="loading()" class="loading-overlay"><div class="spinner-border"></div></div>

          <ng-container *ngIf="!loading() && data()">
            <!-- Stat Cards -->
            <div class="row g-3 mb-4">
              <div class="col-6 col-xl-2 stagger-item" *ngFor="let s of stats()">
                <div class="stat-card" [class]="s.color">
                  <div class="stat-icon"><i class="bi" [class]="s.icon"></i></div>
                  <div class="stat-value">{{ s.value }}</div>
                  <div class="stat-label">{{ s.label }}</div>
                </div>
              </div>
            </div>

            <!-- Recent Logs -->
            <div class="card fade-in-up">
              <div class="card-header d-flex align-items-center gap-2">
                <i class="bi bi-activity text-primary"></i>
                กิจกรรมล่าสุด
                <span class="badge bg-primary ms-auto">{{ data()!.recentLogs.length }}</span>
              </div>
              <div class="card-body p-0">
                <div class="table-responsive">
                  <table class="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>เวลา</th>
                        <th>ผู้ใช้</th>
                        <th>Role</th>
                        <th>Action</th>
                        <th>Table</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let log of data()!.recentLogs" class="stagger-item">
                        <td class="mono text-muted" style="font-size:.75rem">
                          {{ log.created_at | date:'dd/MM HH:mm' }}
                        </td>
                        <td><strong>{{ log.username }}</strong></td>
                        <td>
                          <span class="badge badge-role" [class]="log.role_name?.toLowerCase()">
                            {{ log.role_name }}
                          </span>
                        </td>
                        <td style="font-size:.8rem">{{ log.action }}</td>
                        <td><code>{{ log.table_name }}</code></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="empty-state" *ngIf="!data()!.recentLogs.length">
                  <i class="bi bi-inbox"></i><p>ยังไม่มีกิจกรรม</p>
                </div>
              </div>
            </div>
          </ng-container>

        </div>
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  loading = signal(true);
  data = signal<AdminDashboard | null>(null);

  stats = () => {
    const d = this.data();
    if (!d) return [];
    return [
      { label: 'นักศึกษา',   value: d.counts.students,     icon: 'bi-people-fill',    color: '' },
      { label: 'อาจารย์',    value: d.counts.professors,   icon: 'bi-person-badge',   color: 'green' },
      { label: 'รายวิชา',   value: d.counts.courses,      icon: 'bi-book',            color: 'amber' },
      { label: 'แผนก',       value: d.counts.departments,  icon: 'bi-building',        color: 'cyan' },
      { label: 'หนังสือ',    value: d.counts.books,        icon: 'bi-journal',         color: '' },
      { label: 'ยืมอยู่',    value: d.counts.borrowedBooks,icon: 'bi-bookmark-check',  color: 'red' },
    ];
  };

  constructor(private api: AdminApiService) {}

  ngOnInit() {
    this.api.getDashboard().subscribe({
      next: res => { if (res.data) this.data.set(res.data); this.loading.set(false); },
      error: ()  => this.loading.set(false)
    });
  }
}
