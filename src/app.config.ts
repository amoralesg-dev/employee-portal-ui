import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';

import { RassiniPreset, provideRassiniAuth } from '@rassini/rassini-ui';
import { ConfirmationService, MessageService } from 'primeng/api';




export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
        provideHttpClient(withFetch()),
        provideZonelessChangeDetection(),
        provideRassiniAuth({
            loginUrl: 'http://localhost:8080/employee-portal/api/v1/auth/login',
            refreshUrl: 'http://localhost:8080/employee-portal/api/v1/auth/refresh',
            meUrl: 'http://localhost:8080/employee-portal/api/v1/auth/me',
            logoutUrl: 'http://localhost:8080/employee-portal/api/v1/auth/logout',
            changePasswordUrl: 'http://localhost:8080/employee-portal/api/v1/auth/change-password'
        }),
        providePrimeNG({ theme: { preset: RassiniPreset, options: { darkModeSelector: '.app-dark' } } }),
        MessageService,ConfirmationService
    ]
};
