import { bootstrapApplication } from "@angular/platform-browser";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { provideRouter } from "@angular/router";
import { AppComponent } from './app/components/app/app';
import { routes } from './app/routes';
import { FrenchPaginatorIntl } from './app/shared/i18n/french-paginator-intl';
import { authInterceptor } from './app/shared/interceptors/auth.interceptor';

// Dates affichées en français par DatePipe (« 24 septembre 2026 »).
registerLocaleData(localeFr);

bootstrapApplication(AppComponent, {
  providers: [
    { provide: LOCALE_ID, useValue: 'fr' },
    // Libellés du paginator Angular Material en français.
    { provide: MatPaginatorIntl, useClass: FrenchPaginatorIntl },
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
}).catch(console.error);
