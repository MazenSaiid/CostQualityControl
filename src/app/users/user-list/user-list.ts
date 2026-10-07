import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { UserService, AppUser } from '../../services/user';
import { PermissionService } from '../../services/permission';
import { ConfirmDialog, ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog';

const ROLES = ['Admin', 'Manager', 'ProductionOperator', 'QualityInspector', 'Viewer'];

const ROLE_COLORS: Record<string, string> = {
  Admin: '#d32f2f',
  Manager: '#1976d2',
  ProductionOperator: '#388e3c',
  QualityInspector: '#f57c00',
  Viewer: '#616161',
};

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDialogModule, MatSnackBarModule, MatChipsModule,
    MatTooltipModule, MatBadgeModule, MatSlideToggleModule, MatProgressBarModule
  ],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss'
})
export class UserList implements OnInit {
  private svc = inject(UserService);
  permSvc = inject(PermissionService);
  private snack = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  showPassword = false;

  roles = ROLES;
  roleColors = ROLE_COLORS;
  columns = ['avatar', 'username', 'fullName', 'email', 'role', 'status', 'createdAt', 'actions'];

  users = this.svc.getAll();
  loading = signal(false);
  saving = signal(false);

  showForm = signal(false);
  editingUser = signal<AppUser | null>(null);

  form = this.fb.group({
    username: ['', Validators.required],
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    role: ['Viewer', Validators.required],
    isActive: [true]
  });

  activeCount = computed(() => this.users().filter(u => u.isActive).length);
  totalCount = computed(() => this.users().length);

  ngOnInit() {
    this.loading.set(true);
    this.svc.load().subscribe({ next: () => this.loading.set(false), error: () => this.loading.set(false) });
  }

  openCreate() {
    this.editingUser.set(null);
    this.form.reset({ role: 'Viewer', isActive: true });
    this.form.get('username')!.enable();
    this.form.get('password')!.setValidators([Validators.required, Validators.minLength(8)]);
    this.form.get('password')!.updateValueAndValidity();
    this.showPassword = false;
    this.showForm.set(true);
  }

  openEdit(user: AppUser) {
    this.editingUser.set(user);
    this.form.patchValue({ fullName: user.fullName, email: user.email, role: user.role, isActive: user.isActive, password: '', username: user.username });
    this.form.get('username')!.disable();
    this.form.get('password')!.clearValidators();
    this.form.get('password')!.updateValueAndValidity();
    this.showPassword = false;
    this.showForm.set(true);
  }

  cancel() { this.showForm.set(false); this.editingUser.set(null); }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    const editing = this.editingUser();

    if (editing) {
      const req: any = { fullName: v.fullName, email: v.email, role: v.role, isActive: v.isActive };
      if (v.password) req.password = v.password;
      this.svc.update(editing.id, req).subscribe({
        next: () => { this.saving.set(false); this.showForm.set(false); this.snack.open('User updated', 'OK', { duration: 2500 }); },
        error: () => { this.saving.set(false); this.snack.open('Failed to update user', 'Close', { duration: 3000 }); }
      });
    } else {
      this.svc.create({ username: v.username!, email: v.email!, fullName: v.fullName!, password: v.password!, role: v.role! }).subscribe({
        next: () => { this.saving.set(false); this.showForm.set(false); this.snack.open('User created', 'OK', { duration: 2500 }); },
        error: (err) => { this.saving.set(false); this.snack.open(err?.error?.[0]?.description || 'Failed to create user', 'Close', { duration: 4000 }); }
      });
    }
  }

  deactivate(user: AppUser) {
    const ref = this.dialog.open(ConfirmDialog, {
      width: '420px',
      data: {
        title: 'Deactivate User',
        message: `Are you sure you want to deactivate "${user.fullName || user.username}"? They will no longer be able to log in.`,
        confirmLabel: 'Deactivate',
        confirmColor: 'warn',
        icon: 'person_off',
      } as ConfirmDialogData,
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.svc.deactivate(user.id).subscribe({
          next: () => this.snack.open('User deactivated', 'OK', { duration: 2500 }),
          error: () => this.snack.open('Failed to deactivate', 'Close', { duration: 3000 })
        });
      }
    });
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  roleColor(role: string): string {
    return this.roleColors[role] || '#616161';
  }
}
