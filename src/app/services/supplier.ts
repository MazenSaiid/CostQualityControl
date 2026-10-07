import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Supplier } from '../models';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private http = inject(HttpClient);
  private _suppliers = signal<Supplier[]>([]);

  getAll() { return this._suppliers.asReadonly(); }
  getById(id: number) { return this._suppliers().find(s => s.id === id); }

  load() {
    return this.http.get<Supplier[]>(`${environment.apiUrl}/suppliers`).pipe(
      tap(data => this._suppliers.set(data))
    );
  }

  add(req: Partial<Supplier>) {
    return this.http.post<Supplier>(`${environment.apiUrl}/suppliers`, req).pipe(
      tap(s => this._suppliers.update(list => [...list, s]))
    );
  }

  update(id: number, req: Partial<Supplier>) {
    return this.http.put<Supplier>(`${environment.apiUrl}/suppliers/${id}`, req).pipe(
      tap(updated => this._suppliers.update(list => list.map(s => s.id === id ? updated : s)))
    );
  }

  delete(id: number) {
    return this.http.delete<void>(`${environment.apiUrl}/suppliers/${id}`).pipe(
      tap(() => this._suppliers.update(list => list.filter(s => s.id !== id)))
    );
  }
}
