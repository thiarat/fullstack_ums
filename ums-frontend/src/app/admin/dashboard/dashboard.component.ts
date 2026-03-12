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
        <app-topbar title="Dashboard" subtitle="ภาพรวมสถิติและกิจกรรมในระบบมหาวิทยาลัย" />
        
        <div class="page-content">

          @if (loading()) {
            <div class="loading-state fade-in">
              <div class="spinner-border text-primary" role="status"></div>
              <div class="mt-3 text-muted fw-medium">กำลังโหลดข้อมูลสรุป...</div>
            </div>
          }

          @if (!loading() && data()) {
            <div class="d-flex justify-content-between align-items-end mb-4 pt-4 mt-2 fade-in">
              <div>
                <h4 class="fw-bold text-dark mb-1">ภาพรวมระบบ (Overview)</h4>
                <p class="text-muted small mb-0">ข้อมูลสถิติล่าสุดอัปเดต ณ เวลานี้</p>
              </div>
            </div>

            <div class="row g-4 mb-5">
              @for (s of stats(); track s.label; let i = $index) {
                <div class="col-6 col-md-4 col-xl-2 stagger-item" [style.animation-delay]="(i * 0.05) + 's'">
                  <div class="card stat-card h-100">
                    <div class="card-body p-4 d-flex flex-column align-items-start">
                      <div class="icon-box mb-3" [ngClass]="'box-' + s.color">
                        <i class="bi" [class]="s.icon"></i>
                      </div>
                      <div class="stat-value text-dark mb-1">{{ s.value | number }}</div>
                      <div class="stat-label text-muted">{{ s.label }}</div>
                    </div>
                  </div>
                </div>
              }
            </div>

            <div class="row fade-in stagger-item" style="animation-delay: 0.3s;">
              <div class="col-12">
                <div class="card table-card">
                  
                  <div class="card-header bg-white border-0 p-4 pb-3 d-flex align-items-center gap-3">
                    <div class="icon-circle-small bg-primary-soft text-primary">
                      <i class="bi bi-activity"></i>
                    </div>
                    <h5 class="fw-bold text-dark mb-0">กิจกรรมล่าสุดในระบบ</h5>
                    <span class="badge bg-primary rounded-pill ms-auto px-3 py-2 shadow-sm">
                      {{ data()!.recentLogs.length }} รายการ
                    </span>
                  </div>

                  <div class="card-body p-0">
                    <div class="table-responsive">
                      <table class="table custom-table table-hover mb-0">
                        <thead>
                          <tr>
                            <th>วัน/เวลา</th>
                            <th>ผู้ใช้งาน</th>
                            <th>ระดับสิทธิ์ (Role)</th>
                            <th>การกระทำ (Action)</th>
                            <th>เป้าหมาย (Table)</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (log of data()!.recentLogs; track $index) {
                            <tr>
                              <td class="text-muted small">
                                <div class="d-flex align-items-center gap-2">
                                  <i class="bi bi-clock"></i>
                                  <span>{{ log.created_at | date:'dd MMM yy, HH:mm' }}</span>
                                </div>
                              </td>
                              <td>
                                <div class="fw-semibold text-dark">{{ log.username }}</div>
                              </td>
                              <td>
                                <span class="badge-role" [ngClass]="getRoleClass(log.role_name)">
                                  {{ log.role_name }}
                                </span>
                              </td>
                              <td>
                                <span class="action-text" [ngClass]="getActionClass(log.action)">
                                  {{ log.action }}
                                </span>
                              </td>
                              <td>
                                <code class="table-badge"><i class="bi bi-database me-1"></i>{{ log.table_name }}</code>
                              </td>
                            </tr>
                          } @empty {
                            <tr>
                              <td colspan="5" class="text-center py-5">
                                <div class="empty-state">
                                  <i class="bi bi-inbox text-muted fs-1 mb-2 d-block"></i>
                                  <p class="text-muted mb-0">ยังไม่มีบันทึกกิจกรรมในระบบ</p>
                                </div>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
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
    @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');

    .page-content {
      padding: 4rem 2rem 3rem 2rem; /* เพิ่ม Padding-top เป็น 4rem เพื่อหลบ Topbar แน่นอน 100% */
      font-family: 'Prompt', sans-serif;
      background-color: #f4f7fa; 
      min-height: calc(100vh - 70px);
      position: relative;
      z-index: 1;
    }

    .loading-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center; height: 50vh;
    }

    /* 💎 Premium Stat Cards (Hardware Accelerated & Smooth) */
    .stat-card {
      background: #ffffff; 
      border-radius: 20px; 
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
      transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), border-color 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
      overflow: hidden;
      position: relative;
      will-change: transform, box-shadow; /* ช่วยให้การ์ดจอดึงไปประมวลผล = ลื่น */
    }
    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 30px -5px rgba(0,0,0,0.08);
      border-color: #cbd5e1;
    }
    .stat-value { font-size: 1.75rem; font-weight: 800; line-height: 1.2; letter-spacing: -0.5px;}
    .stat-label { font-size: 0.85rem; font-weight: 500; }

    /* Icon Boxes & Colors */
    .icon-box {
      width: 48px; height: 48px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; transition: transform 0.3s ease-out;
    }
    .stat-card:hover .icon-box { transform: scale(1.1) rotate(-5deg); }

    .box-blue { background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; }
    .box-emerald { background: #ecfdf5; color: #10b981; border: 1px solid #d1fae5; }
    .box-amber { background: #fffbeb; color: #d97706; border: 1px solid #fef3c7; }
    .box-cyan { background: #ecfeff; color: #0891b2; border: 1px solid #cffafe; }
    .box-violet { background: #f5f3ff; color: #7c3aed; border: 1px solid #ede9fe; }
    .box-rose { background: #fff1f2; color: #e11d48; border: 1px solid #ffe4e6; }

    /* 💎 Table Card */
    .table-card {
      background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0;
      box-shadow: 0 4px 20px rgba(0,0,0,0.03); overflow: hidden;
    }
    .icon-circle-small { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
    .bg-primary-soft { background: #eff6ff; }

    .custom-table th { 
      font-weight: 600; color: #64748b; font-size: 0.8rem; text-transform: uppercase; 
      letter-spacing: 0.5px; border-bottom: 2px solid #f1f5f9; padding: 1.2rem 1.5rem; background: #f8fafc; 
    }
    .custom-table td { padding: 1.2rem 1.5rem; vertical-align: middle; border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease-out; }
    .custom-table tbody tr:hover td { background-color: #f8fafc; }

    /* Badges */
    .badge-role { padding: 0.35rem 0.8rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.3px;}
    .role-admin { background: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff; } 
    .role-student { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; } 
    .role-professor { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; } 
    .role-default { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

    .action-text { font-size: 0.85rem; font-weight: 500; }
    .text-success-action { color: #10b981; }
    .text-danger-action { color: #ef4444; }
    .text-warning-action { color: #f59e0b; }
    .text-info-action { color: #3b82f6; }

    .table-badge { background: #f1f5f9; color: #475569; padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.75rem; border: 1px solid #e2e8f0; }

    /* Animations (Hardcoded for maximum smoothness without CSS vars) */
    @keyframes fadeSlideUp { 
      from { opacity: 0; transform: translateY(20px); } 
      to { opacity: 1; transform: translateY(0); } 
    }
    .stagger-item { 
      animation: fadeSlideUp 0.5s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; 
      opacity: 0; 
      will-change: transform, opacity;
    }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s ease-in forwards; will-change: opacity; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  loading = signal(true);
  data = signal<AdminDashboard | null>(null);

  stats = () => {
    const d = this.data();
    if (!d) return [];
    
    return [
      { label: 'นักศึกษา',   value: d.counts.students,      icon: 'bi-people-fill',    color: 'blue' },
      { label: 'อาจารย์',    value: d.counts.professors,    icon: 'bi-person-badge-fill', color: 'emerald' },
      { label: 'รายวิชา',   value: d.counts.courses,       icon: 'bi-journal-bookmark-fill', color: 'amber' },
      { label: 'คณะ',      value: d.counts.departments,   icon: 'bi-building-fill',  color: 'cyan' },
      { label: 'หนังสือ',    value: d.counts.books,         icon: 'bi-book-half',      color: 'violet' },
      { label: 'ยืมอยู่',    value: d.counts.borrowedBooks, icon: 'bi-bookmark-check-fill', color: 'rose' },
    ];
  };

  constructor(private api: AdminApiService) {}

  ngOnInit() {
    this.api.getDashboard().subscribe({
      next: res => { if (res.data) this.data.set(res.data); this.loading.set(false); },
      error: ()  => this.loading.set(false)
    });
  }

  // ฟังก์ชันสลับสี Badge ตาม Role ของผู้ใช้งาน
  getRoleClass(role: string): string {
    const r = role?.toLowerCase() || '';
    if (r.includes('admin')) return 'role-admin';
    if (r.includes('student')) return 'role-student';
    if (r.includes('professor')) return 'role-professor';
    return 'role-default';
  }

  // ฟังก์ชันสลับสี Text ตาม Action
  getActionClass(action: string): string {
    const a = action?.toLowerCase() || '';
    if (a.includes('create') || a.includes('add') || a.includes('insert')) return 'text-success-action fw-bold';
    if (a.includes('delete') || a.includes('remove')) return 'text-danger-action fw-bold';
    if (a.includes('update') || a.includes('edit')) return 'text-warning-action fw-bold';
    return 'text-info-action fw-medium';
  }
}