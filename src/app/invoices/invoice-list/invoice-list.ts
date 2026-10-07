import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { InvoiceService } from '../../services/invoice';
import { IngredientService } from '../../services/ingredient';
import { SupplierService } from '../../services/supplier';
import { PermissionService } from '../../services/permission';
import { Invoice } from '../../models';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import { PaymentDialog, PaymentDialogData } from '../payment-dialog/payment-dialog';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatCardModule, MatTableModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatSnackBarModule, MatTooltipModule,
    MatDialogModule, ConfirmDialog, PaymentDialog],
  templateUrl: './invoice-list.html',
  styleUrl: './invoice-list.scss'
})
export class InvoiceList implements OnInit {
  private svc = inject(InvoiceService);
  private ingredientSvc = inject(IngredientService);
  private supplierSvc = inject(SupplierService);
  permSvc = inject(PermissionService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  displayedColumns = ['invoiceNumber', 'supplierName', 'date', 'items', 'totalAmount', 'totalPaid', 'totalDue', 'status', 'actions'];
  expandedInvoice: Invoice | null = null;
  showForm = false;
  form: FormGroup = this.buildForm();

  invoices = this.svc.getAll();
  ingredients = this.ingredientSvc.getAll();
  suppliers = this.supplierSvc.getAll();

  filterSupplier = signal<string>('all');
  filterStatus = signal<string>('all');
  filterSearch = signal<string>('');
  filterDateFrom = signal<string>('');
  filterDateTo = signal<string>('');
  maxDate = new Date();

  paymentStatus(inv: Invoice): 'PAID' | 'PARTIAL' | 'OPEN' {
    if (inv.isPaid || inv.totalDue <= 0) return 'PAID';
    if (inv.totalPaid > 0) return 'PARTIAL';
    return 'OPEN';
  }

  filteredInvoices = computed(() => {
    let result = this.invoices();
    if (this.filterSupplier() !== 'all') result = result.filter(i => i.supplierName === this.filterSupplier());
    if (this.filterStatus() === 'paid') result = result.filter(i => i.isPaid || i.totalDue <= 0);
    if (this.filterStatus() === 'partial') result = result.filter(i => !i.isPaid && i.totalPaid > 0 && i.totalDue > 0);
    if (this.filterStatus() === 'open') result = result.filter(i => !i.isPaid && i.totalPaid === 0);
    if (this.filterSearch()) {
      const q = this.filterSearch().toLowerCase();
      result = result.filter(i => i.invoiceNumber.toLowerCase().includes(q) || i.supplierName.toLowerCase().includes(q));
    }
    if (this.filterDateFrom()) {
      const from = new Date(this.filterDateFrom());
      result = result.filter(i => new Date(i.date) >= from);
    }
    if (this.filterDateTo()) {
      const to = new Date(this.filterDateTo());
      to.setHours(23, 59, 59, 999);
      result = result.filter(i => new Date(i.date) <= to);
    }
    return result;
  });

  hasActiveFilters = computed(() =>
    this.filterSupplier() !== 'all' || this.filterStatus() !== 'all' ||
    !!this.filterSearch() || !!this.filterDateFrom() || !!this.filterDateTo()
  );

  totalFiltered = computed(() => this.filteredInvoices().reduce((s, i) => s + i.totalAmount, 0));
  totalPaid = computed(() => this.filteredInvoices().reduce((s, i) => s + i.totalPaid, 0));
  totalOwed = computed(() => this.filteredInvoices().reduce((s, i) => s + i.totalDue, 0));

  uniqueSuppliers = computed(() => [...new Set(this.invoices().map(i => i.supplierName))].sort());

  clearFilters(): void {
    this.filterSupplier.set('all');
    this.filterStatus.set('all');
    this.filterSearch.set('');
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
  }

  toDate(s: string): Date | null { return s ? new Date(s) : null; }
  toIso(d: Date | null): string { return d ? d.toISOString().split('T')[0] : ''; }

  ngOnInit() {
    this.svc.load().subscribe();
    this.ingredientSvc.load().subscribe();
    this.supplierSvc.load().subscribe();
  }

  buildForm(): FormGroup {
    return this.fb.group({
      invoiceNumber: ['', Validators.required],
      supplierId: [null, Validators.required],
      date: [new Date(), Validators.required],
      items: this.fb.array([])
    });
  }

  get itemControls() { return (this.form.get('items') as FormArray).controls; }

  addItem(): void {
    (this.form.get('items') as FormArray).push(this.fb.group({
      ingredientId: ['', Validators.required],
      weight: [1, [Validators.required, Validators.min(0.001)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]]
    }));
  }

  removeItem(i: number): void { (this.form.get('items') as FormArray).removeAt(i); }

  getItemTotal(ctrl: any): number {
    return (+ctrl.get('weight').value || 0) * (+ctrl.get('unitPrice').value || 0);
  }

  totalAmount(): number { return this.itemControls.reduce((s, c) => s + this.getItemTotal(c), 0); }

  openAdd(): void { this.form = this.buildForm(); this.addItem(); this.showForm = true; }

  save(): void {
    if (this.form.invalid || !this.itemControls.length) return;
    const v = this.form.value;
    const items = v.items.map((i: any) => ({
      ingredientId: +i.ingredientId,
      weight: i.weight,
      unitPrice: i.unitPrice
    }));
    this.cancel();
    this.svc.add({ ...v, supplierId: +v.supplierId, items, totalAmount: this.totalAmount() }).subscribe({
      next: () => this.snackBar.open('Invoice saved — ingredient costs updated', 'Close', { duration: 3500 }),
      error: () => this.snackBar.open('Save failed — check connection', 'Close', { duration: 3500 })
    });
  }

  delete(inv: Invoice): void {
    const ref = this.dialog.open(ConfirmDialog, {
      width: '420px',
      data: { title: 'Delete Invoice', message: `Are you sure you want to delete invoice ${inv.invoiceNumber}? This action cannot be undone.`, confirmLabel: 'Delete', confirmColor: 'warn', icon: 'delete' }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.svc.delete(inv.id).subscribe({
        next: () => this.snackBar.open('Invoice deleted', 'Close', { duration: 2000 }),
        error: () => this.snackBar.open('Delete failed', 'Close', { duration: 3500 })
      });
    });
  }

  toggleDetail(inv: Invoice): void {
    this.expandedInvoice = this.expandedInvoice?.id === inv.id ? null : inv;
  }

  cancel(): void { this.showForm = false; }

  togglePaid(inv: Invoice): void {
    this.svc.markPaid(inv.id!, !inv.isPaid).subscribe({
      next: () => this.snackBar.open(inv.isPaid ? 'Marked as unpaid' : 'Marked as paid ✓', 'Close', { duration: 2000 }),
      error: () => this.snackBar.open('Update failed', 'Close', { duration: 3000 })
    });
  }

  openPayment(inv: Invoice, event: Event): void {
    event.stopPropagation();
    if (inv.totalDue <= 0) return;
    const ref = this.dialog.open(PaymentDialog, {
      width: '500px',
      data: { invoice: inv } as PaymentDialogData
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.svc.addPayment(inv.id, result.amount, result.date, result.notes).subscribe({
        next: () => this.snackBar.open('Payment recorded', 'Close', { duration: 2500 }),
        error: () => this.snackBar.open('Payment failed', 'Close', { duration: 3000 })
      });
    });
  }

  deletePayment(inv: Invoice, paymentId: number, event: Event): void {
    event.stopPropagation();
    const ref = this.dialog.open(ConfirmDialog, {
      width: '380px',
      data: { title: 'Remove Payment', message: 'Remove this payment record? The invoice balance will be updated.', confirmLabel: 'Remove', confirmColor: 'warn', icon: 'remove_circle' }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.svc.deletePayment(inv.id, paymentId).subscribe({
        next: () => this.snackBar.open('Payment removed', 'Close', { duration: 2000 }),
        error: () => this.snackBar.open('Remove failed', 'Close', { duration: 3000 })
      });
    });
  }
}
