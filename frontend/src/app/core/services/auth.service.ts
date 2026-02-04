import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, of, catchError } from 'rxjs';
import { ApiService } from './api.service';
import { User, LoginRequest, LoginResponse, RegisterRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  private userSignal = signal<User | null>(this.loadUserFromStorage());

  user = this.userSignal.asReadonly();
  currentUser = this.userSignal.asReadonly();
  isAuthenticated = computed(() => !!this.userSignal());
  isAdmin = computed(() => {
    const user = this.userSignal();
    return user?.roles?.includes('ROLE_ADMIN') ?? false;
  });
  isSuperAdmin = computed(() => {
    const user = this.userSignal();
    return user?.roles?.includes('ROLE_SUPERADMIN') ?? false;
  });

  refreshUser(): void {
    this.loadCurrentUser().subscribe();
  }

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('/auth/login', credentials).pipe(
      tap(response => {
        this.setToken(response.token);
        this.loadCurrentUser().subscribe();
      })
    );
  }

  register(data: RegisterRequest): Observable<{ message: string; id: number }> {
    return this.api.post('/auth/register', data);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.userSignal.set(null);
    this.router.navigate(['/login']);
  }

  loadCurrentUser(): Observable<User | null> {
    if (!this.getToken()) {
      return of(null);
    }

    return this.api.get<User>('/auth/me').pipe(
      tap(user => {
        this.userSignal.set(user);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      }),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.api.post('/auth/forgot-password', { email });
  }

  resetPassword(token: string, password: string): Observable<{ message: string }> {
    return this.api.post('/auth/reset-password', { token, password });
  }

  verifyEmail(token: string): Observable<{ message: string }> {
    return this.api.get(`/auth/verify-email/${token}`);
  }

  updateProfile(data: Partial<User>): Observable<{ message: string }> {
    return this.api.put('/auth/update-profile', data);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.api.post('/auth/change-password', { currentPassword, newPassword });
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private loadUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch {
        return null;
      }
    }
    return null;
  }
}
