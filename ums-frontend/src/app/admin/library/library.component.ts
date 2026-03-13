import { Component, OnInit, signal, computed } from '@angular/core';
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

          <!-- ═══ Books Tab ═══ -->
          @if (tab() === 'books') {
            <div class="d-flex gap-2 mb-3">
              <div class="search-box" style="max-width:300px;flex:1">
                <i class="bi bi-search"></i>
                <input class="form-control" [(ngModel)]="bookSearch" (ngModelChange)="onBookSearchChange()" placeholder="ค้นหาชื่อหนังสือ, ผู้แต่ง, ISBN...">
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
                    <tr *ngFor="let b of books()" class="stagger-item clickable-row" (click)="viewBook(b)">
                      <td><code style="font-size:.78rem">{{ b.isbn }}</code></td>
                      <td><strong>{{ b.title }}</strong></td>
                      <td class="text-muted">{{ b.author }}</td>
                      <td>{{ b.total_copies }}</td>
                      <td>
                        <span class="badge" [class]="b.available_copies > 0 ? 'bg-success' : 'bg-danger'">{{ b.available_copies }}</span>
                      </td>
                      <td (click)="$event.stopPropagation()">
                        <button class="btn btn-icon btn-sm btn-outline-secondary me-1" (click)="openEditBookModal(b)">
                          <i class="bi bi-pencil"></i>
                        </button>
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
            <div class="d-flex justify-content-between align-items-center mt-3" *ngIf="books().length > 0">
              <span class="text-muted small">แสดง {{ books().length }} จาก {{ bookTotal() }} รายการ</span>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-secondary" [disabled]="bookPage() === 1" (click)="goBookPage(bookPage()-1)">‹</button>
                <button *ngFor="let p of bookPages()" class="btn btn-sm" [class]="p === bookPage() ? 'btn-primary' : 'btn-outline-secondary'" (click)="goBookPage(p)">{{ p }}</button>
                <button class="btn btn-sm btn-outline-secondary" [disabled]="bookPage() === bookTotalPages()" (click)="goBookPage(bookPage()+1)">›</button>
              </div>
            </div>
          }

          <!-- ═══ Records Tab ═══ -->
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

          <!-- ═══ Borrow Tab ═══ -->
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
                      <div class="result-item"
                           [class.unavailable]="b.available_copies === 0"
                           (click)="b.available_copies > 0 && addToQueue(b)">
                        <div class="d-flex align-items-center gap-2">
                          <i class="bi bi-book-fill" style="color:#3b82f6;font-size:1.1rem"></i>
                          <div style="flex:1;min-width:0">
                            <div class="fw-600 text-truncate">{{ b.title }}</div>
                            <small class="text-muted">{{ b.author }}</small>
                          </div>
                          <span class="badge" [class]="b.available_copies > 0 ? 'bg-success' : 'bg-danger'">
                            {{ b.available_copies > 0 ? b.available_copies + ' เล่ม' : 'ไม่ว่าง' }}
                          </span>
                          <i class="bi bi-plus-circle text-primary" *ngIf="b.available_copies > 0" title="เพิ่มในรายการ"></i>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- รายการที่จะยืม (บอร์รเรียก view score) -->
              <div class="borrow-queue-section">
                <label class="form-label fw-bold mb-2">
                  <i class="bi bi-cart-check me-1 text-primary"></i>
                  รายการที่จะยืม
                  <span class="badge bg-primary ms-1">{{ borrowQueue().length }}</span>
                </label>

                @if (!selectedStudent() && borrowQueue().length === 0) {
                  <div class="queue-empty">
                    <i class="bi bi-inbox text-muted" style="font-size:2rem"></i>
                    <p class="text-muted mt-2 mb-0">เลือกนักศึกษาและหนังสือเพื่อเพิ่มในรายการ</p>
                  </div>
                } @else {
                  <!-- นักศึกษาที่เลือก -->
                  @if (selectedStudent()) {
                    <div class="queue-student mb-2">
                      <i class="bi bi-person-circle text-primary me-2"></i>
                      <strong>{{ selectedStudent()!.first_name }} {{ selectedStudent()!.last_name }}</strong>
                      <code class="ms-2">{{ selectedStudent()!.username }}</code>
                    </div>
                  }
                  <!-- รายการหนังสือ -->
                  <div class="queue-scroll">
                    @if (borrowQueue().length === 0) {
                      <div class="text-muted text-center py-3" style="font-size:.85rem">
                        <i class="bi bi-book me-1"></i> ยังไม่มีหนังสือในรายการ — ค้นหาแล้วกดเพิ่ม
                      </div>
                    }
                    @for (item of borrowQueue(); track item.book_id; let i = $index) {
                      <div class="queue-item">
                        <div class="d-flex align-items-center gap-2">
                          <span class="queue-num">{{ i + 1 }}</span>
                          <div style="flex:1;min-width:0">
                            <div class="fw-600 text-truncate">{{ item.title }}</div>
                            <small class="text-muted">{{ item.author }}</small>
                          </div>
                          <span class="badge bg-success">{{ item.available_copies }} เล่ม</span>
                          <button class="btn-clear" (click)="removeFromQueue(i)">✕</button>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- ปุ่มยืนยัน (fixed ที่ด้านล่าง) -->
              <div class="borrow-confirm-fixed">
                <div class="borrow-confirm-inner">
                  <div class="alert alert-success py-2 mb-2" *ngIf="borrowMsg()">{{ borrowMsg() }}</div>
                  <div class="alert alert-danger py-2 mb-2" *ngIf="borrowErr()">{{ borrowErr() }}</div>
                  <div class="d-flex align-items-center gap-3">
                    <div class="text-muted small flex-1" style="flex:1">
                      @if (selectedStudent() && borrowQueue().length > 0) {
                        <i class="bi bi-info-circle me-1"></i>
                        ยืม <strong>{{ borrowQueue().length }}</strong> รายการ ให้กับ
                        <strong>{{ selectedStudent()!.first_name }} {{ selectedStudent()!.last_name }}</strong>
                      } @else {
                        <i class="bi bi-exclamation-circle me-1"></i>
                        กรุณาเลือกนักศึกษาและเพิ่มหนังสืออย่างน้อย 1 เล่ม
                      }
                    </div>
                    <button class="btn btn-primary btn-lg"
                            (click)="borrowAll()"
                            [disabled]="!selectedStudent() || borrowQueue().length === 0 || borrowing()">
                      <span class="spinner-border spinner-border-sm me-1" *ngIf="borrowing()"></span>
                      <i class="bi bi-bookmark-plus me-2" *ngIf="!borrowing()"></i>
                      ยืนยันการยืม ({{ borrowQueue().length }} รายการ)
                    </button>
                  </div>
                </div>
              </div>

            </div>
          }

          <!-- ═══ Book Detail Modal ═══ -->
          @if (bookDetailModal()) {
            <div class="modal-backdrop show" (click)="bookDetailModal.set(null)"></div>
            <div class="modal show d-block">
              <div class="modal-dialog modal-dialog-centered modal-lg" (click)="$event.stopPropagation()">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title">
                      <i class="bi bi-book-half me-2 text-primary"></i>
                      รายละเอียดหนังสือ
                    </h5>
                    <button class="btn-close" (click)="bookDetailModal.set(null)"></button>
                  </div>
                  <div class="modal-body">
                    <div class="book-detail-header mb-3">
                      <div class="book-cover-placeholder">
                        <i class="bi bi-book-fill"></i>
                      </div>
                      <div>
                        <h5 class="mb-1">{{ bookDetailModal()!.title }}</h5>
                        <p class="text-muted mb-1"><i class="bi bi-person me-1"></i>{{ bookDetailModal()!.author || '-' }}</p>
                        <p class="text-muted mb-1" style="font-size:.82rem"><i class="bi bi-upc me-1"></i>ISBN: {{ bookDetailModal()!.isbn }}</p>
                        <div class="d-flex gap-2 mt-2">
                          <span class="badge bg-secondary">{{ bookDetailModal()!.total_copies }} เล่มทั้งหมด</span>
                          <span class="badge" [class]="bookDetailModal()!.available_copies > 0 ? 'bg-success' : 'bg-danger'">
                            {{ bookDetailModal()!.available_copies }} เล่มว่าง
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- Description -->
                    <div class="mb-3">
                      <h6 class="fw-bold mb-2"><i class="bi bi-file-text me-1 text-primary"></i>รายละเอียดหนังสือ</h6>
                      @if (bookDetailModal()!.description) {
                        <p style="line-height:1.7;color:#374151">{{ bookDetailModal()!.description }}</p>
                      } @else {
                        <p class="text-muted fst-italic">ยังไม่มีรายละเอียดหนังสือ</p>
                      }
                    </div>

                    <!-- Chapters -->
                    <div>
                      <h6 class="fw-bold mb-2"><i class="bi bi-list-ol me-1 text-primary"></i>หัวข้อ / บทของหนังสือ</h6>
                      @if (bookDetailModal()!.chapters && bookDetailModal()!.chapters.length > 0) {
                        <ol class="chapters-list">
                          @for (ch of bookDetailModal()!.chapters; track $index) {
                            <li class="chapter-item">{{ ch }}</li>
                          }
                        </ol>
                      } @else {
                        <p class="text-muted fst-italic">ยังไม่มีข้อมูลบท / หัวข้อ</p>
                      }
                    </div>
                  </div>
                  <div class="modal-footer">
                    <button class="btn btn-outline-secondary" (click)="openEditBookModal(bookDetailModal()!); bookDetailModal.set(null)">
                      <i class="bi bi-pencil me-1"></i> แก้ไขข้อมูล
                    </button>
                    <button class="btn btn-secondary" (click)="bookDetailModal.set(null)">ปิด</button>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- ═══ Add/Edit Book Modal ═══ -->
          @if (showBookModal()) {
            <div class="modal-backdrop show" (click)="showBookModal.set(false)"></div>
            <div class="modal show d-block">
              <div class="modal-dialog modal-dialog-centered modal-lg" (click)="$event.stopPropagation()">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title">{{ editingBook() ? 'แก้ไขหนังสือ' : 'เพิ่มหนังสือ' }}</h5>
                    <button class="btn-close" (click)="showBookModal.set(false)"></button>
                  </div>
                  <div class="modal-body">
                    <div class="row g-3">
                      <div class="col-md-6">
                        <label class="form-label">ISBN *</label>
                        <input class="form-control" [(ngModel)]="bookForm.isbn" placeholder="978-x-xxx-xxxxx-x">
                      </div>
                      <div class="col-md-6">
                        <label class="form-label">จำนวนเล่ม</label>
                        <input type="number" class="form-control" [(ngModel)]="bookForm.total_copies" min="1">
                      </div>
                      <div class="col-12">
                        <label class="form-label">ชื่อหนังสือ *</label>
                        <input class="form-control" [(ngModel)]="bookForm.title">
                      </div>
                      <div class="col-12">
                        <label class="form-label">ผู้แต่ง</label>
                        <input class="form-control" [(ngModel)]="bookForm.author">
                      </div>
                      <div class="col-12">
                        <label class="form-label">รายละเอียดหนังสือ <span class="text-muted small">(หนังสืออธิบายเกี่ยวกับอะไร)</span></label>
                        <textarea class="form-control" rows="3" [(ngModel)]="bookForm.description"
                                  placeholder="อธิบายเนื้อหาหรือสาระสำคัญของหนังสือ..."></textarea>
                      </div>
                      <div class="col-12">
                        <label class="form-label">
                          หัวข้อ / บทของหนังสือ
                          <span class="text-muted small">(แต่ละบรรทัด = 1 บท/หัวข้อ)</span>
                        </label>
                        <textarea class="form-control" rows="5" [(ngModel)]="chaptersText"
                                  placeholder="บทที่ 1: บทนำ&#10;บทที่ 2: แนวคิดพื้นฐาน&#10;..."></textarea>
                      </div>
                    </div>
                  </div>
                  <div class="modal-footer">
                    <button class="btn btn-secondary" (click)="showBookModal.set(false)">ยกเลิก</button>
                    <button class="btn btn-primary" (click)="saveBook()">
                      {{ editingBook() ? 'บันทึก' : 'เพิ่มหนังสือ' }}
                    </button>
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
    .clickable-row { cursor:pointer; }
    .clickable-row:hover { background:#f0f4ff; }

    /* Borrow layout */
    .borrow-layout {
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:16px;
      padding-bottom:100px;
    }
    .borrow-section {
      background:#fff; border-radius:16px; padding:20px;
      border:1px solid #e2e8f0; box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .borrow-queue-section {
      grid-column:1/-1;
      background:#fff; border-radius:16px; padding:20px;
      border:1px solid #e2e8f0; box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .queue-empty {
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      min-height:100px; padding:20px;
    }
    .queue-student {
      background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px;
      padding:10px 14px; display:flex; align-items:center;
    }
    .queue-scroll {
      max-height:220px; overflow-y:auto;
      border:1px solid #e2e8f0; border-radius:10px;
    }
    .queue-item {
      padding:10px 14px; border-bottom:1px solid #f1f5f9;
      transition:.15s;
    }
    .queue-item:last-child { border-bottom:none; }
    .queue-item:hover { background:#f8fafc; }
    .queue-num {
      width:24px; height:24px; border-radius:50%;
      background:#3b82f6; color:#fff; font-size:.75rem;
      display:flex; align-items:center; justify-content:center;
      font-weight:700; flex-shrink:0;
    }
    .borrow-confirm-fixed {
      position:fixed; bottom:0; left:0; right:0;
      background:#fff; border-top:1px solid #e2e8f0;
      box-shadow:0 -4px 20px rgba(0,0,0,.08);
      z-index:900; padding:12px 24px;
    }
    .borrow-confirm-inner { max-width:1200px; margin:0 auto; }

    /* Result panels */
    .result-panel { border:1px solid #e2e8f0; border-radius:10px; margin-top:8px; max-height:240px; overflow-y:auto; }
    .result-item { padding:12px 16px; cursor:pointer; border-bottom:1px solid #f1f5f9; transition:.15s; }
    .result-item:last-child { border-bottom:none; }
    .result-item:hover { background:#f8fafc; }
    .result-item.selected { background:#eff6ff; border-left:3px solid #3b82f6; }
    .result-item.unavailable { opacity:.5; cursor:not-allowed; }
    .selected-chip {
      display:flex; align-items:center; gap:8px;
      background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px;
      padding:10px 14px; margin-top:10px;
    }
    .selected-chip strong { flex:1; }
    .btn-clear { background:none; border:none; color:#94a3b8; cursor:pointer; font-size:1rem; padding:0 4px; margin-left:auto; }
    .avatar-xs { width:30px; height:30px; border-radius:50%; background:linear-gradient(135deg,#3b82f6,#6366f1); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:.85rem; flex-shrink:0; }
    .fw-600 { font-weight:600; }
    @media(max-width:768px){ .borrow-layout { grid-template-columns:1fr; } }

    /* Book detail */
    .book-detail-header { display:flex; gap:16px; align-items:flex-start; }
    .book-cover-placeholder {
      width:80px; height:110px; border-radius:8px; flex-shrink:0;
      background:linear-gradient(135deg,#6366f1,#3b82f6);
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-size:2rem;
    }
    .chapters-list { list-style:decimal; padding-left:1.5rem; }
    .chapter-item {
      padding:6px 0; border-bottom:1px solid #f1f5f9; color:#374151;
    }
    .chapter-item:last-child { border-bottom:none; }
  `]
})
export class AdminLibraryComponent implements OnInit {
  tab = signal<'books'|'records'|'borrow'>('books');
  books = signal<any[]>([]);
  bookTotal     = signal(0);
  bookPage      = signal(1);
  bookTotalPages = computed(() => Math.max(1, Math.ceil(this.bookTotal() / 20)));
  bookPages      = computed(() => {
    const t = this.bookTotalPages(), c = this.bookPage();
    const start = Math.max(1, Math.min(c - 2, t - 4));
    return Array.from({ length: Math.min(5, t) }, (_, i) => start + i);
  });
  records = signal<any[]>([]);
  filteredRecords = signal<any[]>([]);
  showBookModal = signal(false);
  editingBook   = signal<any>(null);
  bookDetailModal = signal<any>(null);
  bookSearch = ''; statusFilter = ''; recordSearch = '';
  bookForm: any = { isbn: '', title: '', author: '', total_copies: 1, description: '', chapters: null };
  chaptersText = '';
  private bookSearchTimer: any;

  // borrow queue
  studentQuery = ''; bookQuery = '';
  studentResults = signal<any[]>([]);
  bookResults    = signal<any[]>([]);
  selectedStudent = signal<any>(null);
  borrowQueue     = signal<any[]>([]);
  borrowMsg = signal(''); borrowErr = signal('');
  borrowing = signal(false);
  private stdTimer: any; private bkTimer: any;

  constructor(private api: LibraryApiService, private adminApi: AdminApiService) {}
  ngOnInit() { this.loadBooks(); }

  switchRecords() { this.tab.set('records'); this.loadRecords(); }

  loadBooks() {
    this.api.getBooks(this.bookSearch, this.bookPage()).subscribe((r: any) => {
      this.books.set(r.data?.data ?? []);
      this.bookTotal.set(r.data?.total ?? 0);
    });
  }

  goBookPage(p: number) { this.bookPage.set(p); this.loadBooks(); }

  onBookSearchChange() {
    clearTimeout(this.bookSearchTimer);
    this.bookSearchTimer = setTimeout(() => { this.bookPage.set(1); this.loadBooks(); }, 400);
  }

  loadRecords() {
    // Pass status to backend — now fixed in backend service
    const backendStatus = this.statusFilter === 'Overdue' ? 'Borrowed'
                        : this.statusFilter === 'Late'    ? 'Returned (Late)'
                        : this.statusFilter;
    this.api.getRecords(backendStatus).subscribe(r => {
      const data = r.data ? ((r.data as any).data ?? r.data) : [];
      this.records.set(data);
      this.filterRecords();
    });
  }

  filterRecords() {
    const q = this.recordSearch.toLowerCase();
    const s = this.statusFilter;
    let result = this.records();
    if (s === 'Overdue') {
      result = result.filter(r => r.status === 'Borrowed' && new Date(r.due_date) < new Date());
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

  // ── Book detail ──
  viewBook(b: any) { this.bookDetailModal.set(b); }

  openBookModal() {
    this.editingBook.set(null);
    this.bookForm = { isbn: '', title: '', author: '', total_copies: 1, description: '', chapters: null };
    this.chaptersText = '';
    this.showBookModal.set(true);
  }

  openEditBookModal(b: any) {
    this.editingBook.set(b);
    this.bookForm = { isbn: b.isbn, title: b.title, author: b.author, total_copies: b.total_copies,
                      description: b.description || '', chapters: b.chapters };
    this.chaptersText = (b.chapters && b.chapters.length) ? b.chapters.join('\n') : '';
    this.showBookModal.set(true);
  }

  saveBook() {
    const chapters = this.chaptersText.trim()
      ? this.chaptersText.split('\n').map((c: string) => c.trim()).filter((c: string) => c)
      : null;
    const payload = { ...this.bookForm, chapters };
    const call = this.editingBook()
      ? this.api.updateBook(this.editingBook().book_id, payload)
      : this.api.createBook(payload);
    call.subscribe(() => { this.showBookModal.set(false); this.loadBooks(); });
  }

  deleteBook(id: number) {
    if (confirm('ลบหนังสือ?')) this.api.deleteBook(id).subscribe(() => this.loadBooks());
  }

  returnBook(id: number) { this.api.returnBook(id).subscribe(() => this.loadRecords()); }

  // ── Borrow queue ──
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

  selectStudent(s: any) { this.selectedStudent.set(s); this.studentResults.set([]); this.studentQuery = ''; }

  addToQueue(b: any) {
    const q = this.borrowQueue();
    if (q.some((x: any) => x.book_id === b.book_id)) return; // ไม่เพิ่มซ้ำ
    this.borrowQueue.set([...q, b]);
    this.bookResults.set([]);
    this.bookQuery = '';
  }

  removeFromQueue(index: number) {
    const q = [...this.borrowQueue()];
    q.splice(index, 1);
    this.borrowQueue.set(q);
  }

  borrowAll() {
    const student = this.selectedStudent();
    const queue = this.borrowQueue();
    if (!student || queue.length === 0) { this.borrowErr.set('กรุณาเลือกนักศึกษาและเพิ่มหนังสืออย่างน้อย 1 เล่ม'); return; }
    this.borrowMsg.set(''); this.borrowErr.set('');
    this.borrowing.set(true);

    // ยืมทีละเล่ม (sequential)
    const borrowNext = (idx: number) => {
      if (idx >= queue.length) {
        this.borrowMsg.set(`ยืม ${queue.length} เล่มสำเร็จ`);
        this.borrowQueue.set([]);
        this.selectedStudent.set(null);
        this.borrowing.set(false);
        this.loadBooks();
        setTimeout(() => this.borrowMsg.set(''), 5000);
        return;
      }
      this.api.borrowBook(student.student_id, queue[idx].book_id).subscribe({
        next: () => borrowNext(idx + 1),
        error: (e: any) => {
          this.borrowErr.set(`ยืมหนังสือ "${queue[idx].title}" ไม่สำเร็จ: ${e.error?.message ?? 'เกิดข้อผิดพลาด'}`);
          this.borrowing.set(false);
        }
      });
    };
    borrowNext(0);
  }
}
