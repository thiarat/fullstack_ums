import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { LibraryApiService } from '../../core/services/library-api.service';

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

          <!-- Tabs -->
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
              <!-- ค้นหา -->
              <div class="search-box" style="max-width:280px;flex:1">
                <i class="bi bi-search"></i>
                <input class="form-control" [(ngModel)]="recordSearch" (ngModelChange)="filterRecords()" placeholder="ค้นหาชื่อนักศึกษา, ชื่อหนังสือ...">
              </div>
              <!-- filter สถานะ -->
              <select class="form-select" style="max-width:170px" [(ngModel)]="statusFilter" (ngModelChange)="loadRecords()">
                <option value="">ทุกสถานะ</option>
                <option value="Borrowed">กำลังยืม</option>
                <option value="Returned">คืนแล้ว</option>
                <option value="Returned (Late)">คืนล่าช้า</option>
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

          <!-- Borrow Tab -->
          @if (tab() === 'borrow') {
            <div class="card" style="max-width:400px">
              <div class="card-header"><i class="bi bi-bookmark-plus me-2"></i>ยืมหนังสือ</div>
              <div class="card-body">
                <div class="mb-3">
                  <label class="form-label">Student ID</label>
                  <input type="number" class="form-control" [(ngModel)]="borrowForm.student_id" placeholder="กรอก Student ID">
                </div>
                <div class="mb-3">
                  <label class="form-label">Book ID</label>
                  <input type="number" class="form-control" [(ngModel)]="borrowForm.book_id" placeholder="กรอก Book ID">
                </div>
                <div class="alert alert-success py-2" *ngIf="borrowMsg()">{{ borrowMsg() }}</div>
                <div class="alert alert-danger py-2" *ngIf="borrowErr()">{{ borrowErr() }}</div>
                <button class="btn btn-primary w-100" (click)="borrow()">
                  <i class="bi bi-bookmark-plus me-1"></i> ยืมหนังสือ
                </button>
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
  styles: [`.modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1040}.modal{z-index:1050}`]
})
export class AdminLibraryComponent implements OnInit {
  tab = signal<'books'|'records'|'borrow'>('books');
  books = signal<any[]>([]);
  records = signal<any[]>([]);
  filteredRecords = signal<any[]>([]);
  showBookModal = signal(false);
  bookSearch = ''; statusFilter = ''; recordSearch = '';
  bookForm: any = { isbn: '', title: '', author: '', total_copies: 1 };
  borrowForm = { student_id: null as any, book_id: null as any };
  borrowMsg = signal(''); borrowErr = signal('');

  constructor(private api: LibraryApiService) {}
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
    this.filteredRecords.set(
      q ? this.records().filter(r =>
        r.student_name?.toLowerCase().includes(q) ||
        r.student_code?.toLowerCase().includes(q) ||
        r.book_title?.toLowerCase().includes(q)
      ) : this.records()
    );
  }

  isOverdue(r: any) {
    return r.status === 'Borrowed' && new Date(r.due_date) < new Date();
  }

  openBookModal() {
    this.bookForm = { isbn: '', title: '', author: '', total_copies: 1 };
    this.showBookModal.set(true);
  }

  saveBook() {
    this.api.createBook(this.bookForm).subscribe(() => { this.showBookModal.set(false); this.loadBooks(); });
  }

  deleteBook(id: number) {
    if (confirm('ลบหนังสือ?')) this.api.deleteBook(id).subscribe(() => this.loadBooks());
  }

  returnBook(id: number) {
    this.api.returnBook(id).subscribe(() => this.loadRecords());
  }

  borrow() {
    this.borrowMsg.set(''); this.borrowErr.set('');
    const { student_id, book_id } = this.borrowForm;
    if (!student_id || !book_id) { this.borrowErr.set('กรุณาใส่ Student ID และ Book ID'); return; }
    this.api.borrowBook(student_id, book_id).subscribe({
      next: (r: any) => { this.borrowMsg.set(r.message ?? 'ยืมสำเร็จ'); this.borrowForm = { student_id: null, book_id: null }; },
      error: (e: any) => { this.borrowErr.set(e.error?.message ?? 'เกิดข้อผิดพลาด'); }
    });
  }
}
