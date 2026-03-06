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
              <button class="nav-link" [class.active]="tab() === 'records'" (click)="tab.set('records'); loadRecords()">
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
          <div *ngIf="tab() === 'books'">
            <div class="d-flex gap-2 mb-3">
              <div class="search-box" style="max-width:300px;flex:1">
                <i class="bi bi-search"></i>
                <input class="form-control" [(ngModel)]="bookSearch" (ngModelChange)="loadBooks()" placeholder="ค้นหาชื่อหนังสือ, ผู้แต่ง...">
              </div>
              <button class="btn btn-primary ms-auto" (click)="openBookModal()">
                <i class="bi bi-plus-lg me-1"></i> เพิ่มหนังสือ
              </button>
            </div>
            <div class="card">
              <div class="table-responsive">
                <table class="table">
                  <thead><tr><th>ISBN</th><th>ชื่อหนังสือ</th><th>ผู้แต่ง</th><th>ทั้งหมด</th><th>คงเหลือ</th><th></th></tr></thead>
                  <tbody>
                    <tr *ngFor="let b of books()" class="stagger-item">
                      <td><code style="font-size:.78rem">{{ b.isbn }}</code></td>
                      <td><strong>{{ b.title }}</strong></td>
                      <td class="text-muted">{{ b.author }}</td>
                      <td>{{ b.total_copies }}</td>
                      <td>
                        <span class="badge" [class]="b.available_copies > 0 ? 'bg-success' : 'bg-danger'">
                          {{ b.available_copies }}
                        </span>
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
            </div>
          </div>

          <!-- Records Tab -->
          <div *ngIf="tab() === 'records'">
            <div class="d-flex gap-2 mb-3">
              <select class="form-select" style="max-width:180px" [(ngModel)]="statusFilter" (ngModelChange)="loadRecords()">
                <option value="">ทุกสถานะ</option>
                <option value="Borrowed">Borrowed</option>
                <option value="Returned">Returned</option>
                <option value="Returned (Late)">Returned (Late)</option>
              </select>
            </div>
            <div class="card">
              <div class="table-responsive">
                <table class="table">
                  <thead><tr><th>นักศึกษา</th><th>หนังสือ</th><th>ยืม</th><th>กำหนดคืน</th><th>ค่าปรับ</th><th>สถานะ</th><th></th></tr></thead>
                  <tbody>
                    <tr *ngFor="let r of records()" class="stagger-item">
                      <td><code>{{ r.student_code }}</code><br><small class="text-muted">{{ r.student_name }}</small></td>
                      <td style="max-width:200px;font-size:.82rem">{{ r.book_title }}</td>
                      <td style="font-size:.78rem">{{ r.borrow_date | date:'dd/MM/yy' }}</td>
                      <td style="font-size:.78rem">{{ r.due_date | date:'dd/MM/yy' }}</td>
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
                      <td>
                        <button *ngIf="r.status === 'Borrowed'" class="btn btn-sm btn-outline-success"
                                (click)="returnBook(r.record_id)">
                          คืน
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Borrow Tab -->
          <div *ngIf="tab() === 'borrow'">
            <div class="card" style="max-width:400px">
              <div class="card-header">ยืมหนังสือ</div>
              <div class="card-body">
                <div class="mb-3">
                  <label class="form-label">Student ID</label>
                  <input type="number" class="form-control" [(ngModel)]="borrowForm.student_id" placeholder="Student ID">
                </div>
                <div class="mb-3">
                  <label class="form-label">Book ID</label>
                  <input type="number" class="form-control" [(ngModel)]="borrowForm.book_id" placeholder="Book ID">
                </div>
                <div class="alert alert-success" *ngIf="borrowMsg()">{{ borrowMsg() }}</div>
                <div class="alert alert-danger" *ngIf="borrowErr()">{{ borrowErr() }}</div>
                <button class="btn btn-primary w-100" (click)="borrow()">ยืมหนังสือ</button>
              </div>
            </div>
          </div>

          <!-- Book Modal -->
          <div class="modal-backdrop show" *ngIf="showBookModal()" (click)="showBookModal.set(false)"></div>
          <div class="modal show d-block" *ngIf="showBookModal()">
            <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
              <div class="modal-content">
                <div class="modal-header"><h5 class="modal-title">เพิ่มหนังสือ</h5>
                  <button class="btn-close" (click)="showBookModal.set(false)"></button></div>
                <div class="modal-body">
                  <div class="mb-3"><label class="form-label">ISBN *</label>
                    <input class="form-control" [(ngModel)]="bookForm.isbn"></div>
                  <div class="mb-3"><label class="form-label">ชื่อหนังสือ *</label>
                    <input class="form-control" [(ngModel)]="bookForm.title"></div>
                  <div class="mb-3"><label class="form-label">ผู้แต่ง</label>
                    <input class="form-control" [(ngModel)]="bookForm.author"></div>
                  <div class="mb-3"><label class="form-label">จำนวน</label>
                    <input type="number" class="form-control" [(ngModel)]="bookForm.total_copies" min="1"></div>
                </div>
                <div class="modal-footer">
                  <button class="btn btn-secondary" (click)="showBookModal.set(false)">ยกเลิก</button>
                  <button class="btn btn-primary" (click)="saveBook()">เพิ่ม</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`.modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1040}.modal{z-index:1050}`]
})
export class AdminLibraryComponent implements OnInit {
  tab = signal<'books'|'records'|'borrow'>('books');
  books = signal<any[]>([]); records = signal<any[]>([]);
  showBookModal = signal(false);
  bookSearch = ''; statusFilter = '';
  bookForm: any = { isbn: '', title: '', author: '', total_copies: 1 };
  borrowForm = { student_id: null, book_id: null };
  borrowMsg = signal(''); borrowErr = signal('');

  constructor(private api: LibraryApiService) {}
  ngOnInit() { this.loadBooks(); }

  loadBooks() {
    this.api.getBooks(this.bookSearch).subscribe(r => { if (r.data) this.books.set((r.data as any).data ?? r.data); });
  }

  loadRecords() {
    this.api.getRecords(this.statusFilter).subscribe(r => { if (r.data) this.records.set((r.data as any).data ?? r.data); });
  }

  openBookModal() { this.bookForm = { isbn: '', title: '', author: '', total_copies: 1 }; this.showBookModal.set(true); }

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
      next: (r: any) => { this.borrowMsg.set(r.message ?? 'ยืมสำเร็จ'); },
      error: (e) => { this.borrowErr.set(e.error?.message ?? 'เกิดข้อผิดพลาด'); }
    });
  }
}
