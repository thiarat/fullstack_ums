import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class LibraryApiService extends ApiService {
  constructor(http: HttpClient) { super(http); }

  getBooks(search = '', page = 1, limit = 100) { return this.get<any>('/library/books', { search, page, limit }); }
  createBook(body: any)              { return this.post('/library/books', body); }
  updateBook(id: number, body: any)  { return this.put(`/library/books/${id}`, body); }
  deleteBook(id: number)             { return this.delete(`/library/books/${id}`); }
  borrowBook(student_id: number, book_id: number) { return this.post('/library/borrow', { student_id, book_id }); }
  returnBook(recordId: number)       { return this.patch(`/library/return/${recordId}`); }
  getRecords(status = '', page = 1)  { return this.get<any>('/library/records', { status, page }); }
  getSettings()                      { return this.get<any>('/library/settings'); }
  updateSettings(body: any)          { return this.put('/library/settings', body); }
}
