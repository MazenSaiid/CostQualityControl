import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { ProductionService } from '../../services/production';
import { ExportService } from '../../services/export';
import { ProductService } from '../../services/product';

@Component({
  selector: 'app-production-report',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatTableModule, MatIconModule, MatProgressBarModule,
    MatButtonModule, MatSelectModule, MatFormFieldModule, MatInputModule,
    MatDatepickerModule, MatNativeDateModule, FormsModule, MatTooltipModule
  ],
  templateUrl: './production-report.html',
  styleUrl: './production-report.scss'
})
export class ProductionReport implements OnInit {
  private svc = inject(ProductionService);
  private exportSvc = inject(ExportService);
  private productSvc = inject(ProductService);

  columns = ['batchNumber', 'productName', 'date', 'expected', 'actual', 'yield', 'waste', 'sellingValue', 'costValue', 'profit', 'status'];
  ingColumns = ['ingredientName', 'purchasedKg', 'purchasedValue', 'usedKg', 'usedValue', 'remainingKg', 'remainingValue', 'usagePercent'];
  batches = this.svc.getAll();
  supplierConsumption = this.svc.getSupplierConsumption();
  expandedSupplier: string | null = null;
  products = this.productSvc.getAll();

  maxDate = new Date();

  toIso(d: Date | null): string {
    if (!d) return '';
    return d.toISOString().split('T')[0];
  }

  toDate(s: string): Date | null {
    return s ? new Date(s) : null;
  }

  filterStatus = signal<string>('all');
  filterProduct = signal<number>(0);
  filterDateFrom = signal<string>('');
  filterDateTo = signal<string>('');

  filteredBatches = computed(() => {
    let result = this.batches();
    if (this.filterStatus() !== 'all') result = result.filter(b => b.status === this.filterStatus());
    if (this.filterProduct() > 0) result = result.filter(b => b.productId === this.filterProduct());
    if (this.filterDateFrom()) {
      const from = new Date(this.filterDateFrom());
      result = result.filter(b => new Date(b.productionDate) >= from);
    }
    if (this.filterDateTo()) {
      const to = new Date(this.filterDateTo());
      to.setHours(23, 59, 59, 999);
      result = result.filter(b => new Date(b.productionDate) <= to);
    }
    return result;
  });

  hasActiveFilters = computed(() =>
    this.filterStatus() !== 'all' || this.filterProduct() > 0 || !!this.filterDateFrom() || !!this.filterDateTo()
  );

  clearFilters() {
    this.filterStatus.set('all');
    this.filterProduct.set(0);
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
  }

  ngOnInit() {
    this.svc.load().subscribe();
    this.svc.loadSupplierConsumption().subscribe();
    this.productSvc.load().subscribe();
  }

  toggleSupplier(name: string) { this.expandedSupplier = this.expandedSupplier === name ? null : name; }

  completedBatches = computed(() => this.filteredBatches().filter(b => b.status === 'completed'));
  avgYield = computed(() => {
    const c = this.completedBatches();
    return c.length ? c.reduce((s, b) => s + b.yieldPercentage, 0) / c.length : 0;
  });
  avgWaste = computed(() => {
    const batches = this.completedBatches();
    return batches.length > 0 ? batches.reduce((s, b) => s + (b.wastePercentage ?? 0), 0) / batches.length : 0;
  });
  totalExpected = computed(() => this.completedBatches().reduce((s, b) => s + b.expectedWeight, 0));
  totalActual = computed(() => this.completedBatches().reduce((s, b) => s + b.actualWeight, 0));
  totalSellingValue = computed(() => this.completedBatches().reduce((s, b) => s + (b.sellingValue ?? 0), 0));
  totalCostValue = computed(() => this.completedBatches().reduce((s, b) => s + (b.costValue ?? 0), 0));
  totalProfit = computed(() => this.completedBatches().reduce((s, b) => s + (b.profitValue ?? 0), 0));
  totalWasteKg = computed(() => this.completedBatches().reduce((s, b) => s + (b.wasteWeight ?? 0), 0));

  exportExcel(): void {
    this.exportSvc.toExcel([
      {
        name: 'Batches',
        data: this.filteredBatches().map(b => ({
          'Batch #': b.batchNumber, 'Product': b.productName,
          'Date': new Date(b.productionDate).toLocaleDateString(),
          'Expected (kg)': b.expectedWeight, 'Actual (kg)': b.actualWeight,
          'Yield %': b.yieldPercentage, 'Waste %': b.wastePercentage,
          'Waste (kg)': b.wasteWeight, 'Selling Value': b.sellingValue,
          'Cost Value': b.costValue, 'Profit': b.profitValue, 'Status': b.status
        }))
      }
    ], 'Production-Report');
  }

  exportPdf(): void {
    this.exportSvc.toPdf('Production Report', [
      {
        heading: 'Production Batches',
        columns: ['Batch', 'Product', 'Date', 'Expected', 'Actual', 'Yield%', 'Waste%', 'Revenue', 'Cost', 'Profit', 'Status'],
        rows: this.filteredBatches().map(b => [
          b.batchNumber ?? '', b.productName ?? '', new Date(b.productionDate).toLocaleDateString(),
          b.expectedWeight.toFixed(2), b.actualWeight.toFixed(2),
          `${b.yieldPercentage.toFixed(1)}%`, `${(b.wastePercentage ?? 0).toFixed(1)}%`,
          (b.sellingValue ?? 0).toFixed(2), (b.costValue ?? 0).toFixed(2), (b.profitValue ?? 0).toFixed(2), b.status ?? ''
        ] as (string | number)[])
      }
    ], 'Production-Report');
  }
}
