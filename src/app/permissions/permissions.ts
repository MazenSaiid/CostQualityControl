import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';
import { PermissionService, RolePermission } from '../services/permission';

const RESOURCES = ['Products', 'Ingredients', 'Invoices', 'Production', 'Reports', 'Users', 'Permissions'];
const ROLES = ['Admin', 'Manager', 'ProductionOperator', 'QualityInspector', 'Viewer'];

interface PermRow {
  resource: string;
  canView: boolean;
  canWrite: boolean;
  canDelete: boolean;
}

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatCheckboxModule, MatButtonModule,
            MatSnackBarModule, MatSelectModule, MatFormFieldModule, MatIconModule, MatProgressBarModule, FormsModule],
  templateUrl: './permissions.html',
  styleUrl: './permissions.scss'
})
export class Permissions implements OnInit {
  private svc = inject(PermissionService);
  private snack = inject(MatSnackBar);

  roles = ROLES;
  resources = RESOURCES;
  selectedRoleValue = 'Manager';
  selectedRole = signal<string>('Manager');
  loading = signal(false);
  saving = signal(false);

  rows = signal<PermRow[]>([]);
  columns = ['resource', 'canView', 'canWrite', 'canDelete'];

  ngOnInit() {
    this.svc.loadAllPermissions().subscribe(() => this.loadRoleRows());
  }

  loadRoleRows() {
    const role = this.selectedRole();
    const all = this.svc.getAllPerms()();
    this.rows.set(RESOURCES.map(resource => {
      const existing = all.find(p => p.roleName === role && p.resource === resource);
      return {
        resource,
        canView: existing?.canView ?? false,
        canWrite: existing?.canWrite ?? false,
        canDelete: existing?.canDelete ?? false,
      };
    }));
  }

  onRoleChange(role: string) {
    this.selectedRole.set(role);
    this.loadRoleRows();
  }

  onViewChange(row: PermRow) {
    if (!row.canView) { row.canWrite = false; row.canDelete = false; }
  }

  onWriteChange(row: PermRow) {
    if (!row.canWrite) { row.canDelete = false; }
    else if (!row.canView) { row.canView = true; }
  }

  onDeleteChange(row: PermRow) {
    if (row.canDelete && !row.canWrite) { row.canWrite = true; row.canView = true; }
  }

  save() {
    this.saving.set(true);
    const role = this.selectedRole();
    const payload = this.rows().map(r => ({
      roleName: role,
      resource: r.resource,
      canView: r.canView,
      canWrite: r.canWrite,
      canDelete: r.canDelete,
    }));
    this.svc.bulkUpdate(payload).subscribe({
      next: () => { this.saving.set(false); this.snack.open('Permissions saved', 'OK', { duration: 2500 }); },
      error: () => { this.saving.set(false); this.snack.open('Failed to save', 'Close', { duration: 3000 }); }
    });
  }
}
