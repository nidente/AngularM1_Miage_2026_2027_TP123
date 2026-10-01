import {
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { finalize, Subscription } from 'rxjs';
import { Track } from '../../shared/models/track.model';
import { TrackService } from '../../shared/services/track.service';
import {
  AUDIO_ACCEPT,
  audioFileError,
  audioPlaybackErrorMessage,
  uploadErrorMessage,
} from '../../shared/validators/audio-file.validator';
import { TrackCardComponent } from '../track-card/track-card';

@Component({
  imports: [ReactiveFormsModule, MatPaginatorModule, TrackCardComponent],
  templateUrl: './tracks-page.html',
  styleUrl: './tracks-page.css',
})
export class TracksPageComponent {
  private readonly service = inject(TrackService);

  readonly tracks = signal<Track[]>([]);
  /**
   * Filtre par titre : le backend n'a pas de paramètre de recherche, donc on
   * filtre uniquement les pistes déjà chargées pour la page courante, pas
   * toute la bibliothèque. Le champ le précise pour ne pas induire en erreur.
   */
  readonly searchTerm = signal('');
  readonly filteredTracks = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    return query
      ? this.tracks().filter((t) => t.title.toLowerCase().includes(query))
      : this.tracks();
  });
  /** Page courante, comptée à partir de 1 comme dans l'API. */
  readonly page = signal(1);
  readonly limit = signal(5);
  readonly pages = signal(1);
  /** Nombre total de pistes : le paginator en a besoin pour ses bornes. */
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal('');
  /** Tailles proposées ; le backend plafonne limit à 20. */
  readonly pageSizeOptions = [5, 10, 20];
  readonly audioUrl = signal('');
  /** Piste dont l'audio est chargé (en lecture ou en pause), pour la mettre en avant. */
  readonly nowPlaying = signal<Track | null>(null);
  /** True si le lecteur est effectivement en train de jouer (pas juste chargé/en pause). */
  readonly isPlaying = signal(false);
  /** Piste dont le fichier est en train d'être téléchargé (avant lecture). */
  readonly loadingTrackId = signal<string | null>(null);
  readonly playError = signal('');
  /** Piste en cours de suppression. */
  readonly deletingId = signal<string | null>(null);
  readonly deleteSuccess = signal('');
  readonly title = new FormControl('', { nonNullable: true });
  readonly audioAccept = AUDIO_ACCEPT;
  /** Message affiché sous le champ fichier quand le fichier choisi est refusé. */
  readonly fileError = signal('');
  readonly file = signal<File | undefined>(undefined);
  /** États de l'envoi : en cours, erreur renvoyée par le serveur, message de succès. */
  readonly uploading = signal(false);
  readonly uploadError = signal('');
  readonly uploadSuccess = signal('');

  /** L'input fichier, pour pouvoir le vider après un envoi réussi. */
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  /** Le lecteur <audio>, pour piloter play()/pause() sans re-télécharger le fichier. */
  private readonly audioPlayer = viewChild<ElementRef<HTMLAudioElement>>('audioPlayer');
  private successTimer?: ReturnType<typeof setTimeout>;
  private deleteSuccessTimer?: ReturnType<typeof setTimeout>;

  /** Requête de liste en cours, annulée si l'utilisateur change de page avant la réponse. */
  private listRequest?: Subscription;
  /** Requête audio en cours, annulée si l'utilisateur clique une autre piste avant la réponse. */
  private audioRequest?: Subscription;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.listRequest?.unsubscribe();
      this.audioRequest?.unsubscribe();
      clearTimeout(this.successTimer);
      clearTimeout(this.deleteSuccessTimer);
      // Une URL blob non révoquée reste en mémoire tant que la page n'est pas rechargée.
      const url = this.audioUrl();
      if (url) URL.revokeObjectURL(url);
    });
    this.load();
  }

  choose(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const error = file ? audioFileError(file) : null;

    if (file && error) {
      // Le fichier est refusé avant tout appel HTTP ; on vide le champ pour
      // que l'utilisateur voie qu'aucun fichier n'est retenu.
      console.warn('[TracksPage] Fichier refusé côté frontend', file.name, file.type, file.size);
      this.fileError.set(error);
      this.file.set(undefined);
      input.value = '';
      return;
    }

    this.fileError.set('');
    this.uploadError.set('');
    this.file.set(file);
    console.debug('[TracksPage] Fichier sélectionné', file?.name);
  }

  /** Demande au serveur la page courante : aucune pagination n'est faite côté Angular. */
  load(): void {
    // Sans cette annulation, une réponse lente d'une page précédente pourrait
    // arriver après la bonne et écraser l'affichage.
    this.listRequest?.unsubscribe();
    this.loading.set(true);
    this.error.set('');
    this.listRequest = this.service.list(this.page(), this.limit()).subscribe({
      next: (response) => {
        console.debug('[TracksPage] Pistes chargées', response.items.length, 'page', response.page);
        this.tracks.set(response.items);
        this.pages.set(response.pages);
        this.total.set(response.total);
        this.loading.set(false);
      },
      error: (error: { error?: { message?: string } }) => {
        console.error('[TracksPage] Chargement impossible', error);
        // On n'affiche pas les pistes d'une autre page sous un paginator qui annonce la page demandée.
        this.tracks.set([]);
        this.error.set(
          error.error?.message ??
            'Impossible de charger vos pistes. Vérifiez que le serveur est lancé.',
        );
        this.loading.set(false);
      },
    });
  }

  /** Material compte les pages à partir de 0, l'API à partir de 1 : la conversion se fait ici. */
  onPage(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    // Le filtre ne porte que sur la page affichée : il n'a plus de sens une
    // fois qu'on change de page.
    this.searchTerm.set('');
    this.load();
  }

  upload(): void {
    const file = this.file();
    // Garde anti double soumission : le bouton est désactivé, mais un double-clic
    // très rapide ou la touche Entrée pourraient arriver avant le rafraîchissement.
    if (!file || this.uploading()) return;

    // Deuxième contrôle juste avant l'envoi : aucune requête ne part avec un fichier invalide.
    const error = audioFileError(file);
    if (error) {
      this.fileError.set(error);
      return;
    }

    this.uploading.set(true);
    this.uploadError.set('');
    this.uploadSuccess.set('');
    this.title.disable();

    this.service
      .upload(file, this.title.value.trim() || file.name)
      .pipe(
        finalize(() => {
          this.uploading.set(false);
          this.title.enable();
        }),
      )
      .subscribe({
        next: (track) => {
          console.debug('[TracksPage] Piste envoyée', track.id);
          this.resetUploadForm();
          this.showSuccess(`« ${track.title} » a été ajouté à votre bibliothèque.`);
          // La nouvelle piste est la plus récente : elle apparaît en tête de la page 1.
          this.page.set(1);
          this.load();
        },
        error: (err) => {
          console.error('[TracksPage] Envoi impossible', err);
          this.uploadError.set(uploadErrorMessage(err));
        },
      });
  }

  private resetUploadForm(): void {
    this.title.setValue('');
    this.file.set(undefined);
    const input = this.fileInput()?.nativeElement;
    if (input) input.value = '';
  }

  private showSuccess(message: string): void {
    clearTimeout(this.successTimer);
    this.uploadSuccess.set(message);
    this.successTimer = setTimeout(() => this.uploadSuccess.set(''), 4000);
  }

  /**
   * Clic sur le bouton ▶/⏸ d'une card. Si le fichier de cette piste est déjà
   * chargé, on ne fait que basculer lecture/pause (aucune requête HTTP). Sinon,
   * on le télécharge d'abord.
   */
  play(track: Track): void {
    if (this.loadingTrackId() === track.id) return;

    if (this.nowPlaying()?.id === track.id) {
      const audio = this.audioPlayer()?.nativeElement;
      if (!audio) return;
      if (this.isPlaying()) {
        audio.pause();
      } else {
        void audio.play();
      }
      return;
    }

    this.audioRequest?.unsubscribe();
    this.playError.set('');
    this.loadingTrackId.set(track.id);

    this.audioRequest = this.service.audio(track.id).subscribe({
      next: (blob) => {
        console.debug('[TracksPage] Audio chargé', track.id, blob.size, 'octets');
        const previousUrl = this.audioUrl();
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        this.audioUrl.set(URL.createObjectURL(blob));
        this.nowPlaying.set(track);
        this.loadingTrackId.set(null);
        // L'attribut [autoplay] déclenche la lecture ; l'évènement (play) du
        // lecteur mettra isPlaying à jour, pas cette ligne.
      },
      error: (error: { status?: number }) => {
        console.error('[TracksPage] Lecture impossible', track.id, error);
        this.loadingTrackId.set(null);
        this.playError.set(audioPlaybackErrorMessage(error.status));
      },
    });
  }

  /**
   * Synchronise `isPlaying` avec le vrai état du lecteur : ces évènements se
   * déclenchent aussi bien pour un clic sur la card que pour les contrôles
   * natifs du navigateur (pause système, fin de lecture…).
   */
  onAudioPlaying(): void {
    this.isPlaying.set(true);
  }

  onAudioPaused(): void {
    this.isPlaying.set(false);
  }

  /** Le fichier a été téléchargé mais le navigateur ne parvient pas à le décoder ou le lire. */
  onAudioError(): void {
    console.error('[TracksPage] Le lecteur <audio> a signalé une erreur', this.nowPlaying()?.id);
    this.isPlaying.set(false);
    this.playError.set(
      "Le navigateur n'a pas pu lire ce fichier. Réessayez ou choisissez une autre piste.",
    );
  }

  /** Demande confirmation puis supprime la piste (DELETE /api/tracks/:id, bonus au contrat). */
  confirmDelete(track: Track): void {
    if (this.deletingId()) return;
    if (!window.confirm(`Supprimer définitivement « ${track.title} » ?`)) {
      return;
    }

    this.deletingId.set(track.id);
    this.playError.set('');

    this.service.remove(track.id).subscribe({
      next: () => {
        console.debug('[TracksPage] Piste supprimée', track.id);
        this.deletingId.set(null);

        if (this.nowPlaying()?.id === track.id) {
          const url = this.audioUrl();
          if (url) URL.revokeObjectURL(url);
          this.audioUrl.set('');
          this.nowPlaying.set(null);
          this.isPlaying.set(false);
        }

        clearTimeout(this.deleteSuccessTimer);
        this.deleteSuccess.set(`« ${track.title} » a été supprimée.`);
        this.deleteSuccessTimer = setTimeout(() => this.deleteSuccess.set(''), 4000);

        // Si c'était la dernière piste de cette page (au-delà de la page 1),
        // on recule d'une page pour ne pas afficher une page devenue vide.
        if (this.tracks().length === 1 && this.page() > 1) {
          this.page.set(this.page() - 1);
        }
        this.load();
      },
      error: (err) => {
        console.error('[TracksPage] Suppression impossible', track.id, err);
        this.deletingId.set(null);
        this.playError.set(uploadErrorMessage(err));
      },
    });
  }
}
