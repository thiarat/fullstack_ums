import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { AdminApiService } from '../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-professors',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="main-content">
        <app-topbar title="จัดการอาจารย์" subtitle="รายชื่ออาจารย์ทั้งหมด" />
        <div class="page-content">
          <div class="d-flex gap-2 mb-3">
            <div class="search-box" style="max-width:360px;flex:1">
              <i class="bi bi-search"></i>
              <input type="text" class="form-control" [(ngModel)]="search"
                     (ngModelChange)="load()" placeholder="ค้นหาชื่อ, email...">
            </div>
          </div>
          <div class="card">
            <div *ngIf="loading()" class="loading-overlay"><div class="spinner-border"></div></div>
            <div class="table-responsive" *ngIf="!loading()">
              <table class="table">
                <thead>
                  <tr><th>ชื่อ-นามสกุล</th><th>Email</th><th>แผนก</th><th>สถานะ</th></tr>
                </thead>
                <tbody>
                  <tr *ngFor="let p of professors()" class="stagger-item">
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <div class="avatar-sm green">{{ p.first_name[0] }}{{ p.last_name[0] }}</div>
                        <strong>{{ p.first_name }} {{ p.last_name }}</strong>
                      </div>
                    </td>
                    <td class="text-muted" style="font-size:.82rem">{{ p.email }}</td>
                    <td><span class="badge bg-light text-dark border">{{ p.department }}</span></td>
                    <td>
                      <span class="badge" [class]="p.is_active ? 'bg-success' : 'bg-secondary'">
                        {{ p.is_active ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`.avatar-sm{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#d1fae5,#a7f3d0);color:#065f46;font-weight:700;font-size:.72rem;display:flex;align-items:center;justify-content:center;flex-shrink:0}`]
})
export class AdminProfessorsComponent implements OnInit {
  loading = signal(true);
  professors = signal<any[]>([]);
  search = '';

  constructor(private api: AdminApiService) {}
  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true);
    this.api.getProfessors(1, 50, this.search).subscribe({
      next: res => { if (res.data) this.professors.set(res.data.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
