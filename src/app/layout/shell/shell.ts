import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Header } from '../header/header';
import { PermissionService } from '../../services/permission';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, Sidebar, Header],
  templateUrl: './shell.html',
  styleUrl: './shell.scss'
})
export class Shell implements OnInit {
  private permSvc = inject(PermissionService);
  sidebarCollapsed = signal(false);
  mobileOpen = signal(false);
  isMobile = signal(false);

  ngOnInit() {
    this.checkMobile();
    this.permSvc.loadMyPermissions().subscribe();
    window.addEventListener('resize', () => this.checkMobile());
  }

  checkMobile() {
    this.isMobile.set(window.innerWidth <= 768);
    if (this.isMobile()) this.sidebarCollapsed.set(false);
  }

  toggleSidebar() {
    if (this.isMobile()) {
      this.mobileOpen.update(v => !v);
    } else {
      this.sidebarCollapsed.update(v => !v);
    }
  }

  closeMobileSidebar() { this.mobileOpen.set(false); }
}
