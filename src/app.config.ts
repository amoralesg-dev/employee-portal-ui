import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';

import { RassiniPreset, provideRassiniAuth } from '@rassini/rassini-ui';
import { ConfirmationService, MessageService } from 'primeng/api';




import { environment } from './environments/environment';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
        provideHttpClient(withFetch()),
        provideZonelessChangeDetection(),
        provideRassiniAuth({
            loginUrl: `${environment.apiBaseUrl}/auth/login`,
            refreshUrl: `${environment.apiBaseUrl}/auth/refresh`,
            meUrl: `${environment.apiBaseUrl}/auth/me`,
            logoutUrl: `${environment.apiBaseUrl}/auth/logout`,
            changePasswordUrl: `${environment.apiBaseUrl}/auth/change-password`
        }),
        providePrimeNG({ theme: { preset: RassiniPreset, options: { darkModeSelector: '.app-dark' } } }),
        MessageService,ConfirmationService
    ]
};
