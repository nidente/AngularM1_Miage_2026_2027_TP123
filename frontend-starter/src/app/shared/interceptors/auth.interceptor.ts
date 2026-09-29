import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Adds the bearer token to protected API requests, and reacts to a 401
 * response by clearing the local session and redirecting to /login.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();

  const authorizedRequest = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      // Un 401 reçu alors qu'un token avait été envoyé signifie que ce token
      // est invalide ou expiré (pas une simple erreur de mot de passe au
      // login, qui part sans token et n'est donc pas concernée ici).
      if (error instanceof HttpErrorResponse && error.status === 401 && token) {
        console.warn('[authInterceptor] Session expirée ou token invalide : déconnexion');
        auth.logout();
        void router.navigateByUrl('/login');
      }
      return throwError(() => error);
    }),
  );
};
