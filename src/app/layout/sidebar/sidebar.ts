import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { PermissionService } from '../../services/permission';

interface NavItem { label: string; icon: string; route: string; resource: string | null; }

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {
  @Input() collapsed = false;
  @Output() navClick = new EventEmitter<void>();
  permSvc = inject(PermissionService);

  navItems: NavItem[] = [
    { route: '/dashboard', icon: 'dashboard', label: 'Dashboard', resource: null },
    { route: '/products', icon: 'inventory_2', label: 'Products', resource: 'Products' },
    { route: '/ingredients', icon: 'science', label: 'Ingredients', resource: 'Ingredients' },
    { route: '/invoices', icon: 'receipt_long', label: 'Invoices', resource: 'Invoices' },
    { route: '/suppliers', icon: 'business', label: 'Suppliers', resource: null },
    { route: '/production', icon: 'precision_manufacturing', label: 'Production', resource: 'Production' },
    { route: '/reports/cost', icon: 'bar_chart', label: 'Cost Report', resource: 'Reports' },
    { route: '/reports/production', icon: 'show_chart', label: 'Production Report', resource: 'Reports' },
    { route: '/reports/financial', icon: 'account_balance', label: 'Financial Report', resource: 'Reports' },
    { route: '/users', icon: 'group', label: 'Users', resource: 'Users' },
    { route: '/permissions', icon: 'admin_panel_settings', label: 'Permissions', resource: 'Permissions' },
  ];
}
