import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { AdminApiService } from '../../core/services/admin-api.service';
import { Department } from '../../shared/models';

@Component({
  selector: 'app-admin-departments',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="main-content">
        <app-topbar title="แผนก" subtitle="จัดการแผนกทั้งหมด" />
        <div class="page-content">

          <div class="d-flex justify-content-end mb-3">
            <button class="btn btn-primary" (click)="openModal()">
              <i class="bi bi-plus-lg me-1"></i> เพิ่มแผนก
            </button>
          </div>

          <div class="row g-3">
            <div class="col-md-6 col-lg-4 stagger-item" *ngFor="let d of departments()">
              <div class="card dept-card h-100">
                <div class="card-body">
                  <div class="d-flex align-items-start justify-content-between">
                    <div class="dept-icon"><i class="bi bi-building-fill"></i></div>
                    <div class="d-flex gap-1">
                      <button class="btn btn-icon btn-outline-secondary btn-sm" (click)="openModal(d)">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-icon btn-outline-danger btn-sm" (click)="delete(d)">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                  <h5 class="mt-3 mb-1">{{ d.name }}</h5>
                  <div class="text-muted" style="font-size:.82rem">
                    <i class="bi bi-geo-alt me-1"></i>{{ d.location || 'ไม่ระบุ' }}
                  </div>
                  <div class="dept-stats mt-3">
                    <span><i class="bi bi-person-badge"></i> {{ d.professor_count }} อาจารย์</span>
                    <span><i class="bi bi-book"></i> {{ d.course_count }} วิชา</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal -->
          <div class="modal-backdrop show" *ngIf="showModal()" (click)="closeModal()"></div>
          <div class="modal show d-block" *ngIf="showModal()">
            <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">{{ editing() ? 'แก้ไขแผนก' : 'เพิ่มแผนกใหม่' }}</h5>
                  <button type="button" class="btn-close" (click)="closeModal()"></button>
                </div>
                <div class="modal-body">
                  <div class="mb-3">
                    <label class="form-label">ชื่อแผนก *</label>
                    <input type="text" class="form-control" [(ngModel)]="form.name" placeholder="เช่น Computer Science">
                  </div>
                  <div class="mb-3">
                    <label class="form-label">ที่ตั้ง</label>
                    <input type="text" class="form-control" [(ngModel)]="form.location" placeholder="เช่น Building A, Floor 3">
                  </div>
                </div>
                <div class="modal-footer">
                  <button class="btn btn-secondary" (click)="closeModal()">ยกเลิก</button>
                  <button class="btn btn-primary" (click)="save()" [disabled]="!form.name">
                    {{ editing() ? 'บันทึก' : 'เพิ่ม' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .dept-card { transition: transform .2s; &:hover { transform: translateY(-2px); } }
    .dept-icon {
      width: 44px; height: 44px; border-radius: 12px;
      background: linear-gradient(135deg, #dbeafe, #ede9fe);
      display: flex; align-items: center; justify-content: center;
      color: #3b82f6; font-size: 1.25rem;
    }
    .dept-stats { display: flex; gap: 1rem; font-size: .78rem; color: var(--text-secondary);
      span { display: flex; align-items: center; gap: .3rem; }
    }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 1040; }
    .modal { z-index: 1050; }
  `]
})
export class AdminDepartmentsComponent implements OnInit {
  departments = signal<Department[]>([]);
  showModal = signal(false);
  editing = signal<Department | null>(null);
  form = { name: '', location: '' };

  constructor(private api: AdminApiService) {}
  ngOnInit() { this.load(); }

  load() {
    this.api.getDepartments().subscribe(res => {
      if (res.data) this.departments.set(res.data as Department[]);
    });
  }

  openModal(d?: Department) {
    this.editing.set(d ?? null);
    this.form = { name: d?.name ?? '', location: d?.location ?? '' };
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  save() {
    const ed = this.editing();
    const obs = ed
      ? this.api.updateDepartment(ed.dept_id, this.form)
      : this.api.createDepartment(this.form as any);
    obs.subscribe(() => { this.closeModal(); this.load(); });
  }

  delete(d: Department) {
    if (confirm(`ลบแผนก "${d.name}"?`)) {
      this.api.deleteDepartment(d.dept_id).subscribe(() => this.load());
    }
  }
}
