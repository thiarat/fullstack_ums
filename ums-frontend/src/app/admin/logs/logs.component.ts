import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { AdminApiService } from '../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="main-content">
        <app-topbar title="System Logs" subtitle="ประวัติกิจกรรมทั้งหมด" />
        <div class="page-content">

          <!-- Search & Filter -->
          <div class="d-flex gap-2 mb-3 flex-wrap align-items-center">
            <div class="search-box" style="max-width:280px;flex:1">
              <i class="bi bi-search"></i>
              <input class="form-control" [(ngModel)]="searchQ" (ngModelChange)="filter()"
                     placeholder="ค้นหา username, รหัสนักศึกษา, action...">
            </div>
            <select class="form-select" style="max-width:150px" [(ngModel)]="roleFilter" (ngModelChange)="filter()">
              <option value="">ทุก Role</option>
              <option value="Admin">Admin</option>
              <option value="Professor">Professor</option>
              <option value="Student">Student</option>
            </select>
            <div class="date-filter-wrap">
              <i class="bi bi-calendar3"></i>
              <input type="date" class="form-control date-input" [(ngModel)]="dateFilter" (ngModelChange)="filter()"
                     title="กรองตามวันที่" />
              <button class="btn-clear-date" *ngIf="dateFilter" (click)="dateFilter=''; filter()" title="ล้าง">
                <i class="bi bi-x"></i>
              </button>
            </div>
            <button class="btn btn-outline-secondary ms-auto" (click)="load()">
              <i class="bi bi-arrow-clockwise me-1"></i> รีเฟรช
            </button>
          </div>

          <!-- Summary badges -->
          <div class="d-flex gap-2 mb-3 flex-wrap">
            <span class="badge rounded-pill bg-light text-dark border" style="font-size:.8rem;padding:.4rem .8rem">
              ทั้งหมด: <strong>{{ allLogs().length }}</strong>
            </span>
            <span class="badge rounded-pill border" style="font-size:.8rem;padding:.4rem .8rem;background:#fef3c7;color:#92400e">
              Admin: <strong>{{ countByRole('Admin') }}</strong>
            </span>
            <span class="badge rounded-pill border" style="font-size:.8rem;padding:.4rem .8rem;background:#d1fae5;color:#065f46">
              Professor: <strong>{{ countByRole('Professor') }}</strong>
            </span>
            <span class="badge rounded-pill border" style="font-size:.8rem;padding:.4rem .8rem;background:#dbeafe;color:#1e3a5f">
              Student: <strong>{{ countByRole('Student') }}</strong>
            </span>
          </div>

          <!-- Active filter label -->
          <div *ngIf="dateFilter" class="d-flex align-items-center gap-2 mb-2">
            <span style="font-size:.8rem;color:#64748b">แสดงกิจกรรมวันที่:</span>
            <span class="date-active-chip">{{ dateFilter | date:'d MMMM yyyy' }}</span>
            <span style="font-size:.8rem;color:#64748b">({{ logs().length }} รายการ)</span>
          </div>

          <div class="card">
            <div *ngIf="loading()" class="loading-overlay"><div class="spinner-border"></div></div>
            <div class="table-responsive" *ngIf="!loading()">
              <table class="table mb-0">
                <thead>
                  <tr>
                    <th style="white-space:nowrap">เวลา</th>
                    <th>ผู้ใช้</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Table</th>
                    <th>Record</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let log of logs()" class="stagger-item">
                    <td class="mono" style="font-size:.75rem;white-space:nowrap">
                      {{ log.created_at | date:'dd/MM/yy HH:mm:ss' }}
                    </td>
                    <td><strong>{{ log.username }}</strong></td>
                    <td>
                      <span class="badge badge-role" [class]="log.role_name?.toLowerCase()">
                        {{ log.role_name }}
                      </span>
                    </td>
                    <td style="font-size:.82rem;max-width:280px">{{ log.action }}</td>
                    <td><code style="font-size:.75rem">{{ log.table_name }}</code></td>
                    <td class="text-muted" style="font-size:.78rem">{{ log.record_id ?? '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="empty-state" *ngIf="!loading() && !logs().length">
              <i class="bi bi-inbox"></i>
              <p>{{ searchQ || roleFilter || dateFilter ? 'ไม่พบ Log ที่ค้นหา' : 'ยังไม่มี Log' }}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .date-filter-wrap { position:relative; display:flex; align-items:center; max-width:180px; }
    .date-filter-wrap i { position:absolute; left:.65rem; color:#94a3b8; pointer-events:none; }
    .date-input { padding-left:2rem; padding-right:1.75rem; font-size:.85rem; }
    .btn-clear-date { position:absolute; right:.35rem; background:none; border:none; color:#94a3b8; cursor:pointer; padding:0 .2rem; display:flex; align-items:center; font-size:.85rem; }
    .btn-clear-date:hover { color:#ef4444; }
    .date-active-chip { background:#dbeafe; color:#1d4ed8; border-radius:1rem; padding:.2rem .65rem; font-size:.8rem; font-weight:600; }
  `]
})
export class AdminLogsComponent implements OnInit {
  loading = signal(true);
  allLogs = signal<any[]>([]);
  logs = signal<any[]>([]);
  searchQ = ''; roleFilter = ''; dateFilter = '';

  constructor(private api: AdminApiService) {}
  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getSystemLogs(1, 500).subscribe({
      next: r => {
        const data = r.data ? ((r.data as any).data ?? r.data) : [];
        this.allLogs.set(data);
        this.filter();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filter() {
    let data = this.allLogs();
    if (this.roleFilter) data = data.filter((l: any) => l.role_name === this.roleFilter);
    if (this.dateFilter) {
      data = data.filter((l: any) => {
        const d = new Date(l.created_at);
        const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
        return `${y}-${m}-${day}` === this.dateFilter;
      });
    }
    if (this.searchQ) {
      const q = this.searchQ.toLowerCase();
      data = data.filter((l: any) =>
        l.username?.toLowerCase().includes(q) ||
        l.action?.toLowerCase().includes(q) ||
        l.table_name?.toLowerCase().includes(q)
      );
    }
    this.logs.set(data);
  }

  countByRole(role: string) {
    return this.allLogs().filter((l: any) => l.role_name === role).length;
  }
}
