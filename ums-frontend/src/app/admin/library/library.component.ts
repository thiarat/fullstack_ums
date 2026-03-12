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
        <app-topbar title="ห้องสมุด" subtitle="ระบบจัดการหนังสือและการยืม-คืน" />
        
        <div class="page-content">

          <div class="d-flex justify-content-center justify-content-md-start mb-4 pt-3 mt-2 stagger-item">
            <div class="modern-tabs">
              <button class="tab-btn" [class.active]="tab() === 'books'" (click)="tab.set('books')">
                <i class="bi bi-journals"></i> คลังหนังสือ
              </button>
              <button class="tab-btn" [class.active]="tab() === 'records'" (click)="switchRecords()">
                <i class="bi bi-list-check"></i> ประวัติยืม-คืน
              </button>
              <button class="tab-btn" [class.active]="tab() === 'borrow'" (click)="tab.set('borrow')">
                <i class="bi bi-bookmark-plus"></i> ทำรายการยืม
              </button>
            </div>
          </div>

          <div class="tab-content-wrapper">
            
            @if (tab() === 'books') {
              <div class="row align-items-center mb-4 stagger-item" style="animation-delay: 0.05s;">
                <div class="col-md-6 col-lg-4 mb-3 mb-md-0">
                  <div class="input-modern-group">
                    <i class="bi bi-search text-muted"></i>
                    <input class="form-control" [(ngModel)]="bookSearch" (ngModelChange)="loadBooks()" placeholder="ค้นหาชื่อหนังสือ, ผู้แต่ง, ISBN...">
                  </div>
                </div>
                <div class="col-md-6 col-lg-8 text-md-end">
                  <button class="btn btn-add-premium shadow-sm" (click)="openBookModal()">
                    <div class="icon-circle"><i class="bi bi-plus-lg"></i></div>
                    <span class="fw-bold">เพิ่มหนังสือใหม่</span>
                  </button>
                </div>
              </div>

              <div class="card premium-card stagger-item" style="animation-delay: 0.1s;">
                <div class="table-responsive">
                  <table class="table custom-table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>ISBN</th>
                        <th>ข้อมูลหนังสือ</th>
                        <th class="text-center">จำนวนทั้งหมด</th>
                        <th class="text-center">คงเหลือ</th>
                        <th class="text-end">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (b of books(); track b.book_id) {
                        <tr class="align-middle">
                          <td><code class="code-badge">{{ b.isbn }}</code></td>
                          <td>
                            <div class="fw-bold text-dark">{{ b.title }}</div>
                            <div class="text-muted small"><i class="bi bi-pen me-1"></i>{{ b.author || 'ไม่ระบุผู้แต่ง' }}</div>
                          </td>
                          <td class="text-center fw-medium">{{ b.total_copies }}</td>
                          <td class="text-center">
                            <span class="badge-soft" [class.bg-success-soft]="b.available_copies > 0" [class.text-success]="b.available_copies > 0" [class.bg-danger-soft]="b.available_copies <= 0" [class.text-danger]="b.available_copies <= 0">
                              {{ b.available_copies > 0 ? b.available_copies + ' เล่ม' : 'ถูกยืมหมดแล้ว' }}
                            </span>
                          </td>
                          <td class="text-end">
                            <button class="action-btn text-danger-hover" (click)="deleteBook(b.book_id)" title="ลบหนังสือ">
                              <i class="bi bi-trash-fill"></i>
                            </button>
                          </td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="5" class="text-center py-5">
                            <div class="empty-state-box border-0">
                              <div class="empty-icon-wrap mb-3 mx-auto"><i class="bi bi-journal-x"></i></div>
                              <h6 class="fw-bold text-dark mb-1">ไม่พบข้อมูลหนังสือ</h6>
                              <p class="text-muted small">ลองเปลี่ยนคำค้นหา หรือเพิ่มหนังสือใหม่เข้าระบบ</p>
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }

            @if (tab() === 'records') {
              <div class="row align-items-center mb-4 stagger-item" style="animation-delay: 0.05s;">
                <div class="col-md-5 col-lg-4 mb-3 mb-md-0">
                  <div class="input-modern-group">
                    <i class="bi bi-search text-muted"></i>
                    <input class="form-control" [(ngModel)]="recordSearch" (ngModelChange)="filterRecords()" placeholder="ค้นหารหัสนักศึกษา, ชื่อหนังสือ...">
                  </div>
                </div>
                <div class="col-md-4 col-lg-3">
                  <div class="input-modern-group">
                    <i class="bi bi-funnel text-muted"></i>
                    <select class="form-control form-select-modern" [(ngModel)]="statusFilter" (ngModelChange)="loadRecords()">
                      <option value="">ทุกสถานะ</option>
                      <option value="Borrowed">กำลังยืม (ยังไม่คืน)</option>
                      <option value="Overdue">เลยกำหนดคืน (Overdue)</option>
                      <option value="Returned">คืนแล้ว (ปกติ)</option>
                      <option value="Late">คืนแล้ว (ล่าช้า)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="card premium-card stagger-item" style="animation-delay: 0.1s;">
                <div class="table-responsive">
                  <table class="table custom-table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>ข้อมูลผู้ยืม</th>
                        <th>หนังสือที่ยืม</th>
                        <th>วันที่ทำรายการ</th>
                        <th class="text-center">ค่าปรับ</th>
                        <th class="text-center">สถานะ</th>
                        <th class="text-end">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (r of filteredRecords(); track r.record_id) {
                        <tr class="align-middle">
                          <td>
                            <div class="fw-bold text-dark" style="font-size: 0.9rem;">{{ r.student_name }}</div>
                            <code class="code-badge mt-1 d-inline-block">{{ r.student_code }}</code>
                          </td>
                          <td style="max-width: 250px;">
                            <div class="text-truncate fw-semibold text-dark" [title]="r.book_title">{{ r.book_title }}</div>
                          </td>
                          <td>
                            <div class="small text-muted mb-1"><span class="fw-medium text-dark">ยืม:</span> {{ r.borrow_date | date:'dd MMM yy' }}</div>
                            <div class="small" [class.text-danger]="r.is_overdue" [class.fw-bold]="r.is_overdue">
                              <i class="bi bi-exclamation-circle-fill me-1" *ngIf="r.is_overdue"></i>
                              <span class="text-muted fw-normal" *ngIf="!r.is_overdue">คืน:</span> {{ r.due_date | date:'dd MMM yy' }}
                            </div>
                          </td>
                          <td class="text-center">
                            @if (r.current_fine > 0) {
                              <span class="fine-badge">฿{{ r.current_fine }}</span>
                            } @else {
                              <span class="text-muted small">-</span>
                            }
                          </td>
                          <td class="text-center">
                            <span class="badge-soft"
                              [class.bg-warning-soft]="r.status === 'Borrowed' && !r.is_overdue" [class.text-warning-dark]="r.status === 'Borrowed' && !r.is_overdue"
                              [class.bg-danger-soft]="r.is_overdue || r.status === 'Returned (Late)'" [class.text-danger]="r.is_overdue || r.status === 'Returned (Late)'"
                              [class.bg-success-soft]="r.status === 'Returned'" [class.text-success]="r.status === 'Returned'">
                              {{ r.status === 'Borrowed' && r.is_overdue ? 'เลยกำหนด' : 
                                 r.status === 'Borrowed' ? 'กำลังยืม' : 
                                 r.status === 'Returned' ? 'คืนแล้ว' : 'คืนล่าช้า' }}
                            </span>
                          </td>
                          <td class="text-end">
                            @if (r.status === 'Borrowed') {
                              <button class="btn btn-sm btn-success-solid shadow-sm" (click)="returnBook(r.record_id)">
                                <i class="bi bi-check2-square me-1"></i> รับคืน
                              </button>
                            } @else {
                              <span class="text-muted small"><i class="bi bi-check-lg me-1"></i>เสร็จสิ้น</span>
                            }
                          </td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="6" class="text-center py-5">
                            <div class="empty-state-box border-0">
                              <div class="empty-icon-wrap mb-3 mx-auto"><i class="bi bi-inbox"></i></div>
                              <p class="text-muted small">ไม่พบรายการยืม-คืนตามเงื่อนไขที่เลือก</p>
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }

            @if (tab() === 'borrow') {
              <div class="borrow-grid-layout stagger-item" style="animation-delay: 0.05s;">
                
                <div class="borrow-panel card-clean">
                  <div class="panel-header text-primary bg-primary-soft">
                    <i class="bi bi-person-badge fs-5"></i>
                    <h6 class="mb-0 fw-bold">1. ค้นหาผู้ยืม (นักศึกษา)</h6>
                  </div>
                  <div class="p-4">
                    <div class="input-modern-group">
                      <i class="bi bi-search text-muted"></i>
                      <input class="form-control" [(ngModel)]="studentQuery" (ngModelChange)="searchStudents()" placeholder="พิมพ์รหัสนักศึกษา หรือชื่อ...">
                    </div>
                    
                    @if (studentResults().length > 0) {
                      <div class="search-dropdown fade-in">
                        @for (s of studentResults(); track s.student_id) {
                          <div class="dropdown-item-user" [class.selected]="selectedStudent()?.student_id === s.student_id" (click)="selectStudent(s)">
                            <div class="avatar-sm">{{ s.first_name?.[0] }}</div>
                            <div class="user-info">
                              <div class="fw-bold text-dark lh-1 mb-1">{{ s.first_name }} {{ s.last_name }}</div>
                              <code class="small text-muted">{{ s.username }}</code>
                            </div>
                            <i class="bi bi-check-circle-fill text-primary ms-auto fs-5" *ngIf="selectedStudent()?.student_id === s.student_id"></i>
                          </div>
                        }
                      </div>
                    }
                    
                    @if (selectedStudent()) {
                      <div class="selected-card bg-primary-soft border-primary mt-3 fade-in">
                        <div class="d-flex align-items-center gap-3">
                          <div class="avatar-md bg-primary text-white"><i class="bi bi-person-check-fill"></i></div>
                          <div class="flex-grow-1">
                            <div class="fw-bold text-dark">{{ selectedStudent()!.first_name }} {{ selectedStudent()!.last_name }}</div>
                            <div class="small text-muted">{{ selectedStudent()!.username }}</div>
                          </div>
                          <button class="btn-close-soft" (click)="selectedStudent.set(null); studentQuery=''"><i class="bi bi-x-lg"></i></button>
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <div class="borrow-panel card-clean">
                  <div class="panel-header text-success bg-success-soft">
                    <i class="bi bi-book-half fs-5"></i>
                    <h6 class="mb-0 fw-bold">2. ค้นหาหนังสือที่ต้องการยืม</h6>
                  </div>
                  <div class="p-4">
                    <div class="input-modern-group">
                      <i class="bi bi-upc-scan text-muted"></i>
                      <input class="form-control border-success-hover" [(ngModel)]="bookQuery" (ngModelChange)="searchBooksBorrow()" placeholder="สแกน ISBN หรือพิมพ์ชื่อหนังสือ...">
                    </div>
                    
                    @if (bookResults().length > 0) {
                      <div class="search-dropdown fade-in">
                        @for (b of bookResults(); track b.book_id) {
                          <div class="dropdown-item-book" 
                               [class.selected]="selectedBook()?.book_id === b.book_id"
                               [class.unavailable]="b.available_copies === 0"
                               (click)="b.available_copies > 0 && selectBook(b)">
                            <div class="book-icon-sm"><i class="bi bi-journal-text"></i></div>
                            <div class="book-info">
                              <div class="fw-bold text-dark lh-1 mb-1 text-truncate" style="max-width: 200px;">{{ b.title }}</div>
                              <div class="small text-muted">{{ b.author || 'ไม่ระบุผู้แต่ง' }}</div>
                            </div>
                            <div class="ms-auto text-end">
                              <span class="badge-soft" [class.bg-success-soft]="b.available_copies > 0" [class.text-success]="b.available_copies > 0" [class.bg-danger-soft]="b.available_copies === 0" [class.text-danger]="b.available_copies === 0">
                                {{ b.available_copies > 0 ? 'ว่าง ' + b.available_copies : 'หมด' }}
                              </span>
                            </div>
                          </div>
                        }
                      </div>
                    }
                    
                    @if (selectedBook()) {
                      <div class="selected-card bg-success-soft border-success mt-3 fade-in">
                        <div class="d-flex align-items-center gap-3">
                          <div class="avatar-md bg-success text-white"><i class="bi bi-bookmark-check-fill"></i></div>
                          <div class="flex-grow-1">
                            <div class="fw-bold text-dark text-truncate" style="max-width: 250px;">{{ selectedBook()!.title }}</div>
                            <div class="small text-success fw-medium">พร้อมให้ยืม (เหลือ {{ selectedBook()!.available_copies }} เล่ม)</div>
                          </div>
                          <button class="btn-close-soft" (click)="selectedBook.set(null); bookQuery=''"><i class="bi bi-x-lg"></i></button>
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <div class="borrow-confirm-panel card-clean p-4 stagger-item" style="animation-delay: 0.15s;">
                  
                  @if (borrowMsg()) {
                    <div class="alert alert-success d-flex align-items-center border-0 fade-in mb-3">
                      <i class="bi bi-check-circle-fill fs-5 me-3"></i> 
                      <div><strong>สำเร็จ!</strong><br><span class="small">{{ borrowMsg() }}</span></div>
                    </div>
                  }
                  @if (borrowErr()) {
                    <div class="alert alert-danger d-flex align-items-center border-0 fade-in mb-3">
                      <i class="bi bi-exclamation-triangle-fill fs-5 me-3"></i> 
                      <div><strong>เกิดข้อผิดพลาด</strong><br><span class="small">{{ borrowErr() }}</span></div>
                    </div>
                  }
                  
                  <button class="btn btn-confirm-borrow w-100" (click)="borrow()" [disabled]="!selectedStudent() || !selectedBook() || saving()">
                    @if(saving()) {
                      <span class="spinner-border spinner-border-sm me-2"></span> กำลังบันทึก...
                    } @else {
                      <i class="bi bi-cart-check-fill me-2 fs-5"></i> ยืนยันการทำรายการยืมหนังสือ
                    }
                  </button>
                  <p class="text-center text-muted small mt-3 mb-0">
                    <i class="bi bi-info-circle me-1"></i> กรุณาเลือกนักศึกษาและหนังสือให้ครบถ้วนก่อนกดปุ่มยืนยัน
                  </p>
                </div>

              </div>
            }

          </div>

          @if (showBookModal()) {
            <div class="modal-backdrop show fade-in" (click)="showBookModal.set(false)"></div>
            <div class="modal show d-block fade-in">
              <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
                <div class="modal-content ultra-clean-modal animate-modal-pop">
                  
                  <div class="modal-header border-0 pb-0 pt-4 px-4">
                    <div class="d-flex align-items-center gap-3">
                      <div class="modal-icon-box bg-primary-soft text-primary">
                        <i class="bi bi-journal-plus"></i>
                      </div>
                      <div>
                        <h4 class="modal-title fw-bold text-dark mb-0">เพิ่มหนังสือใหม่</h4>
                        <p class="text-muted small mb-0 mt-1">เพิ่มข้อมูลหนังสือเข้าสู่ระบบ</p>
                      </div>
                    </div>
                    <button type="button" class="btn-close-round" (click)="showBookModal.set(false)"><i class="bi bi-x-lg"></i></button>
                  </div>
                  
                  <div class="modal-body p-4">
                    <div class="mb-3">
                      <label class="form-label fw-semibold text-dark small mb-2">รหัส ISBN <span class="text-danger">*</span></label>
                      <div class="input-modern-group">
                        <i class="bi bi-upc-scan text-muted"></i>
                        <input class="form-control" [(ngModel)]="bookForm.isbn" placeholder="เช่น 978-616-xxx">
                      </div>
                    </div>
                    <div class="mb-3">
                      <label class="form-label fw-semibold text-dark small mb-2">ชื่อหนังสือ <span class="text-danger">*</span></label>
                      <div class="input-modern-group">
                        <i class="bi bi-book text-muted"></i>
                        <input class="form-control" [(ngModel)]="bookForm.title" placeholder="ชื่อหนังสือ...">
                      </div>
                    </div>
                    <div class="mb-3">
                      <label class="form-label fw-semibold text-dark small mb-2">ผู้แต่ง</label>
                      <div class="input-modern-group">
                        <i class="bi bi-pen text-muted"></i>
                        <input class="form-control" [(ngModel)]="bookForm.author" placeholder="ชื่อผู้แต่ง...">
                      </div>
                    </div>
                    <div class="mb-2">
                      <label class="form-label fw-semibold text-dark small mb-2">จำนวนเล่มทั้งหมด</label>
                      <div class="input-modern-group">
                        <i class="bi bi-123 text-muted"></i>
                        <input type="number" class="form-control" [(ngModel)]="bookForm.total_copies" min="1">
                      </div>
                    </div>
                  </div>
                  
                  <div class="modal-footer border-0 p-4 pt-0 gap-2 flex-nowrap">
                    <button class="btn btn-light btn-cancel flex-grow-1" (click)="showBookModal.set(false)">ยกเลิก</button>
                    <button class="btn btn-submit-solid flex-grow-1" (click)="saveBook()" [disabled]="!bookForm.title || !bookForm.isbn || saving()">
                      <i class="bi bi-cloud-arrow-up-fill me-2" *ngIf="!saving()"></i>
                      <span class="spinner-border spinner-border-sm me-2" *ngIf="saving()"></span>
                      <span>บันทึกข้อมูล</span>
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
    @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');

    .page-content {
      padding: 4rem 2rem 2rem 2rem; /* ดันหลบ Topbar แบบปลอดภัย 100% */
      font-family: 'Prompt', sans-serif;
      background-color: #f4f7f9; 
      min-height: calc(100vh - 70px);
      position: relative;
      z-index: 1;
    }

    /* 💎 Segmented Control Tabs (Modern iOS Style) */
    .modern-tabs {
      display: inline-flex; background: #ffffff; padding: 0.35rem; 
      border-radius: 14px; border: 1px solid #e2e8f0;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }
    .tab-btn {
      border: none; background: transparent; color: #64748b; font-weight: 600;
      padding: 0.6rem 1.4rem; border-radius: 10px; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      font-size: 0.95rem; display: flex; align-items: center; gap: 0.5rem;
    }
    .tab-btn:hover { color: #3b82f6; }
    .tab-btn.active { 
      background: #eff6ff; color: #2563eb; 
      box-shadow: 0 2px 6px rgba(37,99,235,0.15);
    }

    /* 💎 Premium Add Button */
    .btn-add-premium {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 0.4rem 1.4rem 0.4rem 0.5rem; border-radius: 50px; 
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      border: none; color: #ffffff !important;
      white-space: nowrap !important; min-width: 160px;
      transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
      box-shadow: 0 4px 12px rgba(37,99,235,0.25);
    }
    .btn-add-premium .icon-circle {
      width: 34px; height: 34px; border-radius: 50%; margin-right: 0.6rem;
      background: rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem;
    }
    .btn-add-premium:hover:not(:disabled) { 
      transform: translateY(-2px); box-shadow: 0 8px 20px rgba(37,99,235,0.4);
    }

    /* Toolbar Inputs */
    .input-modern-group { position: relative; }
    .input-modern-group > i { position: absolute; left: 1.2rem; top: 50%; transform: translateY(-50%); font-size: 1.1rem; pointer-events: none; color: #94a3b8; transition: 0.3s;}
    .input-modern-group .form-control, .input-modern-group .form-select { 
      padding-left: 3rem; height: 48px; border-radius: 12px; background-color: #ffffff; 
      border: 1px solid #cbd5e1; font-size: 0.95rem; color: #1e293b; 
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }
    .input-modern-group .form-control:focus, .input-modern-group .form-select:focus { 
      border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59,130,246,0.1); outline: none;
    }
    .input-modern-group .form-control:focus ~ i { color: #3b82f6 !important; }
    .form-select-modern { cursor: pointer; }
    .border-success-hover:focus { border-color: #10b981 !important; box-shadow: 0 0 0 4px rgba(16,185,129,0.1) !important; }
    .border-success-hover:focus ~ i { color: #10b981 !important; }

    /* 💎 Premium Table Card */
    .premium-card {
      background: #ffffff; border-radius: 20px; border: 1px solid rgba(226, 232, 240, 0.8);
      box-shadow: 0 4px 15px rgba(0,0,0,0.02); overflow: hidden;
    }
    .custom-table th { 
      font-weight: 600; color: #475569; font-size: 0.85rem; border-bottom: 2px solid #e2e8f0; 
      padding: 1.2rem 1.5rem; background: #f8fafc; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .custom-table td { padding: 1rem 1.5rem; vertical-align: middle; border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease-out; }
    .custom-table tbody tr:hover td { background-color: #f8fafc; }

    /* Badges */
    .code-badge { background: #f1f5f9; color: #0f172a; padding: 0.3rem 0.6rem; border-radius: 8px; font-size: 0.85rem; border: 1px solid #e2e8f0; font-weight: 600; letter-spacing: 0.5px;}
    .badge-soft { padding: 0.35rem 0.8rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center;}
    .fine-badge { background: #fee2e2; color: #b91c1c; padding: 0.3rem 0.7rem; border-radius: 8px; font-size: 0.85rem; font-weight: 700; border: 1px solid #fecaca;}
    
    .bg-primary-soft { background: #eff6ff; }
    .bg-success-soft { background: #ecfdf5; }
    .bg-danger-soft { background: #fef2f2; }
    .bg-warning-soft { background: #fffbeb; }
    .text-warning-dark { color: #d97706; }

    /* Action Buttons (Soft) */
    .action-btn { width: 36px; height: 36px; border-radius: 10px; border: none; display: inline-flex; align-items: center; justify-content: center; background: transparent; color: #94a3b8; transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1); }
    .action-btn:hover { background: #f1f5f9; transform: scale(1.1); }
    .action-btn.text-danger-hover:hover { background: #fef2f2; color: #ef4444; }

    .btn-success-solid { background: #10b981; color: white; border: none; border-radius: 8px; padding: 0.4rem 0.8rem; font-weight: 600; transition: 0.2s ease-out; }
    .btn-success-solid:hover { background: #059669; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(16,185,129,0.25); }

    /* Empty States */
    .empty-state-box { text-align: center; padding: 4rem 1rem; background: transparent; }
    .empty-icon-wrap { width: 80px; height: 80px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; color: #cbd5e1; }

    /* 💎 Borrow Layout (POS Style) */
    .borrow-grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .card-clean { background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 15px rgba(0,0,0,0.02); overflow: hidden; }
    .panel-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; align-items: center; gap: 0.75rem; }
    .borrow-confirm-panel { grid-column: 1 / -1; background: #ffffff; border: 2px dashed #cbd5e1; }

    /* Search Dropdowns & Chips */
    .search-dropdown { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; margin-top: 10px; max-height: 250px; overflow-y: auto; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
    .dropdown-item-user, .dropdown-item-book { padding: 12px 16px; cursor: pointer; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease-out; }
    .dropdown-item-user:hover, .dropdown-item-book:hover { background: #f8fafc; }
    .dropdown-item-user.selected, .dropdown-item-book.selected { background: #eff6ff; }
    .dropdown-item-book.unavailable { opacity: 0.5; cursor: not-allowed; background: #f8fafc; }
    
    .avatar-sm { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; }
    .book-icon-sm { width: 36px; height: 36px; border-radius: 10px; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
    
    .selected-card { padding: 1rem; border-radius: 16px; border: 1px solid transparent; }
    .border-primary { border-color: #bfdbfe !important; }
    .border-success { border-color: #bbf7d0 !important; }
    .avatar-md { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; }
    .btn-close-soft { background: #ffffff; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #64748b; transition: 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
    .btn-close-soft:hover { transform: scale(1.1); color: #ef4444; }

    /* Big Confirm Button */
    .btn-confirm-borrow {
      height: 60px; border-radius: 16px; font-weight: 700; font-size: 1.1rem; border: none;
      background: linear-gradient(135deg, #3b82f6, #6366f1); color: white;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      box-shadow: 0 8px 20px rgba(99,102,241,0.3);
    }
    .btn-confirm-borrow:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 12px 25px rgba(99,102,241,0.4); }
    .btn-confirm-borrow:disabled { background: #cbd5e1; box-shadow: none; opacity: 0.6; cursor: not-allowed; }

    /* 💎 Premium Modals (No Blur) */
    .modal-backdrop { background: rgba(15, 23, 42, 0.6); } 
    .ultra-clean-modal { background: #ffffff; border-radius: 24px; border: none; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3); will-change: transform, opacity; }
    .modal-icon-box { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; }
    
    .btn-close-round { background: #f1f5f9; border: none; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #64748b; transition: 0.2s ease-out; }
    .btn-close-round:hover { background: #e2e8f0; color: #0f172a; transform: rotate(90deg); }
    
    .btn-cancel { height: 48px; border-radius: 12px; font-weight: 500; background: #f1f5f9; color: #475569; border: none; transition: 0.2s ease-out;}
    .btn-cancel:hover { background: #e2e8f0; color: #0f172a; }
    
    .btn-submit-solid { height: 48px; border-radius: 12px; font-weight: 600; background: #2563eb; color: white; border: none; transition: 0.2s ease-out; }
    .btn-submit-solid:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(37,99,235,0.2);}

    /* Scrollbar */
    .search-dropdown::-webkit-scrollbar { width: 6px; }
    .search-dropdown::-webkit-scrollbar-track { background: transparent; }
    .search-dropdown::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

    /* Hardware Accelerated Animations */
    @keyframes fadeSlideUp { 
      from { opacity: 0; transform: translateY(15px); } 
      to { opacity: 1; transform: translateY(0); } 
    }
    .stagger-item { 
      animation: fadeSlideUp 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; 
      opacity: 0; will-change: transform, opacity;
    }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .fade-in { animation: fadeIn 0.25s ease-in forwards; will-change: opacity; }

    @keyframes modalPop { 
      0% { opacity: 0; transform: scale(0.95) translateY(10px); } 
      100% { opacity: 1; transform: scale(1) translateY(0); } 
    }
    .animate-modal-pop { animation: modalPop 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; will-change: transform, opacity; }

    @media(max-width: 768px) { .borrow-grid-layout { grid-template-columns: 1fr; } }
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
  saving = signal(false); // เพิ่ม State สำหรับโหลดตอนบันทึก

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
    const now = new Date();
    
    if (s) {
      result = result.filter(r => {
        if (s === 'Borrowed') return r.status === 'Borrowed';
        if (s === 'Returned') return r.status === 'Returned';
        if (s === 'Late') return r.status === 'Returned (Late)';
        if (s === 'Overdue') return r.status === 'Borrowed' && new Date(r.due_date) < now;
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

    const finalResult = result.map(r => ({
      ...r,
      is_overdue: r.status === 'Borrowed' && new Date(r.due_date) < now
    }));

    this.filteredRecords.set(finalResult);
  }

  openBookModal() { this.bookForm = { isbn: '', title: '', author: '', total_copies: 1 }; this.showBookModal.set(true); }
  
  saveBook() { 
    this.saving.set(true);
    this.api.createBook(this.bookForm).subscribe({
      next: () => { this.showBookModal.set(false); this.saving.set(false); this.loadBooks(); },
      error: () => { this.saving.set(false); alert('เกิดข้อผิดพลาดในการบันทึก'); }
    }); 
  }
  
  deleteBook(id: number) { 
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบหนังสือเล่มนี้ออกจากระบบ?')) {
      this.api.deleteBook(id).subscribe(() => this.loadBooks()); 
    }
  }
  
  returnBook(id: number) { 
    if (confirm('ยืนยันการรับคืนหนังสือ?')) {
      this.api.returnBook(id).subscribe(() => this.loadRecords()); 
    }
  }

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
    
    this.saving.set(true);
    this.api.borrowBook(this.selectedStudent().student_id, this.selectedBook().book_id).subscribe({
      next: (r: any) => {
        this.borrowMsg.set(r.message ?? 'ทำรายการยืมหนังสือสำเร็จ!');
        this.selectedStudent.set(null); this.selectedBook.set(null);
        this.studentQuery = ''; this.bookQuery = '';
        this.saving.set(false);
        setTimeout(() => this.borrowMsg.set(''), 5000);
        this.loadBooks();
      },
      error: (e: any) => {
        this.borrowErr.set(e.error?.message ?? 'เกิดข้อผิดพลาดในการยืมหนังสือ');
        this.saving.set(false);
      }
    });
  }
}