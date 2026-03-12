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
            <div class="d-flex gap-2 mb-3 flex-wrap">
              <div class="search-box" style="max-width:320px;flex:1">
                <i class="bi bi-search"></i>
                <input class="form-control" [(ngModel)]="search" (ngModelChange)="loadBooks()" placeholder="ค้นหาชื่อหนังสือ, ผู้แต่ง, ISBN...">
              </div>
              <select class="form-select" style="max-width:200px" [(ngModel)]="deptFilter" (ngModelChange)="loadBooks()">
                <option value="">ทุกแผนก</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Business Administration">Business Administration</option>
                <option value="Engineering">Engineering</option>
              </select>
            </div>
            <div class="row g-3">
              <div class="col-md-6 col-lg-4 stagger-item" *ngFor="let b of books()">
                <div class="card book-card h-100 clickable-card" (click)="viewBook(b)">
                  <div class="card-body">
                    <div class="book-icon"><i class="bi bi-book-fill"></i></div>
                    <h6 class="mt-2 mb-1">{{ b.title }}</h6>
                    <div class="text-muted" style="font-size:.8rem">{{ b.author }}</div>
                    <div class="text-muted" style="font-size:.72rem">ISBN: {{ b.isbn }}</div>
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
                          {{ r.status === 'Borrowed' ? 'กำลังยืม' : r.status === 'Returned' ? 'คืนแล้ว' : 'คืนล่าช้า' }}
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

          <!-- Book Detail Popup -->
          @if (bookDetail()) {
            <div class="modal-backdrop-full" (click)="bookDetail.set(null)"></div>
            <div class="modal show d-block" style="z-index:1055">
              <div class="modal-dialog modal-dialog-centered modal-lg" (click)="$event.stopPropagation()">
                <div class="modal-content">
                  <div class="modal-header border-0 pb-0">
                    <button class="btn-close ms-auto" (click)="bookDetail.set(null)"></button>
                  </div>
                  <div class="modal-body pt-0">
                    <div class="d-flex gap-4 align-items-start flex-wrap">
                      <!-- Book cover placeholder -->
                      <div class="book-cover-large">
                        <i class="bi bi-book-fill"></i>
                      </div>
                      <div class="flex-1" style="flex:1;min-width:200px">
                        <h4 class="fw-700 mb-1">{{ bookDetail()!.title }}</h4>
                        <div class="text-muted mb-1">{{ bookDetail()!.author }}</div>
                        <div class="text-muted" style="font-size:.8rem">ISBN: {{ bookDetail()!.isbn }}</div>
                        <div class="d-flex gap-2 mt-3 flex-wrap">
                          <span class="badge fs-badge" [class]="bookDetail()!.available_copies > 0 ? 'bg-success' : 'bg-secondary'">
                            {{ bookDetail()!.available_copies > 0 ? 'มี ' + bookDetail()!.available_copies + ' เล่ม' : 'ไม่ว่าง' }}
                          </span>
                          <span class="badge fs-badge bg-light text-dark border">ทั้งหมด {{ bookDetail()!.total_copies }} เล่ม</span>
                          <span class="badge fs-badge bg-light text-dark border" *ngIf="bookDetail()!.department">{{ bookDetail()!.department }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Description -->
                    @if (bookDetail()!.description) {
                      <div class="mt-4">
                        <h6 class="fw-700 text-muted mb-2"><i class="bi bi-card-text me-1"></i>รายละเอียด</h6>
                        <p class="text-secondary" style="line-height:1.7">{{ bookDetail()!.description }}</p>
                      </div>
                    }

                    <!-- Chapters -->
                    @if (bookDetail()!.chapters && bookDetail()!.chapters.length > 0) {
                      <div class="mt-3">
                        <h6 class="fw-700 text-muted mb-2"><i class="bi bi-list-ol me-1"></i>บทเรียน / สารบัญ</h6>
                        <ol class="chapters-list">
                          @for (ch of bookDetail()!.chapters; track $index) {
                            <li>{{ ch }}</li>
                          }
                        </ol>
                      </div>
                    }
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
    .search-box { position:relative; }
    .search-box i { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#94a3b8; z-index:1; }
    .search-box .form-control { padding-left:36px; }
    .book-card:hover { transform: translateY(-2px); transition:.2s; }
    .clickable-card { cursor:pointer; }
    .book-icon { width: 44px; height: 44px; border-radius: 10px; background: linear-gradient(135deg, #dbeafe, #ede9fe); display: flex; align-items: center; justify-content: center; color: #3b82f6; font-size: 1.25rem; }
    .modal-backdrop-full { position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:1050; }
    .fw-700 { font-weight:700; }
    .book-cover-large {
      width:100px; height:140px; border-radius:8px;
      background:linear-gradient(135deg,#dbeafe,#ede9fe);
      display:flex; align-items:center; justify-content:center;
      color:#3b82f6; font-size:2.5rem; flex-shrink:0;
      box-shadow:3px 4px 12px rgba(0,0,0,.12);
    }
    .fs-badge { font-size:.8rem; padding:.35em .7em; }
    .chapters-list { padding-left:1.5rem; }
    .chapters-list li { padding:.25rem 0; color:#475569; font-size:.9rem; }
    .flex-1 { flex:1; }
  `]
})
export class StudentLibraryComponent implements OnInit {
  tab = signal<'search'|'borrowed'>('search');
  books      = signal<any[]>([]);
  borrowed   = signal<any[]>([]);
  bookDetail = signal<any>(null);
  search = ''; deptFilter = '';

  constructor(private api: StudentApiService) {}
  ngOnInit() { this.loadBooks(); }

  loadBooks() { this.api.searchBooks(this.search, this.deptFilter).subscribe(r => { if (r.data) this.books.set(r.data as any[]); }); }
  loadBorrowed() { this.api.getBorrowedBooks().subscribe(r => { if (r.data) this.borrowed.set(r.data as any[]); }); }
  isOverdue(r: any) { return !r.return_date && new Date(r.due_date) < new Date(); }

  viewBook(b: any) {
    // Parse chapters if it's a JSON string
    const chapters = typeof b.chapters === 'string'
      ? (() => { try { return JSON.parse(b.chapters); } catch { return null; } })()
      : b.chapters;
    this.bookDetail.set({ ...b, chapters });
  }
}
