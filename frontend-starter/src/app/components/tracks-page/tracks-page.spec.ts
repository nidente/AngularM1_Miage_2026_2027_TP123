import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpEventType, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  TestRequest,
} from '@angular/common/http/testing';
import { Page } from '../../shared/models/page.model';
import { Track } from '../../shared/models/track.model';
import { NotificationService } from '../../shared/services/notification.service';
import { TracksPageComponent } from './tracks-page';

const track = (id: string, title: string): Track => ({
  id,
  title,
  originalName: `${id}.mp3`,
  mimeType: 'audio/mpeg',
  size: 1000,
  createdAt: '2026-10-01',
});

const page = (items: Track[], total = items.length): Page<Track> => ({
  items,
  page: 1,
  limit: 5,
  total,
  pages: 1,
});

describe('TracksPageComponent', () => {
  let fixture: ComponentFixture<TracksPageComponent>;
  let component: TracksPageComponent;
  let http: HttpTestingController;
  // Faux service de notification : on vérifie le message sans afficher de SnackBar.
  const notify = { success: vi.fn(), error: vi.fn() };

  /** Répond à la requête de liste en attente (GET /api/tracks?page=…&limit=…). */
  const expectList = (): TestRequest =>
    http.expectOne((r) => r.method === 'GET' && r.url === '/api/tracks');

  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    notify.success.mockReset();
    notify.error.mockReset();
    TestBed.configureTestingModule({
      imports: [TracksPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: notify },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TracksPageComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it("affiche le message d'erreur du serveur après un échec du chargement", async () => {
    expectList().flush(
      { message: 'Base de données indisponible' },
      { status: 500, statusText: 'Server Error' },
    );
    await render();

    const alert = fixture.nativeElement.querySelector('.list-error') as HTMLElement;
    expect(alert.textContent).toContain('Base de données indisponible');
    expect(component.tracks()).toEqual([]);
  });

  describe('suppression', () => {
    beforeEach(async () => {
      expectList().flush(page([track('t1', 'Blues'), track('t2', 'Rock')]));
      await render();
    });

    it('après confirmation : DELETE /api/tracks/:id, message de succès, puis rechargement', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      component.confirmDelete(track('t1', 'Blues'));
      expect(component.deletingId()).toBe('t1');

      const req = http.expectOne('/api/tracks/t1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });

      expect(component.deletingId()).toBeNull();
      expect(notify.success).toHaveBeenCalledWith('« Blues » a été supprimée.');
      // La liste est redemandée au serveur : elle ne contient plus la piste.
      expectList().flush(page([track('t2', 'Rock')]));
      expect(component.tracks().map((t) => t.id)).toEqual(['t2']);
    });

    it("n'envoie aucune requête si l'utilisateur annule la confirmation", () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      component.confirmDelete(track('t1', 'Blues'));

      http.expectNone('/api/tracks/t1');
      expect(component.deletingId()).toBeNull();
    });

    it('ignore un second clic pendant une suppression en cours', () => {
      const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

      component.confirmDelete(track('t1', 'Blues'));
      component.confirmDelete(track('t1', 'Blues'));

      // Une seule confirmation, une seule requête DELETE.
      expect(confirm).toHaveBeenCalledTimes(1);
      http.expectOne('/api/tracks/t1').flush(null, { status: 204, statusText: 'No Content' });
      expectList().flush(page([track('t2', 'Rock')]));
    });

    it('404 (piste déjà supprimée ou pas à moi) : message d’erreur et liste resynchronisée', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      component.confirmDelete(track('t1', 'Blues'));
      http
        .expectOne('/api/tracks/t1')
        .flush({ message: 'Piste inconnue' }, { status: 404, statusText: 'Not Found' });

      expect(notify.error).toHaveBeenCalledWith(
        "Cette piste n'existe plus ou ne vous appartient pas. La liste a été mise à jour.",
      );
      expectList().flush(page([track('t2', 'Rock')]));
      expect(component.tracks().map((t) => t.id)).toEqual(['t2']);
    });
  });

  describe('upload', () => {
    const file = new File(['abc'], 'blues.mp3', { type: 'audio/mpeg' });

    beforeEach(async () => {
      expectList().flush(page([]));
      await render();
      component.file.set(file);
      component.title.setValue('Blues en la');
    });

    it('met à jour le pourcentage, bloque les contrôles, puis passe en réussite', async () => {
      component.upload();
      const req = http.expectOne((r) => r.method === 'POST' && r.url === '/api/tracks');
      expect(component.uploadState()).toEqual({ status: 'uploading', progress: 0 });
      expect(component.title.disabled).toBe(true);

      req.event({ type: HttpEventType.UploadProgress, loaded: 25, total: 100 });
      expect(component.uploadState()).toEqual({ status: 'uploading', progress: 25 });
      await render();
      expect(fixture.nativeElement.querySelector('.upload-percent').textContent).toContain('25 %');
      expect(fixture.nativeElement.querySelector('.upload-submit').disabled).toBe(true);

      // Taille totale inconnue : pas de pourcentage inventé.
      req.event({ type: HttpEventType.UploadProgress, loaded: 60 });
      expect(component.uploadState()).toEqual({ status: 'uploading', progress: null });

      const created = track('t9', 'Blues en la');
      req.flush(created, { status: 201, statusText: 'Created' });
      expect(component.uploadState()).toEqual({ status: 'success', track: created });
      expect(component.title.enabled).toBe(true);
      expect(component.file()).toBeUndefined();
      expectList().flush(page([created]));
    });

    it("traite l'erreur : état d'échec avec le message traduit, contrôles réactivés", () => {
      component.upload();
      http
        .expectOne((r) => r.method === 'POST' && r.url === '/api/tracks')
        .flush({ message: 'File too large' }, { status: 400, statusText: 'Bad Request' });

      expect(component.uploadState()).toEqual({
        status: 'error',
        message: 'Le fichier dépasse la taille maximale de 25 Mo.',
      });
      expect(component.title.enabled).toBe(true);
      expect(component.uploading()).toBe(false);
    });

    it("n'envoie pas une seconde requête si on soumet pendant l'envoi", () => {
      component.upload();
      component.upload();

      const req = http.expectOne((r) => r.method === 'POST' && r.url === '/api/tracks');
      req.flush(track('t9', 'Blues en la'), { status: 201, statusText: 'Created' });
      expectList().flush(page([]));
    });
  });
});
