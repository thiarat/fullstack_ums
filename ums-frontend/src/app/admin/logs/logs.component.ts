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
        <app-topbar title="System Logs" subtitle="ประวัติกิจกรรมและการเข้าถึงระบบทั้งหมด" />
        
        <div class="page-content">

          <div class="row g-3 mb-4 pt-3 mt-2 stagger-item">
            <div class="col-6 col-md-3">
              <div class="stat-chip bg-white border">
                <div class="chip-icon bg-secondary-soft text-secondary"><i class="bi bi-list-ul"></i></div>
                <div class="chip-info">
                  <div class="chip-val">{{ allLogs().length }}</div>
                  <div class="chip-lab">Logs ทั้งหมด</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="stat-chip bg-white border">
                <div class="chip-icon bg-warning-soft text-warning"><i class="bi bi-shield-lock"></i></div>
                <div class="chip-info">
                  <div class="chip-val">{{ countByRole('Admin') }}</div>
                  <div class="chip-lab">แอดมิน</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="stat-chip bg-white border">
                <div class="chip-icon bg-success-soft text-success"><i class="bi bi-person-workspace"></i></div>
                <div class="chip-info">
                  <div class="chip-val">{{ countByRole('Professor') }}</div>
                  <div class="chip-lab">อาจารย์</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="stat-chip bg-white border">
                <div class="chip-icon bg-primary-soft text-primary"><i class="bi bi-people"></i></div>
                <div class="chip-info">
                  <div class="chip-val">{{ countByRole('Student') }}</div>
                  <div class="chip-lab">นักศึกษา</div>
                </div>
              </div>
            </div>
          </div>

          <div class="filter-toolbar mb-4 stagger-item" style="animation-delay: 0.1s;">
            <div class="row g-3 align-items-center">
              <div class="col-md-5 col-lg-4">
                <div class="input-modern-group">
                  <i class="bi bi-search text-muted"></i>
                  <input class="form-control" [(ngModel)]="searchQ" (ngModelChange)="filter()"
                         placeholder="ค้นหาชื่อผู้ใช้, กิจกรรม, หรือตารางข้อมูล...">
                </div>
              </div>
              <div class="col-md-4 col-lg-3">
                <div class="input-modern-group">
                  <i class="bi bi-filter-left text-muted"></i>
                  <select class="form-control form-select-modern" [(ngModel)]="roleFilter" (ngModelChange)="filter()">
                    <option value="">ทุกระดับสิทธิ์ (Role)</option>
                    <option value="Admin">Admin</option>
                    <option value="Professor">Professor</option>
                    <option value="Student">Student</option>
                  </select>
                </div>
              </div>
              <div class="col-md-3 col-lg-5 text-md-end">
                <button class="btn btn-refresh shadow-sm" (click)="load()">
                  <i class="bi bi-arrow-clockwise"></i> รีเฟรชข้อมูล
                </button>
              </div>
            </div>
          </div>

          @if (loading()) {
            <div class="loading-state fade-in">
              <div class="spinner-border text-primary" role="status"></div>
              <div class="mt-3 text-muted fw-medium">กำลังดึงข้อมูลกิจกรรมล่าสุด...</div>
            </div>
          } @else {
            <div class="card premium-card stagger-item" style="animation-delay: 0.2s;">
              <div class="table-responsive">
                <table class="table custom-table table-hover mb-0">
                  <thead>
                    <tr>
                      <th style="width: 180px;">วัน-เวลา</th>
                      <th>ผู้ดำเนินการ</th>
                      <th>สิทธิ์</th>
                      <th>กิจกรรม (Action)</th>
                      <th>เป้าหมาย</th>
                      <th class="text-center">ID อ้างอิง</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (log of logs(); track log.log_id) {
                      <tr class="align-middle">
                        <td class="text-muted small">
                          <div class="d-flex align-items-center gap-2">
                            <i class="bi bi-clock-history opacity-50"></i>
                            <span class="mono">{{ log.created_at | date:'dd MMM yy, HH:mm:ss' }}</span>
                          </div>
                        </td>
                        <td>
                          <div class="fw-bold text-dark">{{ log.username }}</div>
                        </td>
                        <td>
                          <span class="badge-role" [ngClass]="getRoleClass(log.role_name)">
                            {{ log.role_name }}
                          </span>
                        </td>
                        <td>
                          <span class="action-text fw-medium" [ngClass]="getActionClass(log.action)">
                            {{ log.action }}
                          </span>
                        </td>
                        <td>
                          <code class="table-badge"><i class="bi bi-database me-1"></i>{{ log.table_name }}</code>
                        </td>
                        <td class="text-center">
                          <span class="text-muted small fw-medium">{{ log.record_id ?? '-' }}</span>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="6" class="text-center py-5">
                          <div class="empty-state-box border-0">
                            <div class="empty-icon-wrap mb-3 mx-auto"><i class="bi bi-shield-slash"></i></div>
                            <h6 class="fw-bold text-dark mb-1">ไม่พบข้อมูลบันทึกกิจกรรม</h6>
                            <p class="text-muted small">{{ searchQ || roleFilter ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง' : 'ระบบยังไม่มีบันทึกข้อมูลในขณะนี้' }}</p>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
            <p class="text-muted small mt-3 ms-2">
              <i class="bi bi-info-circle me-1"></i> แสดงข้อมูลกิจกรรมย้อนหลังสูงสุด 500 รายการล่าสุด
            </p>
          }

        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&family=JetBrains+Mono&display=swap');

    .page-content {
      padding: 4rem 2rem 2rem 2rem; 
      font-family: 'Prompt', sans-serif;
      background-color: #f4f7f9; 
      min-height: calc(100vh - 70px);
      position: relative;
      z-index: 1;
    }

    .mono { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; }

    /* 📊 Stat Chips Analytics */
    .stat-chip {
      display: flex; align-items: center; gap: 15px; padding: 1rem;
      border-radius: 16px; transition: 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }
    .stat-chip:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
    .chip-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .chip-val { font-size: 1.4rem; font-weight: 800; color: #0f172a; line-height: 1.2; }
    .chip-lab { font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }

    /* 🔍 Toolbar */
    .input-modern-group { position: relative; }
    .input-modern-group > i { position: absolute; left: 1.2rem; top: 50%; transform: translateY(-50%); font-size: 1.1rem; pointer-events: none; color: #94a3b8; transition: 0.2s;}
    .input-modern-group .form-control { 
      padding-left: 3rem; height: 48px; border-radius: 12px; background-color: #ffffff; 
      border: 1px solid #cbd5e1; font-size: 0.95rem; color: #1e293b; transition: all 0.25s ease-out;
    }
    .input-modern-group .form-control:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59,130,246,0.1); outline: none;}
    .input-modern-group .form-control:focus ~ i { color: #3b82f6 !important; }
    .form-select-modern { cursor: pointer; }

    .btn-refresh {
      height: 48px; padding: 0 1.25rem; border-radius: 12px; border: 1px solid #cbd5e1;
      background: white; color: #475569; font-weight: 600; font-size: 0.9rem; transition: 0.2s;
    }
    .btn-refresh:hover { background: #f8fafc; color: #0f172a; border-color: #94a3b8; }
    .btn-refresh:active { transform: scale(0.98); }

    /* 📋 Premium Table */
    .premium-card {
      background: #ffffff; border-radius: 20px; border: 1px solid rgba(226, 232, 240, 0.8);
      box-shadow: 0 4px 15px rgba(0,0,0,0.02); overflow: hidden;
    }
    .custom-table th { 
      font-weight: 600; color: #475569; font-size: 0.82rem; border-bottom: 2px solid #e2e8f0; 
      padding: 1.2rem 1.5rem; background: #f8fafc; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .custom-table td { padding: 1.1rem 1.5rem; border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease-out; }
    .custom-table tbody tr:hover td { background-color: #f8fafc; }

    /* Badges & Actions */
    .badge-role { padding: 0.35rem 0.8rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
    .admin { background: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff; }
    .professor { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .student { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }

    .action-text { font-size: 0.85rem; }
    .text-success-action { color: #10b981; }
    .text-danger-action { color: #ef4444; }
    .text-warning-action { color: #f59e0b; }
    .text-info-action { color: #3b82f6; }

    .table-badge { background: #f1f5f9; color: #475569; padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.75rem; border: 1px solid #e2e8f0; }

    .bg-primary-soft { background: #eff6ff; }
    .bg-success-soft { background: #ecfdf5; }
    .bg-warning-soft { background: #fffbeb; }
    .bg-secondary-soft { background: #f1f5f9; }

    /* Empty State */
    .empty-state-box { text-align: center; padding: 4rem 1rem; }
    .empty-icon-wrap { width: 80px; height: 80px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; color: #cbd5e1; }

    .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5rem 0; }

    /* Animations */
    @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
    .stagger-item { animation: fadeSlideUp 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; opacity: 0; will-change: transform, opacity; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .fade-in { animation: fadeIn 0.3s ease-in forwards; }
  `]
})
export class AdminLogsComponent implements OnInit {
  loading = signal(true);
  allLogs = signal<any[]>([]);
  logs = signal<any[]>([]);
  searchQ = ''; roleFilter = '';

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

  // Helper styles
  getRoleClass(role: string): string {
    return role?.toLowerCase() || '';
  }

  getActionClass(action: string): string {
    const a = action?.toLowerCase() || '';
    if (a.includes('create') || a.includes('add') || a.includes('insert')) return 'text-success-action fw-bold';
    if (a.includes('delete') || a.includes('remove')) return 'text-danger-action fw-bold';
    if (a.includes('update') || a.includes('edit')) return 'text-warning-action fw-bold';
    return 'text-info-action fw-medium';
  }
}