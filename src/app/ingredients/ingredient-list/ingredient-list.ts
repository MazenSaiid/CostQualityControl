import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { IngredientService } from '../../services/ingredient';
import { SupplierService } from '../../services/supplier';
import { ProductionService } from '../../services/production';
import { PermissionService } from '../../services/permission';
import { Ingredient } from '../../models';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-ingredient-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatCardModule, MatTableModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSnackBarModule, MatTooltipModule, MatDialogModule, ConfirmDialog],
  templateUrl: './ingredient-list.html',
  styleUrl: './ingredient-list.scss'
})
export class IngredientList implements OnInit {
  private svc = inject(IngredientService);
  private supplierSvc = inject(SupplierService);
  private productionSvc = inject(ProductionService);
  permSvc = inject(PermissionService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  displayedColumns = ['name', 'unit', 'currentCost', 'supplier', 'purchased', 'used', 'remaining', 'lastUpdated', 'actions'];

  supplierConsumption = this.productionSvc.getSupplierConsumption();

  stockMap = computed(() => {
    const map = new Map<string, { purchased: number; used: number; remaining: number; usagePct: number }>();
    for (const sup of this.supplierConsumption()) {
      for (const ing of sup.ingredients) {
        const existing = map.get(ing.ingredientName);
        if (existing) {
          existing.purchased += ing.totalPurchasedKg;
          existing.used += ing.totalUsedKg;
          existing.remaining += ing.remainingKg;
        } else {
          map.set(ing.ingredientName, {
            purchased: ing.totalPurchasedKg,
            used: ing.totalUsedKg,
            remaining: ing.remainingKg,
            usagePct: ing.usagePercent
          });
        }
      }
    }
    return map;
  });

  stockFor(name: string) {
    return this.stockMap().get(name) ?? null;
  }
  showForm = false;
  editingId: number | null = null;
  units = ['kg', 'g', 'liter', 'ml', 'dozen', 'piece', 'box', 'bag'];
  form: FormGroup = this.buildForm();
  ingredients = this.svc.getAll();
  suppliers = this.supplierSvc.getAll();

  ngOnInit() {
    this.svc.load().subscribe();
    this.supplierSvc.load().subscribe();
    this.productionSvc.loadSupplierConsumption().subscribe();
  }

  buildForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      unit: ['kg', Validators.required],
      currentCost: [0, [Validators.required, Validators.min(0)]],
      supplierId: [null]
    });
  }

  openAdd(): void { this.editingId = null; this.form = this.buildForm(); this.showForm = true; }

  openEdit(i: Ingredient): void {
    this.editingId = i.id;
    this.form = this.buildForm();
    this.form.patchValue({ name: i.name, unit: i.unit, currentCost: i.currentCost, supplierId: i.supplierId ?? null });
    this.showForm = true;
  }

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    const payload = { ...v, supplierId: v.supplierId ? +v.supplierId : null };
    const req$ = this.editingId
      ? this.svc.update(this.editingId, payload)
      : this.svc.add(payload);
    this.cancel();
    req$.subscribe({
      next: () => this.snackBar.open('Ingredient saved', 'Close', { duration: 2500 }),
      error: () => this.snackBar.open('Save failed — check connection', 'Close', { duration: 3500 })
    });
  }

  delete(i: Ingredient): void {
    const ref = this.dialog.open(ConfirmDialog, {
      width: '420px',
      data: { title: 'Delete Ingredient', message: `Are you sure you want to delete "${i.name}"? This action cannot be undone.`, confirmLabel: 'Delete', confirmColor: 'warn', icon: 'delete' }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.svc.delete(i.id).subscribe({
        next: () => this.snackBar.open('Deleted', 'Close', { duration: 2000 }),
        error: () => this.snackBar.open('Delete failed', 'Close', { duration: 3500 })
      });
    });
  }

  cancel(): void { this.showForm = false; this.editingId = null; }
}
