import { Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Track } from '../../shared/models/track.model';
import { AuthService } from '../../shared/services/auth.service';
import { TrackService } from '../../shared/services/track.service';

@Component({
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePageComponent {
  readonly auth = inject(AuthService);
  private readonly tracks = inject(TrackService);

  readonly form = new FormGroup({
    // minlength(2) reprend la règle du backend (models/User.js).
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
  });

  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly error = signal('');

  /** Library summary: total count and most recent track (API sorts newest first). */
  readonly trackCount = signal<number | null>(null);
  readonly latestTrack = signal<Track | null>(null);

  readonly initial = computed(() => this.auth.currentUser()?.name.charAt(0).toUpperCase() || '?');

  private savedTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    // Le profil est déjà chargé par la nav (AppComponent) ou par la connexion :
    // on se contente de remplir le formulaire dès qu'il est disponible, sans
    // relancer GET /api/users/me une deuxième fois.
    effect(() => {
      const user = this.auth.currentUser();
      if (user && !this.form.dirty) {
        this.form.setValue({ name: user.name });
      }
    });

    this.tracks.list(1, 1).subscribe({
      next: (page) => {
        this.trackCount.set(page.total);
        this.latestTrack.set(page.items[0] ?? null);
      },
      error: (error) => console.error('[ProfilePage] Résumé de la bibliothèque impossible', error),
    });
  }

  /** True when the typed name is identical to the saved one. */
  isUnchanged(): boolean {
    return this.form.controls.name.value.trim() === this.auth.currentUser()?.name;
  }

  save(): void {
    if (this.form.invalid || this.saving() || this.isUnchanged()) {
      return;
    }
    this.error.set('');
    this.saving.set(true);
    this.auth
      .update(this.form.getRawValue().name.trim())
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (user) => {
          console.debug('[ProfilePage] Profil enregistré', user.id);
          this.form.markAsPristine();
          this.showSaved();
        },
        error: (error: { error?: { message?: string } }) => {
          console.error('[ProfilePage] Enregistrement impossible', error);
          this.error.set(error.error?.message ?? 'Enregistrement impossible, réessayez.');
        },
      });
  }

  /** Displays the confirmation for a few seconds. */
  private showSaved(): void {
    clearTimeout(this.savedTimer);
    this.saved.set(true);
    this.savedTimer = setTimeout(() => this.saved.set(false), 3000);
  }
}
