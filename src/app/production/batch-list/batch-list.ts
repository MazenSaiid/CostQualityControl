import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProductionService } from '../../services/production';
import { ProductService } from '../../services/product';
import { PermissionService } from '../../services/permission';
import { ProductionBatch } from '../../models';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-batch-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatCardModule, MatTableModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatSnackBarModule, MatProgressBarModule,
    MatTooltipModule, MatDialogModule, ConfirmDialog],
  templateUrl: './batch-list.html',
  styleUrl: './batch-list.scss'
})
export class BatchList implements OnInit {
  private svc = inject(ProductionService);
  private productSvc = inject(ProductService);
  permSvc = inject(PermissionService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  displayedColumns = ['batchNumber', 'productName', 'date', 'expected', 'actual', 'yield', 'waste', 'sellingValue', 'costValue', 'profit', 'status', 'actions'];
  showForm = false;
  editingId: number | null = null;
  expandedBatch: ProductionBatch | null = null;
  statuses = ['pending', 'completed', 'failed'];
  form: FormGroup = this.buildForm();

  batches = this.svc.getAll();
  products = this.productSvc.getAll();

  ngOnInit() { this.svc.load().subscribe(); this.productSvc.load().subscribe(); }

  buildForm(): FormGroup {
    return this.fb.group({
      batchNumber: ['', Validators.required],
      productId: ['', Validators.required],
      productionDate: [new Date(), Validators.required],
      expectedWeight: [0, [Validators.required, Validators.min(1)]],
      actualWeight: [0, [Validators.required, Validators.min(0)]],
      status: ['pending', Validators.required],
      notes: ['']
    });
  }

  estimatedYield(): number {
    const exp = +this.form.get('expectedWeight')?.value || 0;
    const act = +this.form.get('actualWeight')?.value || 0;
    return exp > 0 ? Math.round((act / exp) * 1000) / 10 : 0;
  }

  openAdd(): void { this.editingId = null; this.form = this.buildForm(); this.showForm = true; }

  openEdit(b: ProductionBatch): void {
    this.editingId = b.id;
    this.form = this.buildForm();
    this.form.patchValue({
      batchNumber: b.batchNumber,
      productId: b.productId,
      productionDate: new Date(b.productionDate),
      expectedWeight: b.expectedWeight,
      actualWeight: b.actualWeight,
      status: b.status,
      notes: b.notes ?? ''
    });
    this.showForm = true;
  }

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    const product = this.productSvc.getById(+v.productId);
    const payload = { ...v, productId: +v.productId, productName: product?.name };
    const id = this.editingId;
    this.cancel();
    const req$ = id
      ? this.svc.update(id, payload)
      : this.svc.add({ ...payload, ingredientsUsed: [] });
    req$.subscribe({
      next: () => this.snackBar.open(id ? 'Batch updated' : 'Batch saved', 'Close', { duration: 2500 }),
      error: () => this.snackBar.open('Save failed — check connection', 'Close', { duration: 3500 })
    });
  }

  delete(b: ProductionBatch): void {
    const ref = this.dialog.open(ConfirmDialog, {
      width: '420px',
      data: { title: 'Delete Batch', message: `Are you sure you want to delete batch ${b.batchNumber}? This action cannot be undone.`, confirmLabel: 'Delete', confirmColor: 'warn', icon: 'delete' }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.svc.delete(b.id).subscribe({
        next: () => this.snackBar.open('Batch deleted', 'Close', { duration: 2000 }),
        error: () => this.snackBar.open('Delete failed', 'Close', { duration: 3500 })
      });
    });
  }

  cancel(): void { this.showForm = false; this.editingId = null; }

  statusColor(status: string): string {
    return status === 'completed' ? 'green' : status === 'failed' ? 'red' : 'orange';
  }

  toggleDetail(b: ProductionBatch): void {
    this.expandedBatch = this.expandedBatch?.id === b.id ? null : b;
  }
}
