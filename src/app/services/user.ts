import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AppUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  fullName: string;
  password: string;
  role: string;
}

export interface UpdateUserRequest {
  fullName: string;
  email: string;
  password?: string;
  role: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private _users = signal<AppUser[]>([]);

  getAll() { return this._users; }

  load() {
    return this.http.get<AppUser[]>(`${environment.apiUrl}/users`).pipe(
      tap(data => this._users.set(data))
    );
  }

  create(req: CreateUserRequest) {
    return this.http.post<AppUser>(`${environment.apiUrl}/auth/register`, req).pipe(
      tap(created => this._users.update(list => [...list, created]))
    );
  }

  update(id: string, req: UpdateUserRequest) {
    return this.http.put<AppUser>(`${environment.apiUrl}/users/${id}`, req).pipe(
      tap(updated => this._users.update(list => list.map(u => u.id === id ? updated : u)))
    );
  }

  deactivate(id: string) {
    return this.http.delete(`${environment.apiUrl}/users/${id}`).pipe(
      tap(() => this._users.update(list => list.map(u => u.id === id ? { ...u, isActive: false } : u)))
    );
  }
}
