import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { AdminApiService } from '../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-password-reset',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="main-content">
        <app-topbar title="คำร้องขอรีเซ็ตรหัสผ่าน" subtitle="อนุมัติหรือปฏิเสธคำร้องขอเปลี่ยนรหัสผ่าน" />
        <div class="page-content">

          <!-- ── ตารางคำร้องขอ (pending) ─────────────────── -->
          <div class="section-label">
            <i class="bi bi-clock-history me-2"></i>คำร้องขอที่รอดำเนินการ
            <span class="pending-badge" *ngIf="pending().length">{{ pending().length }}</span>
            <button class="btn-refresh ms-auto" (click)="loadAll()" title="รีเฟรช">
              <i class="bi bi-arrow-clockwise me-1"></i>รีเฟรช
            </button>
          </div>

          <div class="card mb-4">
            <div class="loading-state" *ngIf="loadingPending()">
              <i class="bi bi-arrow-repeat spin"></i> กำลังโหลด...
            </div>
            <div class="table-wrapper" *ngIf="!loadingPending()">
              <table class="data-table" *ngIf="pending().length > 0; else emptyPending">
                <thead>
                  <tr>
                    <th style="width:3rem">#</th>
                    <th>ชื่อผู้ใช้</th>
                    <th>ชื่อ-นามสกุล</th>
                    <th>Role</th>
                    <th>ร้องขอเมื่อ</th>
                    <th style="min-width:220px">รหัสผ่านใหม่</th>
                    <th style="width:180px; text-align:center">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let r of pending(); let i = index">
                    <td class="idx-cell">{{ i + 1 }}</td>
                    <td><span class="username-badge">{{ r.username }}</span></td>
                    <td class="fullname-cell">{{ r.first_name }} {{ r.last_name }}</td>
                    <td>
                      <span class="role-chip" [class]="r.role_name?.toLowerCase()">{{ r.role_name }}</span>
                    </td>
                    <td class="date-cell">{{ r.created_at | date:'d MMM yyyy HH:mm' }}</td>
                    <td>
                      <div class="pw-input-wrap">
                        <input
                          [type]="showPw[r.request_id] ? 'text' : 'password'"
                          [(ngModel)]="passwords[r.request_id]"
                          class="pw-input"
                          placeholder="กรอกรหัสผ่านใหม่"
                        />
                        <button class="pw-eye" (click)="togglePw(r.request_id)" type="button">
                          <i class="bi" [class.bi-eye]="!showPw[r.request_id]" [class.bi-eye-slash]="showPw[r.request_id]"></i>
                        </button>
                      </div>
                      <div class="pw-error" *ngIf="errors[r.request_id]">{{ errors[r.request_id] }}</div>
                    </td>
                    <td>
                      <div class="action-btns">
                        <button
                          class="btn-approve"
                          [disabled]="processing[r.request_id]"
                          (click)="approve(r)">
                          <i class="bi bi-check-circle me-1"></i>ยืนยัน
                        </button>
                        <button
                          class="btn-reject"
                          [disabled]="processing[r.request_id]"
                          (click)="reject(r)">
                          <i class="bi bi-x-circle me-1"></i>ยกเลิก
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <ng-template #emptyPending>
                <div class="empty-row">
                  <i class="bi bi-inbox display-6 mb-2"></i>
                  <p>ไม่มีคำร้องขอ</p>
                </div>
              </ng-template>
            </div>
          </div>

          <!-- ── ตารางประวัติ (history) ─────────────────── -->
          <div class="section-label">
            <i class="bi bi-journal-check me-2"></i>ประวัติคำร้องขอ
          </div>

          <div class="card">
            <div class="loading-state" *ngIf="loadingHistory()">
              <i class="bi bi-arrow-repeat spin"></i> กำลังโหลด...
            </div>
            <div class="table-wrapper" *ngIf="!loadingHistory()">
              <table class="data-table" *ngIf="history().length > 0; else emptyHistory">
                <thead>
                  <tr>
                    <th style="width:3rem">#</th>
                    <th>ชื่อผู้ใช้</th>
                    <th>ชื่อ-นามสกุล</th>
                    <th>Role</th>
                    <th style="text-align:center">สถานะ</th>
                    <th>ร้องขอเมื่อ</th>
                    <th>ดำเนินการเมื่อ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let r of history(); let i = index">
                    <td class="idx-cell">{{ i + 1 }}</td>
                    <td><span class="username-badge">{{ r.username }}</span></td>
                    <td class="fullname-cell">{{ r.first_name }} {{ r.last_name }}</td>
                    <td>
                      <span class="role-chip" [class]="r.role_name?.toLowerCase()">{{ r.role_name }}</span>
                    </td>
                    <td style="text-align:center">
                      <span class="status-chip" [class.approved]="r.status === 'approved'" [class.rejected]="r.status === 'rejected'">
                        <i class="bi" [class.bi-check-circle-fill]="r.status === 'approved'" [class.bi-x-circle-fill]="r.status === 'rejected'"></i>
                        {{ r.status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ' }}
                      </span>
                    </td>
                    <td class="date-cell">{{ r.created_at | date:'d MMM yyyy HH:mm' }}</td>
                    <td class="date-cell">{{ r.resolved_at | date:'d MMM yyyy HH:mm' }}</td>
                  </tr>
                </tbody>
              </table>
              <ng-template #emptyHistory>
                <div class="empty-row">
                  <i class="bi bi-journal display-6 mb-2"></i>
                  <p>ยังไม่มีประวัติ</p>
                </div>
              </ng-template>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .section-label {
      font-size:.82rem; font-weight:700; color:var(--text-secondary);
      text-transform:uppercase; letter-spacing:.06em;
      display:flex; align-items:center; margin-bottom:.625rem;
    }
    .pending-badge {
      background:#ef4444; color:white; border-radius:999px;
      padding:.1rem .5rem; font-size:.72rem; font-weight:700; margin-left:.4rem;
    }
    .card { background:white; border-radius:var(--radius-lg); box-shadow:var(--shadow-sm); overflow:hidden; }
    .loading-state { display:flex; align-items:center; gap:.5rem; color:var(--text-muted); padding:1.5rem; }
    .spin { animation:spin 1s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .table-wrapper { overflow-x:auto; }
    .data-table { width:100%; border-collapse:collapse; }
    .data-table th {
      padding:.7rem 1rem; text-align:left; font-size:.72rem; font-weight:600;
      text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted);
      border-bottom:2px solid var(--border-color); background:#f8fafc; white-space:nowrap;
    }
    .data-table td { padding:.8rem 1rem; border-bottom:1px solid var(--border-color); font-size:.875rem; vertical-align:middle; }
    .data-table tbody tr:last-child td { border-bottom:none; }
    .data-table tbody tr:hover { background:#f8fafc; }

    .idx-cell { color:var(--text-muted); font-size:.8rem; text-align:center; }
    .username-badge { font-family:var(--font-mono); font-size:.8rem; background:#f1f5f9; color:#475569; padding:.2rem .5rem; border-radius:.25rem; }
    .fullname-cell { font-weight:600; }
    .date-cell { font-size:.8rem; color:var(--text-muted); white-space:nowrap; }

    .role-chip { padding:.2rem .55rem; border-radius:1rem; font-size:.72rem; font-weight:700; }
    .role-chip.admin     { background:rgba(139,92,246,.12); color:#7c3aed; }
    .role-chip.professor { background:rgba(16,185,129,.12); color:#065f46; }
    .role-chip.student   { background:rgba(59,130,246,.12); color:#1d4ed8; }

    .pw-input-wrap { display:flex; align-items:center; border:1.5px solid var(--border-color); border-radius:.375rem; overflow:hidden; }
    .pw-input { border:none; padding:.4rem .6rem; font-size:.85rem; flex:1; min-width:0; outline:none; background:white; }
    .pw-eye { background:none; border:none; border-left:1px solid var(--border-color); padding:.4rem .6rem; cursor:pointer; color:var(--text-muted); display:flex; align-items:center; }
    .pw-eye:hover { background:#f1f5f9; }
    .pw-error { color:#dc2626; font-size:.72rem; margin-top:.25rem; }

    .action-btns { display:flex; gap:.5rem; justify-content:center; }
    .btn-approve, .btn-reject {
      display:flex; align-items:center; gap:.25rem;
      padding:.35rem .75rem; border:none; border-radius:.375rem;
      font-size:.8rem; font-weight:600; cursor:pointer; transition:opacity .15s;
    }
    .btn-approve { background:#dcfce7; color:#15803d; }
    .btn-approve:hover:not(:disabled) { background:#bbf7d0; }
    .btn-reject  { background:#fee2e2; color:#dc2626; }
    .btn-reject:hover:not(:disabled)  { background:#fecaca; }
    .btn-approve:disabled, .btn-reject:disabled { opacity:.5; cursor:not-allowed; }

    .status-chip { display:inline-flex; align-items:center; gap:.3rem; padding:.25rem .65rem; border-radius:1rem; font-size:.78rem; font-weight:600; }
    .status-chip.approved { background:#dcfce7; color:#15803d; }
    .status-chip.rejected { background:#fee2e2; color:#dc2626; }

    .empty-row { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:3rem 1rem; color:var(--text-muted); gap:.25rem; }
    .display-6 { font-size:2rem; }
    .mb-2 { margin-bottom:.5rem; }
    .me-1 { margin-right:.25rem; }
    .me-2 { margin-right:.5rem; }
    .mb-4 { margin-bottom:1.5rem; }
    .ms-auto { margin-left:auto; }
    .btn-refresh {
      display:inline-flex; align-items:center; gap:.25rem;
      padding:.3rem .75rem; border:1px solid var(--border-color);
      border-radius:.375rem; background:white; color:var(--text-secondary);
      font-size:.78rem; font-weight:600; cursor:pointer; transition:all .15s;
    }
    .btn-refresh:hover { background:#f1f5f9; border-color:#cbd5e1; }
  `]
})
export class AdminPasswordResetComponent implements OnInit {
  pending  = signal<any[]>([]);
  history  = signal<any[]>([]);
  loadingPending = signal(true);
  loadingHistory = signal(true);

  passwords:  Record<number, string>  = {};
  showPw:     Record<number, boolean> = {};
  errors:     Record<number, string>  = {};
  processing: Record<number, boolean> = {};

  constructor(private api: AdminApiService) {}

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loadingPending.set(true);
    this.loadingHistory.set(true);
    this.api.getPasswordResetRequests().subscribe({
      next: (res: any) => { this.pending.set(res.data || []); this.loadingPending.set(false); },
      error: () => this.loadingPending.set(false)
    });
    this.api.getPasswordResetHistory().subscribe({
      next: (res: any) => { this.history.set(res.data || []); this.loadingHistory.set(false); },
      error: () => this.loadingHistory.set(false)
    });
  }

  togglePw(id: number) { this.showPw[id] = !this.showPw[id]; }

  approve(r: any) {
    const pw = (this.passwords[r.request_id] || '').trim();
    if (!pw || pw.length < 6) {
      this.errors[r.request_id] = 'รหัสผ่านอย่างน้อย 6 ตัวอักษร';
      return;
    }
    this.errors[r.request_id] = '';
    this.processing[r.request_id] = true;
    this.api.approvePasswordReset(r.request_id, pw).subscribe({
      next: () => { delete this.passwords[r.request_id]; this.processing[r.request_id] = false; this.loadAll(); },
      error: (err: any) => { this.errors[r.request_id] = err?.error?.message || 'เกิดข้อผิดพลาด'; this.processing[r.request_id] = false; }
    });
  }

  reject(r: any) {
    if (!confirm(`ปฏิเสธคำร้องขอของ ${r.first_name} ${r.last_name}?`)) return;
    this.processing[r.request_id] = true;
    this.api.rejectPasswordReset(r.request_id).subscribe({
      next: () => { this.processing[r.request_id] = false; this.loadAll(); },
      error: (err: any) => { this.errors[r.request_id] = err?.error?.message || 'เกิดข้อผิดพลาด'; this.processing[r.request_id] = false; }
    });
  }
}
