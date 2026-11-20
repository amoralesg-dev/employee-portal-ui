import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { catchError, of } from 'rxjs';
import { appRoutes } from './app.routes';

import { Auth, RassiniPreset, provideRassiniAuth, authInterceptor } from '@rassini/rassini-ui';
import { ConfirmationService, MessageService } from 'primeng/api';




import { environment } from './environments/environment';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
        provideHttpClient(
            withFetch(),
            withInterceptors([
                (req, next) => {
                    if (req.url.includes('/api/v1/auth/')) {
                        req = req.clone({ withCredentials: true });
                    }
                    return next(req);
                },
                authInterceptor
            ])
        ),
        provideZonelessChangeDetection(),
        provideRassiniAuth({
            loginUrl: `${environment.apiBaseUrl}/auth/login`,
            refreshUrl: `${environment.apiBaseUrl}/auth/refresh`,
            meUrl: `${environment.apiBaseUrl}/auth/me`,
            logoutUrl: `${environment.apiBaseUrl}/auth/logout`,
            changePasswordUrl: `${environment.apiBaseUrl}/auth/change-password`,
            mfaVerifyUrl: `${environment.apiBaseUrl}/auth/mfa/verify`,
            mfaSetupUrl: `${environment.apiBaseUrl}/auth/mfa/setup`,
            mfaActivateUrl: `${environment.apiBaseUrl}/auth/mfa/activate`,
            mfaDisableUrl: `${environment.apiBaseUrl}/auth/mfa/disable`
        }),
        providePrimeNG({ theme: { preset: RassiniPreset, options: { darkModeSelector: '.app-dark' } } }),
        provideAppInitializer(() => inject(Auth).restoreSession().pipe(catchError(() => of(null)))),
        MessageService,ConfirmationService
    ]
};
