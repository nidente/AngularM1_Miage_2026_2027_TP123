import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { AuthLayoutComponent } from '../auth-layout/auth-layout';

@Component({
  imports: [ReactiveFormsModule, RouterLink, AuthLayoutComponent],
  templateUrl: './register-page.html',
  styleUrl: './register-page.css',
})
export class RegisterPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly error = signal('');
  /** True while the HTTP request is running: disables the submit button. */
  readonly loading = signal(false);
  readonly showPassword = signal(false);

  // minlength(2) pour le nom et minlength(8) pour le mot de passe reprennent
  // les règles déjà imposées côté backend (models/User.js, app.js), pour que
  // l'utilisateur voie l'erreur avant même d'envoyer la requête.
  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
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
      .register(values.name, values.email, values.password)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          console.debug('[RegisterPage] Inscription réussie');
          void this.router.navigateByUrl('/profile');
        },
        error: (error: { error?: { message?: string } }) => {
          console.error('[RegisterPage] Échec de l’inscription', error);
          this.error.set(error.error?.message ?? 'Erreur d’inscription');
        },
      });
  }
}
