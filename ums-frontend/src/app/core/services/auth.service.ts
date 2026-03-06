import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthUser, AuthResponse, ApiResponse, LoginRequest } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'ums_token';
  private readonly REFRESH_KEY = 'ums_refresh';
  private readonly USER_KEY = 'ums_user';

  private _user = signal<AuthUser | null>(this.loadUser());

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly role = computed(() => this._user()?.role ?? null);
  readonly isAdmin = computed(() => this._user()?.role === 'Admin');
  readonly isProfessor = computed(() => this._user()?.role === 'Professor');
  readonly isStudent = computed(() => this._user()?.role === 'Student');

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: LoginRequest) {
    return this.http.post<ApiResponse<AuthResponse>>(
      `${environment.apiUrl}/auth/login`, credentials
    ).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.saveSession(res.data);
        }
      }),
      catchError(err => throwError(() => err.error?.message || 'Login failed'))
    );
  }

  logout() {
    this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe();
    this.clearSession();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return throwError(() => 'No refresh token');

    return this.http.post<ApiResponse<{ accessToken: string }>>(
      `${environment.apiUrl}/auth/refresh`, { refreshToken }
    ).pipe(
      tap(res => {
        if (res.success && res.data) {
          localStorage.setItem(this.TOKEN_KEY, res.data.accessToken);
        }
      })
    );
  }

  getHomePath(): string {
    const role = this._user()?.role;
    if (role === 'Admin') return '/admin/dashboard';
    if (role === 'Professor') return '/professor/dashboard';
    if (role === 'Student') return '/student/dashboard';
    return '/login';
  }

  private saveSession(data: AuthResponse) {
    localStorage.setItem(this.TOKEN_KEY, data.accessToken);
    localStorage.setItem(this.REFRESH_KEY, data.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
    this._user.set(data.user);
  }

  private clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._user.set(null);
  }

  private loadUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}
