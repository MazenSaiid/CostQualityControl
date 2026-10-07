import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Invoice } from '../models';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private http = inject(HttpClient);
  private _invoices = signal<Invoice[]>([]);

  getAll() { return this._invoices; }

  load() {
    return this.http.get<Invoice[]>(`${environment.apiUrl}/invoices`).pipe(
      tap(data => this._invoices.set(data))
    );
  }

  add(req: any) {
    return this.http.post<Invoice>(`${environment.apiUrl}/invoices`, req).pipe(
      tap(created => this._invoices.update(list => [...list, created]))
    );
  }

  delete(id: number) {
    return this.http.delete(`${environment.apiUrl}/invoices/${id}`).pipe(
      tap(() => this._invoices.update(list => list.filter(i => i.id !== id)))
    );
  }

  markPaid(id: number, isPaid: boolean) {
    return this.http.patch<Invoice>(`${environment.apiUrl}/invoices/${id}/paid`, { isPaid }).pipe(
      tap(updated => this._invoices.update(list => list.map(i => i.id === id ? updated : i)))
    );
  }

  addPayment(id: number, amount: number, date: string, notes?: string) {
    return this.http.post<Invoice>(`${environment.apiUrl}/invoices/${id}/payments`, { amount, date, notes }).pipe(
      tap(updated => this._invoices.update(list => list.map(i => i.id === id ? updated : i)))
    );
  }

  deletePayment(invoiceId: number, paymentId: number) {
    return this.http.delete<Invoice>(`${environment.apiUrl}/invoices/${invoiceId}/payments/${paymentId}`).pipe(
      tap(updated => this._invoices.update(list => list.map(i => i.id === invoiceId ? updated : i)))
    );
  }

  updateLocal(updated: Invoice) {
    this._invoices.update(list => list.map(i => i.id === updated.id ? updated : i));
  }
}
