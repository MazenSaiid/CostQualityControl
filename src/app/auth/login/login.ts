import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  form = this.fb.group({ username: ['', Validators.required], password: ['', Validators.required] });
  loading = false;
  hidePassword = true;

  submit(): void { this.onSubmit(); }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const { username, password } = this.form.value;
    this.auth.login(username!, password!).subscribe({
      next: () => { this.loading = false; this.router.navigate(['/dashboard']); },
      error: () => { this.loading = false; this.snack.open('Invalid username or password', 'Close', { duration: 3000 }); }
    });
  }
}
