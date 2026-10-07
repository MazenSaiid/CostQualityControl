import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { User } from '../models';
import { environment } from '../../environments/environment';

interface AuthResponse { token: string; username: string; fullName: string; role: string; expires: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private currentUser = signal<User | null>(null);

  constructor() {
    const stored = localStorage.getItem('user');
    if (stored) { try { this.currentUser.set(JSON.parse(stored)); } catch {} }
  }

  login(username: string, password: string) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { username, password }).pipe(
      tap(res => {
        const user: User = { id: 0, username: res.username, email: '', role: res.role, token: res.token };
        this.currentUser.set(user);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', res.token);
      })
    );
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  changePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
    return this.http.post(`${environment.apiUrl}/auth/change-password`, {
      currentPassword, newPassword, confirmPassword
    });
  }

  isLoggedIn(): boolean { return !!this.currentUser() || !!localStorage.getItem('token'); }
  getUser(): User | null { return this.currentUser(); }
}
