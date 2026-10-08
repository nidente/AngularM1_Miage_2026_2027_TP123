import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Messages éphémères (Angular Material SnackBar). Les composants n'ont pas à
 * connaître la durée, le style ni le bouton de fermeture : tout est réglé ici.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, undefined, {
      duration: 4000,
      panelClass: 'snack-success',
    });
  }

  /** Une erreur reste plus longtemps et peut être fermée à la main. */
  error(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 8000,
      panelClass: 'snack-error',
      // Lu immédiatement par les lecteurs d'écran, comme un role="alert".
      politeness: 'assertive',
    });
  }
}
