import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth';

function passwordsMatch(control: AbstractControl) {
  const parent = control.parent;
  if (!parent) return null;
  return parent.get('newPassword')?.value === control.value ? null : { mismatch: true };
}

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './change-password-dialog.html',
  styleUrl: './change-password-dialog.scss'
})
export class ChangePasswordDialog {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private snack = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<ChangePasswordDialog>);

  loading = false;
  showCurrent = false;
  showNew = false;
  showConfirm = false;

  form = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, passwordsMatch]]
  });

  get currentPassword() { return this.form.get('currentPassword')!; }
  get newPassword() { return this.form.get('newPassword')!; }
  get confirmPassword() { return this.form.get('confirmPassword')!; }

  onNewPasswordChange() {
    this.confirmPassword.updateValueAndValidity();
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    const { currentPassword, newPassword, confirmPassword } = this.form.value;
    this.auth.changePassword(currentPassword!, newPassword!, confirmPassword!).subscribe({
      next: () => {
        this.loading = false;
        this.snack.open('Password changed successfully.', 'OK', { duration: 3000, panelClass: ['snack-success'] });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.message ?? 'Failed to change password.';
        this.snack.open(msg, 'Close', { duration: 5000, panelClass: ['snack-error'] });
      }
    });
  }
}
