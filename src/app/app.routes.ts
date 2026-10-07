import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./auth/login/login').then(m => m.Login) },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then(m => m.Shell),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'products', loadComponent: () => import('./products/product-list/product-list').then(m => m.ProductList) },
      { path: 'ingredients', loadComponent: () => import('./ingredients/ingredient-list/ingredient-list').then(m => m.IngredientList) },
      { path: 'invoices', loadComponent: () => import('./invoices/invoice-list/invoice-list').then(m => m.InvoiceList) },
      { path: 'suppliers', loadComponent: () => import('./suppliers/supplier-list/supplier-list').then(m => m.SupplierList) },
      { path: 'production', loadComponent: () => import('./production/batch-list/batch-list').then(m => m.BatchList) },
      { path: 'reports/cost', loadComponent: () => import('./reports/cost-report/cost-report').then(m => m.CostReport) },
      { path: 'reports/production', loadComponent: () => import('./reports/production-report/production-report').then(m => m.ProductionReport) },
      { path: 'reports/financial', loadComponent: () => import('./reports/financial-report/financial-report').then(m => m.FinancialReport) },
      { path: 'users', loadComponent: () => import('./users/user-list/user-list').then(m => m.UserList) },
      { path: 'permissions', loadComponent: () => import('./permissions/permissions').then(m => m.Permissions) },
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
