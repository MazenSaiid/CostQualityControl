import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../models';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private _products = signal<Product[]>([]);

  getAll() { return this._products; }

  getById(id: number) { return this._products().find(p => p.id === id); }

  load() {
    return this.http.get<Product[]>(`${environment.apiUrl}/products`).pipe(
      tap(data => this._products.set(data))
    );
  }

  add(req: any) {
    return this.http.post<Product>(`${environment.apiUrl}/products`, req).pipe(
      tap(created => this._products.update(list => [...list, created]))
    );
  }

  update(id: number, req: any) {
    return this.http.put<Product>(`${environment.apiUrl}/products/${id}`, req).pipe(
      tap(updated => this._products.update(list => list.map(p => p.id === id ? updated : p)))
    );
  }

  delete(id: number) {
    return this.http.delete(`${environment.apiUrl}/products/${id}`).pipe(
      tap(() => this._products.update(list => list.filter(p => p.id !== id)))
    );
  }

  updateCosts(ingredientId: number, newCost: number) {
    this.load().subscribe();
  }
}
