import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { AdminApiService } from '../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-logs',
  standalone: true,
  imports: [CommonModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="main-content">
        <app-topbar title="System Logs" subtitle="ประวัติกิจกรรมทั้งหมด" />
        <div class="page-content">
          <div class="d-flex justify-content-end mb-3">
            <button class="btn btn-outline-secondary btn-sm" (click)="load()">
              <i class="bi bi-arrow-clockwise me-1"></i> รีเฟรช
            </button>
          </div>
          <div class="card">
            <div *ngIf="loading()" class="loading-overlay"><div class="spinner-border"></div></div>
            <div class="table-responsive" *ngIf="!loading()">
              <table class="table">
                <thead>
                  <tr><th>เวลา</th><th>ผู้ใช้</th><th>Role</th><th>Action</th><th>Table</th><th>Record ID</th></tr>
                </thead>
                <tbody>
                  <tr *ngFor="let log of logs()" class="stagger-item">
                    <td class="mono" style="font-size:.75rem;white-space:nowrap">
                      {{ log.created_at | date:'dd/MM/yyyy HH:mm:ss' }}
                    </td>
                    <td><strong>{{ log.username }}</strong></td>
                    <td>
                      <span class="badge badge-role" [class]="log.role_name?.toLowerCase()">{{ log.role_name }}</span>
                    </td>
                    <td style="font-size:.82rem;max-width:300px">{{ log.action }}</td>
                    <td><code>{{ log.table_name }}</code></td>
                    <td class="text-muted">{{ log.record_id }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="empty-state" *ngIf="!loading() && !logs().length">
              <i class="bi bi-inbox"></i><p>ยังไม่มี Log</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminLogsComponent implements OnInit {
  loading = signal(true);
  logs = signal<any[]>([]);

  constructor(private api: AdminApiService) {}
  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true);
    this.api.getSystemLogs(1, 100).subscribe({
      next: r => { if (r.data) this.logs.set(r.data.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
