import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Invoice } from '../../models';

export interface PaymentDialogData {
  invoice: Invoice;
}

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatDatepickerModule, MatNativeDateModule],
  template: `
    <div class="dlg">
      <div class="dlg-header">
        <mat-icon>payment</mat-icon>
        <div>
          <h3>Record Payment</h3>
          <p>Invoice {{ data.invoice.invoiceNumber }} — {{ data.invoice.supplierName }}</p>
        </div>
      </div>

      <div class="amount-summary">
        <div class="sum-row">
          <span>Invoice Total</span>
          <strong>{{ data.invoice.totalAmount | number:'1.2-2' }}</strong>
        </div>
        <div class="sum-row paid">
          <span>Already Paid</span>
          <strong>{{ data.invoice.totalPaid | number:'1.2-2' }}</strong>
        </div>
        <div class="sum-row due">
          <span>Still Due</span>
          <strong>{{ data.invoice.totalDue | number:'1.2-2' }}</strong>
        </div>
      </div>

      <form [formGroup]="form" class="dlg-form">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Payment Amount</mat-label>
          <input matInput type="number" formControlName="amount" min="0.01" [max]="data.invoice.totalDue" step="0.01">
          <button mat-icon-button matSuffix type="button" matTooltip="Pay full remaining amount"
            (click)="form.get('amount')!.setValue(data.invoice.totalDue)">
            <mat-icon>done_all</mat-icon>
          </button>
          @if (form.get('amount')!.hasError('max')) {
            <mat-error>Cannot exceed remaining due amount ({{ data.invoice.totalDue | number:'1.2-2' }})</mat-error>
          }
          @if (form.get('amount')!.hasError('min') || form.get('amount')!.hasError('required')) {
            <mat-error>Enter a valid amount greater than 0</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Payment Date</mat-label>
          <input matInput [matDatepicker]="dp" formControlName="date">
          <mat-datepicker-toggle matIconSuffix [for]="dp"></mat-datepicker-toggle>
          <mat-datepicker #dp></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Notes (optional)</mat-label>
          <textarea matInput formControlName="notes" rows="2" placeholder="e.g. Bank transfer ref #12345"></textarea>
        </mat-form-field>
      </form>

      <div class="dlg-actions">
        <button mat-button (click)="dialogRef.close()">Cancel</button>
        <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="submit()">
          <mat-icon>check</mat-icon> Record Payment
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dlg { padding: 24px; min-width: 420px; max-width: 480px; }
    .dlg-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 20px;
      mat-icon { font-size: 28px; width: 28px; height: 28px; color: #3f51b5; margin-top: 2px; }
      h3 { margin: 0 0 2px; font-size: 1.1rem; font-weight: 700; color: #1a237e; }
      p { margin: 0; font-size: 0.82rem; color: #78909c; }
    }
    .amount-summary { background: #f5f7ff; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;
      display: flex; flex-direction: column; gap: 6px;
    }
    .sum-row { display: flex; justify-content: space-between; font-size: 0.88rem; color: #546e7a;
      strong { font-variant-numeric: tabular-nums; }
      &.paid strong { color: #2e7d32; }
      &.due strong { color: #c62828; font-size: 1rem; }
    }
    .dlg-form { display: flex; flex-direction: column; gap: 4px; }
    .full { width: 100%; }
    .dlg-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
  `]
})
export class PaymentDialog {
  dialogRef = inject(MatDialogRef<PaymentDialog>);
  data: PaymentDialogData = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    amount: [this.data.invoice.totalDue, [
      Validators.required,
      Validators.min(0.01),
      Validators.max(this.data.invoice.totalDue)
    ]],
    date: [new Date(), Validators.required],
    notes: ['']
  });

  submit() {
    if (this.form.invalid) return;
    const v = this.form.value;
    this.dialogRef.close({
      amount: +v.amount!,
      date: (v.date as Date).toISOString().split('T')[0],
      notes: v.notes || undefined
    });
  }
}
