import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
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

import { ProductService } from '../../services/product';
import { IngredientService } from '../../services/ingredient';
import { ProductionService } from '../../services/production';
import { PermissionService } from '../../services/permission';
import { Product } from '../../models';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatCardModule, MatTableModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatSnackBarModule, MatTooltipModule, MatDialogModule, ConfirmDialog],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss'
})
export class ProductList implements OnInit {
  private productSvc = inject(ProductService);
  private ingredientSvc = inject(IngredientService);
  private productionSvc = inject(ProductionService);
  permSvc = inject(PermissionService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  displayedColumns = ['code', 'name', 'category', 'totalWeight', 'totalCost', 'costPerKg', 'sellingPrice', 'margin', 'batchCount', 'actions'];
  showForm = false;
  editingId: number | null = null;
  expandedProduct: Product | null = null;
  form: FormGroup = this.buildForm();

  products = this.productSvc.getAll();
  ingredients = this.ingredientSvc.getAll();
  batches = this.productionSvc.getAll();
  categories = ['Bakery', 'Beverages', 'Dairy', 'Preserves', 'Snacks', 'Other'];

  batchCountMap = computed(() => {
    const map = new Map<number, number>();
    for (const b of this.batches()) {
      map.set(b.productId, (map.get(b.productId) ?? 0) + 1);
    }
    return map;
  });

  batchCountFor(productId: number): number {
    return this.batchCountMap().get(productId) ?? 0;
  }

  ngOnInit() { this.productSvc.load().subscribe(); this.ingredientSvc.load().subscribe(); this.productionSvc.load().subscribe(); }

  buildForm(): FormGroup {
    return this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      category: ['', Validators.required],
      sellingPrice: [0, [Validators.required, Validators.min(0)]],
      ingredients: this.fb.array([])
    });
  }

  get ingredientControls() { return (this.form.get('ingredients') as FormArray).controls; }

  addIngredientRow(): void {
    (this.form.get('ingredients') as FormArray).push(this.fb.group({
      ingredientId: ['', Validators.required],
      weight: [1, [Validators.required, Validators.min(0.001)]]
    }));
  }

  removeIngredientRow(i: number): void { (this.form.get('ingredients') as FormArray).removeAt(i); }

  getIngredientCost(ctrl: any): number {
    const id = +ctrl.get('ingredientId').value;
    const wt = +ctrl.get('weight').value || 0;
    const ing = this.ingredientSvc.getById(id);
    return ing ? ing.currentCost * wt : 0;
  }

  estimatedCost(): number { return this.ingredientControls.reduce((s, c) => s + this.getIngredientCost(c), 0); }

  openAdd(): void { this.editingId = null; this.form = this.buildForm(); this.showForm = true; }

  openEdit(p: Product): void {
    this.editingId = p.id;
    this.form = this.buildForm();
    const arr = this.form.get('ingredients') as FormArray;
    p.ingredients.forEach(i => arr.push(this.fb.group({ ingredientId: [i.ingredientId], weight: [i.weight] })));
    this.form.patchValue({ code: p.code, name: p.name, category: p.category, sellingPrice: p.sellingPrice });
    this.showForm = true;
  }

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    const ingredients = v.ingredients.map((i: any) => {
      const ing = this.ingredientSvc.getById(+i.ingredientId);
      return { ingredientId: +i.ingredientId, weight: i.weight };
    });
    const data = { ...v, ingredients, createdAt: new Date() };
    const req$ = this.editingId
      ? this.productSvc.update(this.editingId, data)
      : this.productSvc.add(data);
    this.cancel();
    req$.subscribe({
      next: () => this.snackBar.open('Product saved', 'Close', { duration: 2500 }),
      error: () => this.snackBar.open('Save failed — check connection', 'Close', { duration: 3500 })
    });
  }

  delete(p: Product): void {
    const ref = this.dialog.open(ConfirmDialog, {
      width: '420px',
      data: { title: 'Delete Product', message: `Are you sure you want to delete "${p.name}"? This action cannot be undone.`, confirmLabel: 'Delete', confirmColor: 'warn', icon: 'delete' }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.productSvc.delete(p.id).subscribe({
        next: () => this.snackBar.open('Product deleted', 'Close', { duration: 2000 }),
        error: () => this.snackBar.open('Delete failed', 'Close', { duration: 3500 })
      });
    });
  }

  toggleDetail(p: Product): void {
    this.expandedProduct = this.expandedProduct?.id === p.id ? null : p;
  }

  batchPercent(weight: number, totalWeight: number): number {
    return totalWeight > 0 ? (weight / totalWeight) * 100 : 0;
  }

  ingCostPerKg(cost: number | undefined, weight: number): number | null {
    return cost && weight > 0 ? cost / weight : null;
  }

  cancel(): void { this.showForm = false; this.editingId = null; }
}
