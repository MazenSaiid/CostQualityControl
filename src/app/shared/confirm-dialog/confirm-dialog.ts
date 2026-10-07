import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  confirmColor?: 'primary' | 'warn' | 'accent';
  icon?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './confirm-dialog.html',
  styles: [`
    .confirm-dialog { padding: 8px; min-width: 340px; max-width: 420px; }
    .confirm-icon { display: flex; justify-content: center; margin-bottom: 8px; }
    .confirm-icon mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .confirm-icon.warn mat-icon { color: #f57c00; }
    .confirm-icon.primary mat-icon { color: #1565c0; }
    h2[mat-dialog-title] { text-align: center; margin: 0 0 4px; font-size: 1.1rem; }
    mat-dialog-content p { text-align: center; color: #546e7a; margin: 0; }
    mat-dialog-actions { padding: 16px 0 0 !important; gap: 8px; }
  `]
})
export class ConfirmDialog {
  data: ConfirmDialogData = inject(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<ConfirmDialog>);
}
