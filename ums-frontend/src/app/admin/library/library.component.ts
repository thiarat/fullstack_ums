import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { LibraryApiService } from '../../core/services/library-api.service';
import { AdminApiService } from '../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-library',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="main-content">
        <app-topbar title="ห้องสมุด" subtitle="จัดการหนังสือและการยืม-คืน" />
        <div class="page-content">

          <ul class="nav nav-tabs mb-3">
            <li class="nav-item">
              <button class="nav-link" [class.active]="tab() === 'books'" (click)="tab.set('books')">
                <i class="bi bi-journals me-1"></i> หนังสือ
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link" [class.active]="tab() === 'records'" (click)="switchRecords()">
                <i class="bi bi-list-check me-1"></i> รายการยืม-คืน
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link" [class.active]="tab() === 'borrow'" (click)="tab.set('borrow')">
                <i class="bi bi-bookmark-plus me-1"></i> ยืมหนังสือ
              </button>
            </li>
          </ul>

          <!-- Books Tab -->
          @if (tab() === 'books') {
            <div class="d-flex gap-2 mb-3">
              <div class="search-box" style="max-width:300px;flex:1">
                <i class="bi bi-search"></i>
                <input class="form-control" [(ngModel)]="bookSearch" (ngModelChange)="loadBooks()" placeholder="ค้นหาชื่อหนังสือ, ผู้แต่ง, ISBN...">
              </div>
              <button class="btn btn-primary ms-auto" (click)="openBookModal()">
                <i class="bi bi-plus-lg me-1"></i> เพิ่มหนังสือ
              </button>
            </div>
            <div class="card">
              <div class="table-responsive">
                <table class="table mb-0">
                  <thead><tr><th>ISBN</th><th>ชื่อหนังสือ</th><th>ผู้แต่ง</th><th>ทั้งหมด</th><th>คงเหลือ</th><th></th></tr></thead>
                  <tbody>
                    <tr *ngFor="let b of books()" class="stagger-item">
                      <td><code style="font-size:.78rem">{{ b.isbn }}</code></td>
                      <td><strong>{{ b.title }}</strong></td>
                      <td class="text-muted">{{ b.author }}</td>
                      <td>{{ b.total_copies }}</td>
                      <td>
                        <span class="badge" [class]="b.available_copies > 0 ? 'bg-success' : 'bg-danger'">{{ b.available_copies }}</span>
                      </td>
                      <td>
                        <button class="btn btn-icon btn-sm btn-outline-danger" (click)="deleteBook(b.book_id)">
                          <i class="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="empty-state" *ngIf="!books().length"><i class="bi bi-books"></i><p>ไม่พบหนังสือ</p></div>
            </div>
          }

          <!-- Records Tab -->
          @if (tab() === 'records') {
            <div class="d-flex gap-2 mb-3 flex-wrap">
              <div class="search-box" style="max-width:280px;flex:1">
                <i class="bi bi-search"></i>
                <input class="form-control" [(ngModel)]="recordSearch" (ngModelChange)="filterRecords()" placeholder="ค้นหาชื่อนักศึกษา, ชื่อหนังสือ...">
              </div>
              <select class="form-select" style="max-width:170px" [(ngModel)]="statusFilter" (ngModelChange)="loadRecords()">
                <option value="">ทุกสถานะ</option>
                <option value="Borrowed">กำลังยืม</option>
                <option value="Overdue">เกินกำหนด</option>
                <option value="Returned">คืนแล้ว</option>
                <option value="Late">คืนล่าช้า</option>
              </select>
            </div>
            <div class="card">
              <div class="table-responsive">
                <table class="table mb-0">
                  <thead><tr><th>นักศึกษา</th><th>หนังสือ</th><th>วันยืม</th><th>กำหนดคืน</th><th>ค่าปรับ</th><th>สถานะ</th><th></th></tr></thead>
                  <tbody>
                    <tr *ngFor="let r of filteredRecords()" class="stagger-item">
                      <td>
                        <code style="font-size:.76rem">{{ r.student_code }}</code>
                        <br><small class="text-muted">{{ r.student_name }}</small>
                      </td>
                      <td style="max-width:200px;font-size:.82rem">{{ r.book_title }}</td>
                      <td style="font-size:.78rem;white-space:nowrap">{{ r.borrow_date | date:'dd/MM/yy' }}</td>
                      <td style="font-size:.78rem;white-space:nowrap">
                        <span [class.text-danger]="isOverdue(r)">{{ r.due_date | date:'dd/MM/yy' }}</span>
                      </td>
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
                      <td>
                        <button *ngIf="r.status === 'Borrowed'" class="btn btn-sm btn-success"
                                (click)="returnBook(r.record_id)" style="white-space:nowrap">
                          <i class="bi bi-check2 me-1"></i> คืนหนังสือ
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="empty-state" *ngIf="!filteredRecords().length">
                <i class="bi bi-inbox"></i><p>ไม่พบรายการ</p>
              </div>
            </div>
          }

          <!-- Borrow Tab — ออกแบบใหม่ตาม feedback -->
          @if (tab() === 'borrow') {
            <div class="borrow-layout">

              <!-- ส่วนนักศึกษา -->
              <div class="borrow-section">
                <label class="form-label fw-bold">
                  <i class="bi bi-person-badge me-1"></i> ค้นหานักศึกษา
                </label>
                <input class="form-control" [(ngModel)]="studentQuery"
                       (ngModelChange)="searchStudents()"
                       placeholder="กรอกรหัสนักศึกษา เช่น 11661090...">
                <!-- ผลการค้นหา -->
                @if (studentResults().length > 0) {
                  <div class="result-panel">
                    @for (s of studentResults(); track s.student_id) {
                      <div class="result-item" [class.selected]="selectedStudent()?.student_id === s.student_id"
                           (click)="selectStudent(s)">
                        <div class="d-flex align-items-center gap-2">
                          <div class="avatar-xs">{{ s.first_name?.[0] }}</div>
                          <div>
                            <div class="fw-600">{{ s.first_name }} {{ s.last_name }}</div>
                            <code style="font-size:.75rem">{{ s.username }}</code>
                          </div>
                          <i class="bi bi-check-circle-fill text-success ms-auto" *ngIf="selectedStudent()?.student_id === s.student_id"></i>
                        </div>
                      </div>
                    }
                  </div>
                }
                @if (selectedStudent()) {
                  <div class="selected-chip">
                    <i class="bi bi-person-check-fill text-success"></i>
                    <strong>{{ selectedStudent()!.first_name }} {{ selectedStudent()!.last_name }}</strong>
                    <code>{{ selectedStudent()!.username }}</code>
                    <button class="btn-clear" (click)="selectedStudent.set(null); studentQuery=''">✕</button>
                  </div>
                }
              </div>

              <!-- ส่วนหนังสือ -->
              <div class="borrow-section">
                <label class="form-label fw-bold">
                  <i class="bi bi-book me-1"></i> ค้นหาหนังสือ
                </label>
                <input class="form-control" [(ngModel)]="bookQuery"
                       (ngModelChange)="searchBooksBorrow()"
                       placeholder="ค้นหาชื่อหนังสือ, ผู้แต่ง, ISBN...">
                @if (bookResults().length > 0) {
                  <div class="result-panel">
                    @for (b of bookResults(); track b.book_id) {
                      <div class="result-item" [class.selected]="selectedBook()?.book_id === b.book_id"
                           [class.unavailable]="b.available_copies === 0"
                           (click)="b.available_copies > 0 && selectBook(b)">
                        <div class="d-flex align-items-center gap-2">
                          <i class="bi bi-book-fill" style="color:#3b82f6;font-size:1.1rem"></i>
                          <div style="flex:1;min-width:0">
                            <div class="fw-600 text-truncate">{{ b.title }}</div>
                            <small class="text-muted">{{ b.author }}</small>
                          </div>
                          <span class="badge" [class]="b.available_copies > 0 ? 'bg-success' : 'bg-danger'">
                            {{ b.available_copies > 0 ? b.available_copies + ' เล่ม' : 'ไม่ว่าง' }}
                          </span>
                          <i class="bi bi-check-circle-fill text-success" *ngIf="selectedBook()?.book_id === b.book_id"></i>
                        </div>
                      </div>
                    }
                  </div>
                }
                @if (selectedBook()) {
                  <div class="selected-chip">
                    <i class="bi bi-bookmark-check-fill text-primary"></i>
                    <strong>{{ selectedBook()!.title }}</strong>
                    <span class="badge bg-success">{{ selectedBook()!.available_copies }} เล่ม</span>
                    <button class="btn-clear" (click)="selectedBook.set(null); bookQuery=''">✕</button>
                  </div>
                }
              </div>

              <!-- ปุ่มยืนยัน -->
              <div class="borrow-confirm">
                <div class="alert alert-success py-2" *ngIf="borrowMsg()">{{ borrowMsg() }}</div>
                <div class="alert alert-danger py-2" *ngIf="borrowErr()">{{ borrowErr() }}</div>
                <button class="btn btn-primary btn-lg w-100" (click)="borrow()"
                        [disabled]="!selectedStudent() || !selectedBook()">
                  <i class="bi bi-bookmark-plus me-2"></i>
                  ยืนยันการยืมหนังสือ
                </button>
                <p class="text-muted text-center small mt-2" *ngIf="!selectedStudent() || !selectedBook()">
                  กรุณาเลือกนักศึกษาและหนังสือก่อนยืนยัน
                </p>
              </div>

            </div>
          }

          <!-- Book Modal -->
          @if (showBookModal()) {
            <div class="modal-backdrop show" (click)="showBookModal.set(false)"></div>
            <div class="modal show d-block">
              <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
                <div class="modal-content">
                  <div class="modal-header"><h5 class="modal-title">เพิ่มหนังสือ</h5>
                    <button class="btn-close" (click)="showBookModal.set(false)"></button></div>
                  <div class="modal-body">
                    <div class="mb-3"><label class="form-label">ISBN *</label>
                      <input class="form-control" [(ngModel)]="bookForm.isbn" placeholder="978-x-xxx-xxxxx-x"></div>
                    <div class="mb-3"><label class="form-label">ชื่อหนังสือ *</label>
                      <input class="form-control" [(ngModel)]="bookForm.title"></div>
                    <div class="mb-3"><label class="form-label">ผู้แต่ง</label>
                      <input class="form-control" [(ngModel)]="bookForm.author"></div>
                    <div class="mb-3"><label class="form-label">จำนวนเล่ม</label>
                      <input type="number" class="form-control" [(ngModel)]="bookForm.total_copies" min="1"></div>
                  </div>
                  <div class="modal-footer">
                    <button class="btn btn-secondary" (click)="showBookModal.set(false)">ยกเลิก</button>
                    <button class="btn btn-primary" (click)="saveBook()">เพิ่มหนังสือ</button>
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
    .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:1040; }
    .modal { z-index:1050; }
    .search-box { position:relative; }
    .search-box i { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#94a3b8; z-index:1; }
    .search-box .form-control { padding-left:36px; }
    .borrow-layout { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
    .borrow-section { background:#fff; border-radius:16px; padding:20px; border:1px solid #e2e8f0; box-shadow:0 2px 8px rgba(0,0,0,.04); }
    .borrow-confirm { grid-column:1/-1; background:#fff; border-radius:16px; padding:20px; border:1px solid #e2e8f0; }
    .result-panel { border:1px solid #e2e8f0; border-radius:10px; margin-top:8px; max-height:240px; overflow-y:auto; }
    .result-item { padding:12px 16px; cursor:pointer; border-bottom:1px solid #f1f5f9; transition:.15s; }
    .result-item:last-child { border-bottom:none; }
    .result-item:hover { background:#f8fafc; }
    .result-item.selected { background:#eff6ff; border-left:3px solid #3b82f6; }
    .result-item.unavailable { opacity:.5; cursor:not-allowed; }
    .selected-chip { display:flex; align-items:center; gap:8px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:10px 14px; margin-top:10px; }
    .selected-chip strong { flex:1; }
    .btn-clear { background:none; border:none; color:#94a3b8; cursor:pointer; font-size:1rem; padding:0 4px; margin-left:auto; }
    .avatar-xs { width:30px; height:30px; border-radius:50%; background:linear-gradient(135deg,#3b82f6,#6366f1); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:.85rem; flex-shrink:0; }
    .fw-600 { font-weight:600; }
    @media(max-width:768px){ .borrow-layout { grid-template-columns:1fr; } }
  `]
})
export class AdminLibraryComponent implements OnInit {
  tab = signal<'books'|'records'|'borrow'>('books');
  books = signal<any[]>([]);
  records = signal<any[]>([]);
  filteredRecords = signal<any[]>([]);
  showBookModal = signal(false);
  bookSearch = ''; statusFilter = ''; recordSearch = '';
  bookForm: any = { isbn: '', title: '', author: '', total_copies: 1 };

  // borrow form new
  studentQuery = ''; bookQuery = '';
  studentResults = signal<any[]>([]);
  bookResults    = signal<any[]>([]);
  selectedStudent = signal<any>(null);
  selectedBook    = signal<any>(null);
  borrowMsg = signal(''); borrowErr = signal('');
  private stdTimer: any; private bkTimer: any;

  constructor(private api: LibraryApiService, private adminApi: AdminApiService) {}
  ngOnInit() { this.loadBooks(); }

  switchRecords() { this.tab.set('records'); this.loadRecords(); }

  loadBooks() {
    this.api.getBooks(this.bookSearch).subscribe(r => {
      if (r.data) this.books.set((r.data as any).data ?? r.data);
    });
  }

  loadRecords() {
    this.api.getRecords(this.statusFilter).subscribe(r => {
      const data = r.data ? ((r.data as any).data ?? r.data) : [];
      this.records.set(data);
      this.filterRecords();
    });
  }

  filterRecords() {
    const q = this.recordSearch.toLowerCase();
    const s = this.statusFilter;
    let result = this.records();
    if (s) {
      result = result.filter(r => {
        if (s === 'Borrowed') return r.status === 'Borrowed';
        if (s === 'Returned') return r.status === 'Returned';
        if (s === 'Late') return r.status === 'Returned (Late)';
        if (s === 'Overdue') return r.status === 'Borrowed' && new Date(r.due_date) < new Date();
        return true;
      });
    }
    if (q) {
      result = result.filter(r =>
        r.student_name?.toLowerCase().includes(q) ||
        r.student_code?.toLowerCase().includes(q) ||
        r.book_title?.toLowerCase().includes(q)
      );
    }
    this.filteredRecords.set(result);
  }

  isOverdue(r: any) { return r.status === 'Borrowed' && new Date(r.due_date) < new Date(); }

  openBookModal() { this.bookForm = { isbn: '', title: '', author: '', total_copies: 1 }; this.showBookModal.set(true); }
  saveBook() { this.api.createBook(this.bookForm).subscribe(() => { this.showBookModal.set(false); this.loadBooks(); }); }
  deleteBook(id: number) { if (confirm('ลบหนังสือ?')) this.api.deleteBook(id).subscribe(() => this.loadBooks()); }
  returnBook(id: number) { this.api.returnBook(id).subscribe(() => this.loadRecords()); }

  // ── borrow new ──
  searchStudents() {
    clearTimeout(this.stdTimer);
    if (!this.studentQuery || this.studentQuery.length < 3) { this.studentResults.set([]); return; }
    this.stdTimer = setTimeout(() => {
      this.adminApi.getStudents({ search: this.studentQuery, limit: 8 }).subscribe({
        next: (r: any) => this.studentResults.set(r.data?.data ?? []),
        error: () => {}
      });
    }, 300);
  }

  searchBooksBorrow() {
    clearTimeout(this.bkTimer);
    if (!this.bookQuery || this.bookQuery.length < 2) { this.bookResults.set([]); return; }
    this.bkTimer = setTimeout(() => {
      this.api.getBooks(this.bookQuery).subscribe({
        next: (r: any) => this.bookResults.set((r.data as any)?.data ?? r.data ?? []),
        error: () => {}
      });
    }, 300);
  }

  selectStudent(s: any) { this.selectedStudent.set(s); this.studentResults.set([]); }
  selectBook(b: any) { this.selectedBook.set(b); this.bookResults.set([]); }

  borrow() {
    this.borrowMsg.set(''); this.borrowErr.set('');
    if (!this.selectedStudent() || !this.selectedBook()) { this.borrowErr.set('กรุณาเลือกนักศึกษาและหนังสือ'); return; }
    this.api.borrowBook(this.selectedStudent().student_id, this.selectedBook().book_id).subscribe({
      next: (r: any) => {
        this.borrowMsg.set(r.message ?? 'ยืมสำเร็จ');
        this.selectedStudent.set(null); this.selectedBook.set(null);
        this.studentQuery = ''; this.bookQuery = '';
        setTimeout(() => this.borrowMsg.set(''), 4000);
        this.loadBooks();
      },
      error: (e: any) => this.borrowErr.set(e.error?.message ?? 'เกิดข้อผิดพลาด')
    });
  }
}
