import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { AuthLayoutComponent } from '../auth-layout/auth-layout';

@Component({
  imports: [ReactiveFormsModule, RouterLink, AuthLayoutComponent],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly error = signal('');
  /** True while the HTTP request is running: disables the submit button. */
  readonly loading = signal(false);
  readonly showPassword = signal(false);
  readonly form = new FormGroup({
    email: new FormControl('demo@example.com', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('Demo1234!', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  submit(): void {
    if (this.form.invalid || this.loading()) {
      return;
    }
    this.error.set('');
    this.loading.set(true);
    const values = this.form.getRawValue();
    this.auth
      .login(values.email, values.password)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          console.debug('[LoginPage] Connexion réussie');
          void this.router.navigateByUrl('/tracks');
        },
        error: (error: { error?: { message?: string } }) => {
          console.error('[LoginPage] Échec de connexion', error);
          this.error.set(error.error?.message ?? 'Erreur de connexion');
        },
      });
  }
}
