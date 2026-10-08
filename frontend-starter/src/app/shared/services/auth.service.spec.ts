import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthResponse } from '../models/auth-response.model';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  // Échoue si une requête inattendue est partie (ou si une attendue manque).
  afterEach(() => http.verify());

  it('login() envoie POST /api/auth/login avec email et mot de passe, puis mémorise la session', () => {
    const response: AuthResponse = {
      token: 'faux-jwt-de-test',
      user: { id: 'u1', name: 'Demo', email: 'demo@example.com', createdAt: '2026-10-01' },
    };

    let received: AuthResponse | undefined;
    service.login('demo@example.com', 'Demo1234!').subscribe((r) => (received = r));

    const req = http.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'demo@example.com', password: 'Demo1234!' });
    req.flush(response);

    expect(received).toEqual(response);
    expect(service.token()).toBe('faux-jwt-de-test');
    expect(service.currentUser()?.email).toBe('demo@example.com');
    expect(localStorage.getItem('gpc_token')).toBe('faux-jwt-de-test');
  });

  it('login() en échec (401) ne mémorise aucun token', () => {
    let status: number | undefined;
    service.login('demo@example.com', 'mauvais').subscribe({ error: (e) => (status = e.status) });

    http
      .expectOne('/api/auth/login')
      .flush({ message: 'Identifiants invalides' }, { status: 401, statusText: 'Unauthorized' });

    expect(status).toBe(401);
    expect(service.token()).toBeNull();
    expect(localStorage.getItem('gpc_token')).toBeNull();
  });
});
