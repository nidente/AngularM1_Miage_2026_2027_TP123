import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        // L'intercepteur réel est branché comme dans main.ts ; seul le réseau est simulé.
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => controller.verify());

  it('ajoute Authorization: Bearer <token> quand un token existe', () => {
    auth.token.set('jwt-de-test');

    http.get('/api/tracks').subscribe();

    const req = controller.expectOne('/api/tracks');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-de-test');
    req.flush({});
  });

  it("n'ajoute aucun header Authorization sans token", () => {
    http.post('/api/auth/login', {}).subscribe();

    const req = controller.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('sur un 401 avec token : déconnecte et redirige vers /login', () => {
    auth.token.set('jwt-expire');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    let status: number | undefined;
    http.get('/api/users/me').subscribe({ error: (e) => (status = e.status) });
    controller
      .expectOne('/api/users/me')
      .flush({ message: 'Token invalide' }, { status: 401, statusText: 'Unauthorized' });

    // L'erreur est quand même transmise à l'appelant, qui peut l'afficher.
    expect(status).toBe(401);
    expect(auth.token()).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/login');
  });
});
