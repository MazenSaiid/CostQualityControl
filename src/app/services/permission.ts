import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface RolePermission {
  id: number;
  roleName: string;
  resource: string;
  canView: boolean;
  canWrite: boolean;
  canDelete: boolean;
}

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private http = inject(HttpClient);
  private myPerms = signal<RolePermission[]>([]);
  private allPerms = signal<RolePermission[]>([]);

  getMyPerms() { return this.myPerms; }
  getAllPerms() { return this.allPerms; }

  loadMyPermissions() {
    return this.http.get<RolePermission[]>(`${environment.apiUrl}/permissions/my-permissions`).pipe(
      tap(perms => this.myPerms.set(perms))
    );
  }

  loadAllPermissions() {
    return this.http.get<RolePermission[]>(`${environment.apiUrl}/permissions`).pipe(
      tap(perms => this.allPerms.set(perms))
    );
  }

  canView(resource: string): boolean {
    return this.myPerms().some(p => p.resource === resource && p.canView);
  }

  canWrite(resource: string): boolean {
    return this.myPerms().some(p => p.resource === resource && p.canWrite);
  }

  canDelete(resource: string): boolean {
    return this.myPerms().some(p => p.resource === resource && p.canDelete);
  }

  bulkUpdate(perms: Omit<RolePermission, 'id'>[]) {
    return this.http.put<RolePermission[]>(`${environment.apiUrl}/permissions/bulk`, perms).pipe(
      tap(updated => this.allPerms.set(updated))
    );
  }
}
