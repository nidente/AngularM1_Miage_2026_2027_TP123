import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Page } from '../models/page.model';
import { Track } from '../models/track.model';

/** Encapsulates all HTTP operations for backing tracks. */
@Injectable({ providedIn: 'root' })
export class TrackService {
  private readonly http = inject(HttpClient);

  list(page = 1, limit = 5) {
    return this.http.get<Page<Track>>('/api/tracks', {
      params: { page, limit },
    });
  }

  /**
   * Envoie le fichier en multipart. `observe: 'events'` + `reportUploadProgress`
   * font émettre à l'Observable chaque étape de la requête (envoi, progression
   * de l'upload, réponse finale) au lieu de la seule réponse. Nécessite
   * `withXhr()` dans main.ts : le backend fetch() par défaut ne le permet pas.
   */
  upload(file: File, title: string) {
    const body = new FormData();
    body.append('audio', file);
    body.append('title', title);
    return this.http.post<Track>('/api/tracks', body, {
      reportUploadProgress: true,
      observe: 'events',
    });
  }

  audio(id: string) {
    return this.http.get(`/api/tracks/${id}/audio`, {
      responseType: 'blob',
    });
  }

  /** Bonus au contrat : DELETE /api/tracks/:id → 204 (voir API_CONTRACT.md). */
  remove(id: string) {
    return this.http.delete<void>(`/api/tracks/${id}`);
  }
}
