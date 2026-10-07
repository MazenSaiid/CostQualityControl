import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { environment } from '../../environments/environment';

interface DashboardStats {
  totalProducts: number; totalIngredients: number; totalBatches: number;
  avgProfitMargin: number; avgYield: number;
  recentBatches: {batchNumber:string;productName:string;yieldPercentage:number;status:string}[];
  topProducts: {name:string;profitPercentage:number;sellingPrice:number;totalCost:number}[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTableModule, MatProgressBarModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  private http = inject(HttpClient);
  stats = signal<DashboardStats | null>(null);
  batchColumns = ['batchNumber', 'productName', 'yield', 'status'];
  productColumns = ['name', 'profitPercentage', 'sellingPrice', 'totalCost'];

  ngOnInit() {
    this.http.get<DashboardStats>(`${environment.apiUrl}/dashboard`).subscribe(s => this.stats.set(s));
  }
}
