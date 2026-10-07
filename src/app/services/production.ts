import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProductionBatch, SupplierConsumption } from '../models';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ProductionService {
  private http = inject(HttpClient);
  private _batches = signal<ProductionBatch[]>([]);
  private _supplierConsumption = signal<SupplierConsumption[]>([]);

  getAll() { return this._batches; }

  load() {
    return this.http.get<ProductionBatch[]>(`${environment.apiUrl}/production`).pipe(
      tap(data => this._batches.set(data))
    );
  }

  add(req: any) {
    return this.http.post<ProductionBatch>(`${environment.apiUrl}/production`, req).pipe(
      tap(created => this._batches.update(list => [...list, created]))
    );
  }

  update(id: number, req: any) {
    return this.http.put<ProductionBatch>(`${environment.apiUrl}/production/${id}`, req).pipe(
      tap(updated => this._batches.update(list => list.map(b => b.id === id ? updated : b)))
    );
  }

  delete(id: number) {
    return this.http.delete(`${environment.apiUrl}/production/${id}`).pipe(
      tap(() => this._batches.update(list => list.filter(b => b.id !== id)))
    );
  }

  getSupplierConsumption() { return this._supplierConsumption; }

  loadSupplierConsumption() {
    return this.http.get<SupplierConsumption[]>(`${environment.apiUrl}/production/supplier-consumption`).pipe(
      tap(data => this._supplierConsumption.set(data))
    );
  }
}
