import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Ingredient } from '../models';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class IngredientService {
  private http = inject(HttpClient);
  private _ingredients = signal<Ingredient[]>([]);

  getAll() { return this._ingredients; }

  getById(id: number) { return this._ingredients().find(i => i.id === id); }

  load() {
    return this.http.get<Ingredient[]>(`${environment.apiUrl}/ingredients`).pipe(
      tap(data => this._ingredients.set(data))
    );
  }

  add(req: Omit<Ingredient, 'id' | 'lastUpdated'>) {
    return this.http.post<Ingredient>(`${environment.apiUrl}/ingredients`, req).pipe(
      tap(created => this._ingredients.update(list => [...list, created]))
    );
  }

  update(id: number, req: Omit<Ingredient, 'id' | 'lastUpdated'>) {
    return this.http.put<Ingredient>(`${environment.apiUrl}/ingredients/${id}`, req).pipe(
      tap(updated => this._ingredients.update(list => list.map(i => i.id === id ? updated : i)))
    );
  }

  delete(id: number) {
    return this.http.delete(`${environment.apiUrl}/ingredients/${id}`).pipe(
      tap(() => this._ingredients.update(list => list.filter(i => i.id !== id)))
    );
  }

  updateCost(id: number, cost: number) {
    const ing = this._ingredients().find(i => i.id === id);
    if (!ing) return;
    this.update(id, { name: ing.name, unit: ing.unit, currentCost: cost, supplierId: ing.supplierId }).subscribe();
  }
}
