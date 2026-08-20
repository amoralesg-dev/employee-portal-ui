import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Auth, AUTH_CONFIG } from '@rassini/rassini-ui';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-change-password-required',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, PasswordModule, InputTextModule],
  templateUrl: './change-password-required.html'
})
export class ChangePasswordRequired {
  form: FormGroup;
  loading = signal(false);
  backendError = signal<string | null>(null);

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private auth = inject(Auth);
  private router = inject(Router);
  private config = inject(AUTH_CONFIG);

  constructor() {
    this.form = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    }, { validators: [this.passwordMatchValidator, this.passwordDifferentValidator] });
  }

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  passwordDifferentValidator(group: AbstractControl): ValidationErrors | null {
    const current = group.get('currentPassword')?.value;
    const newPassword = group.get('newPassword')?.value;
    if (current && newPassword && current === newPassword) {
      group.get('newPassword')?.setErrors({ ...group.get('newPassword')?.errors, sameAsCurrent: true });
      return { sameAsCurrent: true };
    }
    return null;
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }

  submit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.backendError.set(null);

    const payload = this.form.value;
    const url = this.config.changePasswordUrl || '/api/v1/auth/change-password';

    this.http.post(url, payload).subscribe({
      next: () => {
        this.loading.set(false);
        // Despues de cambiar exitosamente, debemos hacer un refresh del contexto
        this.auth.restoreSession().subscribe({
          next: () => {
            this.router.navigate(['/']);
          },
          error: () => {
            this.logout();
          }
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.backendError.set(err.error?.message || 'Error al cambiar la contraseña. Verifica tu contraseña temporal.');
      }
    });
  }
}
