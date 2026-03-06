import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { StudentApiService } from '../../core/services/student-api.service';

@Component({
  selector: 'app-student-library',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="main-content">
        <app-topbar title="ห้องสมุด" subtitle="ค้นหาและยืมหนังสือ" />
        <div class="page-content">
          <ul class="nav nav-tabs mb-3">
            <li class="nav-item"><button class="nav-link" [class.active]="tab() === 'search'" (click)="tab.set('search')">ค้นหาหนังสือ</button></li>
            <li class="nav-item"><button class="nav-link" [class.active]="tab() === 'borrowed'" (click)="tab.set('borrowed'); loadBorrowed()">หนังสือที่ยืม</button></li>
          </ul>

          <div *ngIf="tab() === 'search'">
            <div class="search-box mb-3" style="max-width:400px">
              <i class="bi bi-search"></i>
              <input class="form-control" [(ngModel)]="search" (ngModelChange)="loadBooks()" placeholder="ค้นหาชื่อหนังสือ, ผู้แต่ง, ISBN...">
            </div>
            <div class="row g-3">
              <div class="col-md-6 col-lg-4 stagger-item" *ngFor="let b of books()">
                <div class="card book-card h-100">
                  <div class="card-body">
                    <div class="book-icon"><i class="bi bi-book-fill"></i></div>
                    <h6 class="mt-2 mb-1">{{ b.title }}</h6>
                    <div class="text-muted" style="font-size:.8rem">{{ b.author }}</div>
                    <div class="text-muted" style="font-size:.72rem" class="mono">ISBN: {{ b.isbn }}</div>
                    <div class="d-flex justify-content-between align-items-center mt-3">
                      <span class="badge" [class]="b.available_copies > 0 ? 'bg-success' : 'bg-secondary'">
                        {{ b.available_copies > 0 ? 'มี ' + b.available_copies + ' เล่ม' : 'ไม่ว่าง' }}
                      </span>
                      <small class="text-muted">{{ b.total_copies }} เล่มทั้งหมด</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="empty-state" *ngIf="!books().length">
              <i class="bi bi-search"></i><p>ไม่พบหนังสือ</p>
            </div>
          </div>

          <div *ngIf="tab() === 'borrowed'">
            <div class="card">
              <div class="table-responsive">
                <table class="table mb-0">
                  <thead><tr><th>หนังสือ</th><th>ยืมวันที่</th><th>กำหนดคืน</th><th>คืนวันที่</th><th>ค่าปรับ</th><th>สถานะ</th></tr></thead>
                  <tbody>
                    <tr *ngFor="let r of borrowed()" class="stagger-item">
                      <td style="max-width:200px"><strong>{{ r.book_title }}</strong></td>
                      <td style="font-size:.82rem">{{ r.borrow_date | date:'dd/MM/yy' }}</td>
                      <td style="font-size:.82rem" [class.text-danger]="isOverdue(r)">
                        {{ r.due_date | date:'dd/MM/yy' }}
                        <i class="bi bi-exclamation-circle" *ngIf="isOverdue(r)"></i>
                      </td>
                      <td style="font-size:.82rem">{{ r.return_date ? (r.return_date | date:'dd/MM/yy') : '-' }}</td>
                      <td>
                        <span *ngIf="r.current_fine > 0" class="text-danger fw-bold">฿{{ r.current_fine }}</span>
                        <span *ngIf="!r.current_fine" class="text-muted">-</span>
                      </td>
                      <td>
                        <span class="badge"
                              [class.bg-warning]="r.status === 'Borrowed'"
                              [class.text-dark]="r.status === 'Borrowed'"
                              [class.bg-success]="r.status === 'Returned'"
                              [class.bg-danger]="r.status === 'Returned (Late)'">
                          {{ r.status }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="empty-state" *ngIf="!borrowed().length">
                <i class="bi bi-bookmarks"></i><p>ยังไม่มีประวัติการยืม</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .book-card:hover { transform: translateY(-2px); }
    .book-icon { width: 44px; height: 44px; border-radius: 10px; background: linear-gradient(135deg, #dbeafe, #ede9fe); display: flex; align-items: center; justify-content: center; color: #3b82f6; font-size: 1.25rem; }
  `]
})
export class StudentLibraryComponent implements OnInit {
  tab = signal<'search'|'borrowed'>('search');
  books = signal<any[]>([]); borrowed = signal<any[]>([]);
  search = '';

  constructor(private api: StudentApiService) {}
  ngOnInit() { this.loadBooks(); }

  loadBooks() { this.api.searchBooks(this.search).subscribe(r => { if (r.data) this.books.set(r.data as any[]); }); }
  loadBorrowed() { this.api.getBorrowedBooks().subscribe(r => { if (r.data) this.borrowed.set(r.data as any[]); }); }
  isOverdue(r: any) { return !r.return_date && new Date(r.due_date) < new Date(); }
}
