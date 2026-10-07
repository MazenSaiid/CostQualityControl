import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProductService } from '../../services/product';
import { IngredientService } from '../../services/ingredient';
import { ExportService } from '../../services/export';

@Component({
  selector: 'app-cost-report',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './cost-report.html',
  styleUrl: './cost-report.scss'
})
export class CostReport implements OnInit {
  private productSvc = inject(ProductService);
  private ingredientSvc = inject(IngredientService);

  productColumns = ['code', 'name', 'category', 'ingredients', 'totalCost', 'costPerKg', 'sellingPrice', 'profit', 'margin'];
  ingredientColumns = ['name', 'unit', 'cost', 'supplier', 'lastUpdated'];

  products = this.productSvc.getAll();
  ingredients = this.ingredientSvc.getAll();
  private exportSvc = inject(ExportService);

  ngOnInit() { this.productSvc.load().subscribe(); this.ingredientSvc.load().subscribe(); }

  totalProductionCost = computed(() => this.products().reduce((s, p) => s + p.totalCost, 0));
  totalRevenue = computed(() => this.products().reduce((s, p) => s + p.sellingPrice, 0));
  totalProfit = computed(() => this.products().reduce((s, p) => s + p.profitAmount, 0));
  avgMargin = computed(() => {
    const p = this.products();
    return p.length ? p.reduce((s, x) => s + x.profitPercentage, 0) / p.length : 0;
  });

  exportExcel(): void {
    this.exportSvc.toExcel([
      {
        name: 'Products',
        data: this.products().map(p => ({
          'Code': p.code, 'Product': p.name, 'Category': p.category,
          'Ingredients': p.ingredients.length,
          'Batch Cost': p.totalCost, 'Batch Weight (kg)': p.totalWeight,
          'Cost/kg': p.costPerKg, 'Selling/kg': p.sellingPrice,
          'Profit': p.profitAmount, 'Margin %': p.profitPercentage
        }))
      },
      {
        name: 'Ingredients',
        data: this.ingredients().map(i => ({
          'Ingredient': i.name, 'Unit': i.unit,
          'Cost/Unit': i.currentCost, 'Supplier': i.supplierName ?? '—',
          'Last Updated': i.lastUpdated ? new Date(i.lastUpdated).toLocaleDateString() : '—'
        }))
      }
    ], 'Cost-Report');
  }

  exportPdf(): void {
    this.exportSvc.toPdf('Cost & Profitability Report', [
      {
        heading: 'Product Cost Analysis',
        columns: ['Code', 'Product', 'Category', 'Batch Cost', 'Cost/kg', 'Selling/kg', 'Profit', 'Margin%'],
        rows: this.products().map(p => [
          p.code, p.name, p.category,
          p.totalCost.toFixed(4), p.costPerKg.toFixed(4), p.sellingPrice.toFixed(4),
          p.profitAmount.toFixed(4), `${p.profitPercentage.toFixed(1)}%`
        ] as (string | number)[])
      }
    ], 'Cost-Report');
  }
}
