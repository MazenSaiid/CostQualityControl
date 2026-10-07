import { Component, EventEmitter, Output, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../services/auth';
import { ChangePasswordDialog } from '../../auth/change-password/change-password-dialog';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatToolbarModule, MatIconModule, MatButtonModule, MatMenuModule, MatDividerModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  @Output() toggleSidebar = new EventEmitter<void>();
  auth = inject(AuthService);
  private dialog = inject(MatDialog);

  logout(): void {
    this.auth.logout();
  }

  openChangePassword() {
    this.dialog.open(ChangePasswordDialog, { width: '460px', disableClose: true });
  }
}
