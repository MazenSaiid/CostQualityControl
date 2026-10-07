import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { FinancialSummary } from '../models';

@Injectable({ providedIn: 'root' })
export class FinancialService {
  private http = inject(HttpClient);
  private _summary = signal<FinancialSummary | null>(null);
  getSummary() { return this._summary.asReadonly(); }
  loadSummary() {
    return this.http.get<FinancialSummary>(`${environment.apiUrl}/financials/summary`).pipe(
      tap(data => this._summary.set(data))
    );
  }
}
