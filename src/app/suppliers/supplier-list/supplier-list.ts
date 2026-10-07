import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SupplierService } from '../../services/supplier';
import { InvoiceService } from '../../services/invoice';
import { PermissionService } from '../../services/permission';
import { Supplier } from '../../models';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatCardModule, MatTableModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSnackBarModule, MatTooltipModule,
    MatDialogModule, ConfirmDialog],
  templateUrl: './supplier-list.html',
  styleUrl: './supplier-list.scss'
})
export class SupplierList implements OnInit {
  private svc = inject(SupplierService);
  private invoiceSvc = inject(InvoiceService);
  permSvc = inject(PermissionService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  displayedColumns = ['name', 'contactPerson', 'phone', 'email', 'invoiceCount', 'totalInvoiced', 'totalPaid', 'totalOwed', 'actions'];
  showForm = false;
  editingId: number | null = null;
  form: FormGroup = this.buildForm();
  suppliers = this.svc.getAll();
  invoices = this.invoiceSvc.getAll();

  supplierStats = computed(() => {
    const inv = this.invoices();
    const map = new Map<number, { count: number; invoiced: number; paid: number; due: number }>();
    for (const i of inv) {
      if (!i.supplierId) continue;
      const cur = map.get(i.supplierId) ?? { count: 0, invoiced: 0, paid: 0, due: 0 };
      cur.count++;
      cur.invoiced += i.totalAmount;
      cur.paid += i.totalPaid;
      cur.due += i.totalDue;
      map.set(i.supplierId, cur);
    }
    return map;
  });

  statsFor(id: number) {
    return this.supplierStats().get(id) ?? { count: 0, invoiced: 0, paid: 0, due: 0 };
  }

  ngOnInit() { this.svc.load().subscribe(); this.invoiceSvc.load().subscribe(); }

  buildForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      contactPerson: [''],
      phone: [''],
      email: [''],
      notes: ['']
    });
  }

  openAdd(): void { this.editingId = null; this.form = this.buildForm(); this.showForm = true; }

  openEdit(s: Supplier): void {
    this.editingId = s.id;
    this.form = this.buildForm();
    this.form.patchValue(s);
    this.showForm = true;
  }

  save(): void {
    if (this.form.invalid) return;
    const req$ = this.editingId
      ? this.svc.update(this.editingId, this.form.value)
      : this.svc.add(this.form.value);
    this.cancel();
    req$.subscribe({
      next: () => this.snackBar.open('Supplier saved', 'Close', { duration: 2500 }),
      error: () => this.snackBar.open('Save failed — check connection', 'Close', { duration: 3500 })
    });
  }

  delete(s: Supplier): void {
    const ref = this.dialog.open(ConfirmDialog, {
      width: '420px',
      data: { title: 'Delete Supplier', message: `Are you sure you want to delete "${s.name}"? This action cannot be undone.`, confirmLabel: 'Delete', confirmColor: 'warn', icon: 'delete' }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.svc.delete(s.id).subscribe({
        next: () => this.snackBar.open('Supplier deleted', 'Close', { duration: 2000 }),
        error: () => this.snackBar.open('Delete failed', 'Close', { duration: 3500 })
      });
    });
  }

  cancel(): void { this.showForm = false; this.editingId = null; }
}
