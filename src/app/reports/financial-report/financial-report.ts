import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { FinancialService } from '../../services/financial';
import { ExportService } from '../../services/export';

@Component({
  selector: 'app-financial-report',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatTableModule, MatChipsModule,
    MatProgressBarModule, MatButtonModule, MatSelectModule, MatFormFieldModule, MatInputModule, FormsModule
  ],
  templateUrl: './financial-report.html',
  styleUrl: './financial-report.scss'
})
export class FinancialReport implements OnInit {
  private svc = inject(FinancialService);
  private exportSvc = inject(ExportService);
  summary = this.svc.getSummary();
  filterStatus = signal<'all' | 'completed'>('all');
  filterSupplier = signal<string>('all');
  expandedSupplier: string | null = null;
  batchColumns = ['batchNumber', 'productName', 'date', 'weight', 'revenue', 'cost', 'profit', 'margin'];
  supplierColumns = ['supplier', 'invoiced', 'paid', 'owed', 'revenue', 'net'];

  filteredSuppliers = computed(() => {
    const s = this.summary();
    if (!s) return [];
    if (this.filterSupplier() === 'all') return s.supplierBreakdown;
    return s.supplierBreakdown.filter(sup => sup.supplier === this.filterSupplier());
  });

  ngOnInit() { this.svc.loadSummary().subscribe(); }

  toggleSupplier(name: string) {
    this.expandedSupplier = this.expandedSupplier === name ? null : name;
  }

  profitColor(val: number): string {
    return val >= 0 ? '#2e7d32' : '#c62828';
  }

  exportExcel(): void {
    const s = this.summary();
    if (!s) return;
    this.exportSvc.toExcel([
      {
        name: 'Batches',
        data: s.batchBreakdown.map(b => ({
          'Batch': b.batchNumber, 'Product': b.productName,
          'Date': new Date(b.productionDate).toLocaleDateString(),
          'Weight (kg)': b.actualWeight, 'Revenue': b.revenue,
          'Cost': b.ingredientCost, 'Profit': b.grossProfit, 'Margin %': b.grossMarginPct
        }))
      },
      {
        name: 'Suppliers',
        data: s.supplierBreakdown.map(sup => ({
          'Supplier': sup.supplier, 'Invoiced': sup.totalInvoiced,
          'Paid': sup.totalPaid, 'Owe': sup.totalOwed,
          'Revenue': sup.revenueGenerated, 'Net Position': sup.netPosition
        }))
      },
      {
        name: 'Summary',
        data: [{
          'Total Revenue': s.totalRevenue, 'Total Invoiced': s.totalInvoiced,
          'Total Paid': s.totalPaid, 'Still Owe': s.totalOwed,
          'Net Cash Position': s.netCashPosition, 'Gross Profit': s.grossProfit
        }]
      }
    ], 'Financial-Report');
  }

  exportPdf(): void {
    const s = this.summary();
    if (!s) return;
    this.exportSvc.toPdf('Financial Report', [
      {
        heading: 'Summary',
        columns: ['Total Revenue', 'Total Invoiced', 'Still Owe', 'Net Cash Position', 'Gross Profit'],
        rows: [[
          s.totalRevenue.toFixed(2), s.totalInvoiced.toFixed(2),
          s.totalOwed.toFixed(2), s.netCashPosition.toFixed(2), s.grossProfit.toFixed(2)
        ]]
      },
      {
        heading: 'Batch Revenue Breakdown',
        columns: ['Batch', 'Product', 'Date', 'Weight (kg)', 'Revenue', 'Cost', 'Profit', 'Margin %'],
        rows: s.batchBreakdown.map(b => [
          b.batchNumber, b.productName, new Date(b.productionDate).toLocaleDateString(),
          b.actualWeight.toFixed(2), b.revenue.toFixed(2),
          b.ingredientCost.toFixed(2), b.grossProfit.toFixed(2), `${b.grossMarginPct.toFixed(1)}%`
        ])
      },
      {
        heading: 'Supplier Breakdown',
        columns: ['Supplier', 'Invoiced', 'Paid', 'Owe', 'Revenue Generated', 'Net Position'],
        rows: s.supplierBreakdown.map(sup => [
          sup.supplier, sup.totalInvoiced.toFixed(2), sup.totalPaid.toFixed(2),
          sup.totalOwed.toFixed(2), sup.revenueGenerated.toFixed(2), sup.netPosition.toFixed(2)
        ])
      }
    ], 'Financial-Report');
  }
}
