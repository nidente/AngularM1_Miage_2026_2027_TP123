import { TestBed } from '@angular/core/testing';
import { HttpEvent, HttpEventType, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Track } from '../models/track.model';
import { TrackService } from './track.service';

const TRACK: Track = {
  id: 't1',
  title: 'Blues en la',
  originalName: 'blues.mp3',
  mimeType: 'audio/mpeg',
  size: 1000,
  createdAt: '2026-10-01',
};

describe('TrackService', () => {
  let service: TrackService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TrackService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('list() transmet page et limit en paramètres de GET /api/tracks', () => {
    service.list(3, 10).subscribe();

    const req = http.expectOne((r) => r.url === '/api/tracks');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('3');
    expect(req.request.params.get('limit')).toBe('10');
    expect(req.request.urlWithParams).toBe('/api/tracks?page=3&limit=10');
    req.flush({ items: [], page: 3, limit: 10, total: 0, pages: 1 });
  });

  it('remove() envoie DELETE /api/tracks/:id', () => {
    let done = false;
    service.remove('t1').subscribe(() => (done = true));

    const req = http.expectOne('/api/tracks/t1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(done).toBe(true);
  });

  it('upload() envoie un multipart (champs audio et title) et émet la progression', () => {
    const file = new File(['abc'], 'blues.mp3', { type: 'audio/mpeg' });
    const events: HttpEvent<Track>[] = [];
    service.upload(file, 'Blues en la').subscribe((e) => events.push(e));

    const req = http.expectOne('/api/tracks');
    expect(req.request.method).toBe('POST');
    expect(req.request.reportUploadProgress).toBe(true);
    const body = req.request.body as FormData;
    expect(body.get('audio')).toBe(file);
    expect(body.get('title')).toBe('Blues en la');

    req.event({ type: HttpEventType.UploadProgress, loaded: 50, total: 100 });
    req.flush(TRACK, { status: 201, statusText: 'Created' });

    // Une seule requête, trois émissions : Sent (requête partie), progression, réponse finale.
    expect(events.map((e) => e.type)).toEqual([
      HttpEventType.Sent,
      HttpEventType.UploadProgress,
      HttpEventType.Response,
    ]);
  });
});
