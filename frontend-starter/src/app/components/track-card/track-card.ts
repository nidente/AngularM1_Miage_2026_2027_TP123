import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Track } from '../../shared/models/track.model';
import { AudioFormatPipe } from '../../shared/pipes/audio-format.pipe';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';

/** One backing track of the library, displayed as a card with a play action. */
@Component({
  selector: 'app-track-card',
  imports: [DatePipe, AudioFormatPipe, FileSizePipe],
  templateUrl: './track-card.html',
  styleUrl: './track-card.css',
})
export class TrackCardComponent {
  readonly track = input.required<Track>();
  /** True si cette piste est celle actuellement chargée (en lecture ou en pause). */
  readonly playing = input(false);
  /** True seulement si le son est effectivement en train de jouer (pour l'icône ▶/⏸). */
  readonly audioPlaying = input(false);
  /** True pendant le téléchargement de son fichier audio (avant la lecture). */
  readonly loading = input(false);
  /** True pendant la suppression de cette piste. */
  readonly deleting = input(false);
  /** Émis au clic sur le bouton principal : lance la lecture, ou bascule pause/reprise. */
  readonly play = output<void>();
  readonly delete = output<void>();
}
