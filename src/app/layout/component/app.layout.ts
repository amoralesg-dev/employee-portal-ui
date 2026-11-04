import { Component, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppFooter } from './app.footer';
import { LayoutService } from '@/app/layout/service/layout.service';
import {
  AppToast,
  AppConfirmDialog,
  AppLoader,
  Auth,
  RassiniShell
} from '@rassini/rassini-ui';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, RassiniShell, RouterModule, AppFooter, AppToast,AppConfirmDialog, AppLoader],
    template: `
    <div class="layout-wrapper" [ngClass]="containerClass()">

        @if (auth.isAuthenticated()) {
            <rui-shell
                [menu]="menu"
                (sidebarVisibleChange)="sidebarVisible = $event"
                (logout)="onLogout()">

                <div class="layout-main">

                    <app-app-loader></app-app-loader>

                    <app-app-toast></app-app-toast>

                    <app-app-confirm-dialog></app-app-confirm-dialog>

                    <router-outlet></router-outlet>

                </div>

                <app-footer></app-footer>

            </rui-shell>
        }

        <div class="layout-mask"></div>

    </div>
`
})
export class AppLayout {
    layoutService = inject(LayoutService);
    private router = inject(Router);
    readonly auth = inject(Auth);

    sidebarVisible = true;

    toggleSidebar(): void {
        this.sidebarVisible = !this.sidebarVisible;
    }

    onLogout(): void {

        this.auth.logout();

        this.router.navigate([
            '/auth/login'
        ]);

    }

    constructor() {
        if (typeof window !== 'undefined') {
            window.addEventListener('pageshow', (event: PageTransitionEvent) => {
                if (!this.auth.isAuthenticated()) {
                    window.location.replace('/employee-portal/auth/login');
                }
            });
        }

        effect(() => {
            const state = this.layoutService.layoutState();
            if (state.mobileMenuActive) {
                document.body.classList.add('blocked-scroll');
            } else {
                document.body.classList.remove('blocked-scroll');
            }
        });
    }

    containerClass = computed(() => {

    const config = this.layoutService.layoutConfig();
    const state = this.layoutService.layoutState();

    return {
        'layout-overlay': config.menuMode === 'overlay',
        'layout-static': config.menuMode === 'static',
        'layout-static-inactive': !this.sidebarVisible,
        'layout-overlay-active': state.overlayMenuActive,
        'layout-mobile-active': state.mobileMenuActive
    };
});
    

    get menu() {
        if (!this.auth.isAuthenticated()) {
            return [];
        }
        const rawMenus = this.auth.menus() || [];
        return rawMenus.map((menu: any) => this.transformMenu(menu));
    }

    private transformMenu(menu: any): any {
        // Mapeo de iconos tipo Material (del backend) a PrimeIcons
        const iconMap: { [key: string]: string } = {
            'home': 'pi pi-home',
            'admin_panel_settings': 'pi pi-cog',
            'people': 'pi pi-users',
            'security': 'pi pi-shield',
            'lock': 'pi pi-lock'
        };

        const primeIcon = iconMap[menu.icon] || (menu.icon?.startsWith('pi ') ? menu.icon : 'pi pi-' + menu.icon);
        const hasChildren = !!(menu.children && menu.children.length > 0);
        const isExternal = menu.targetType === 'EXTERNO';
        const isOidcMenu = isExternal && menu.authType === 'OIDC';
        const externalTargetUrl = menu.resolvedUrl || menu.externalUrl;
        
        // Ecosistema corporativo Rassini (apps internas o protegidas por OIDC):
        // Deben navegar en la MISMA pestaña (_self) para garantizar una experiencia continua.
        // Sitios externos de terceros (appType === 'TERCERO') respetan openInNewTab (_blank).
        const isCorporateEcosystem = menu.appType === 'INTERNA' || menu.authType === 'OIDC';
        const effectiveOpenInNewTab = isExternal ? (!isCorporateEcosystem && !!menu.openInNewTab) : false;
        const effectiveTarget = isExternal ? (effectiveOpenInNewTab ? '_blank' : '_self') : undefined;

        return {
            label: menu.label,
            icon: primeIcon,
            routerLink: (isExternal || hasChildren) ? null : (menu.route ? [menu.route] : null),
            url: (isExternal && !hasChildren) ? externalTargetUrl : undefined,
            target: effectiveTarget,
            targetType: menu.targetType,
            externalUrl: menu.externalUrl,
            resolvedUrl: menu.resolvedUrl,
            openInNewTab: effectiveOpenInNewTab,
            appType: menu.appType,
            authType: menu.authType,
            code: menu.code,
            command: (!hasChildren && isOidcMenu)
                ? (event?: any) => {
                    void this.launchOidcMenu(menu, event?.originalEvent);
                }
                : undefined,
            items: hasChildren
                ? menu.children.map((child: any) => this.transformMenu(child)) 
                : null
        };
    }

    /**
     * Valida que la URL destino de un menú OIDC corporativo sea segura y pertenezca a un origen permitido.
     * Previene vulnerabilidades de Open Redirect hacia dominios arbitrarios o esquemas peligrosos.
     */
    isAllowedOidcDestination(rawUrl?: string | null): boolean {
        if (!rawUrl || typeof rawUrl !== 'string') return false;
        const trimmed = rawUrl.trim();
        if (!trimmed || trimmed.startsWith('//')) return false;
        const lower = trimmed.toLowerCase();
        if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:') || lower.startsWith('file:')) {
            return false;
        }
        try {
            const currentOrigin = typeof window !== 'undefined' && window.location ? window.location.origin : 'https://rss-cxp-dev.rassini.com';
            const parsed = new URL(trimmed, currentOrigin);
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                return false;
            }
            if (parsed.origin === currentOrigin) {
                return true;
            }
            const host = parsed.hostname.toLowerCase();
            return (
                host === 'localhost' ||
                host === '127.0.0.1' ||
                host === 'rss-cxp-dev.rassini.com' ||
                host.endsWith('.rassini.com')
            );
        } catch {
            return false;
        }
    }

    /**
     * Inicia el flujo OIDC (Authorization Code + PKCE) para un menú externo con authType === 'OIDC'.
     * Conserva resolvedUrl en sessionStorage para que el callback de la aplicación destino redirija a la ruta solicitada.
     */
    async launchOidcMenu(menu: any, event?: Event): Promise<string | null> {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const targetUrl = (menu?.resolvedUrl || menu?.externalUrl || menu?.url || '').trim();
        if (!this.isAllowedOidcDestination(targetUrl)) {
            console.warn('[OIDC MENU] URL destino rechazada por validación de seguridad:', targetUrl);
            return null;
        }

        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('rassini_redirect_url', targetUrl);
            sessionStorage.setItem('rassini_MS_PAGOS_rassini_redirect_url', targetUrl);
        }

        // Si el backend ya entregó directamente una URL de autorización /oauth2/authorize, usarla
        if (targetUrl.includes('/oauth2/authorize')) {
            this.navigateToExternalUrl(targetUrl, '_self');
            return targetUrl;
        }

        const currentOrigin = typeof window !== 'undefined' && window.location ? window.location.origin : 'https://rss-cxp-dev.rassini.com';
        const parsedTarget = new URL(targetUrl, currentOrigin);

        // Si en desarrollo local los orígenes difieren (ej. localhost:4205 vs localhost:4201),
        // sessionStorage está aislado por puerto, por lo que navegamos al destino para que su rassiniAuthGuard
        // genere PKCE en su propio origin y redirija a /oauth2/authorize.
        // En DEV/QA/PROD (mismo origin https://rss-cxp-dev.rassini.com), iniciamos /oauth2/authorize directamente.
        if (parsedTarget.origin !== currentOrigin) {
            this.navigateToExternalUrl(targetUrl, '_self');
            return targetUrl;
        }

        const authUrl = await this.buildOidcAuthorizationUrl(parsedTarget);
        this.navigateToExternalUrl(authUrl, '_self');
        return authUrl;
    }

    async buildOidcAuthorizationUrl(parsedTarget: URL): Promise<string> {
        const rawIssuer = (environment.apiBaseUrl || '/employee-portal/api/v1').replace(/\/api\/v1\/?$/, '');
        const currentOrigin = typeof window !== 'undefined' && window.location ? window.location.origin : parsedTarget.origin;
        const issuer = rawIssuer.startsWith('/')
            ? `${currentOrigin}${rawIssuer}`
            : rawIssuer;
        const targetPath = parsedTarget.pathname || '/';
        const isPortalCxpSubpath = targetPath === '/portal-cxp' || targetPath.startsWith('/portal-cxp/');
        const redirectUri = isPortalCxpSubpath
            ? `${parsedTarget.origin}/portal-cxp/callback`
            : `${parsedTarget.origin}/callback`;

        const state = this.generateRandomString(32);
        const nonce = this.generateRandomString(32);
        const codeVerifier = this.generateRandomString(64);
        const codeChallenge = await this.generateCodeChallenge(codeVerifier);

        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('rassini_auth_state', state);
            sessionStorage.setItem('rassini_auth_nonce', nonce);
            sessionStorage.setItem('rassini_auth_verifier', codeVerifier);
            sessionStorage.setItem('rassini_MS_PAGOS_rassini_auth_state', state);
            sessionStorage.setItem('rassini_MS_PAGOS_rassini_auth_nonce', nonce);
            sessionStorage.setItem('rassini_MS_PAGOS_rassini_auth_verifier', codeVerifier);
        }

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: 'ms-pagos-client',
            redirect_uri: redirectUri,
            scope: 'openid profile email roles permissions business_units',
            state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            nonce
        });

        return `${issuer}/oauth2/authorize?${params.toString()}`;
    }

    navigateToExternalUrl(url: string, target: string = '_self'): void {
        if (typeof window === 'undefined') return;
        if (target === '_blank') {
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            window.location.href = url;
        }
    }

    private generateRandomString(length: number): string {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        const values = new Uint8Array(length);
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            crypto.getRandomValues(values);
        } else {
            for (let i = 0; i < length; i++) {
                values[i] = Math.floor(Math.random() * 256);
            }
        }
        return Array.from(values).map(v => charset[v % charset.length]).join('');
    }

    private async generateCodeChallenge(verifier: string): Promise<string> {
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(verifier);
            const digest = await crypto.subtle.digest('SHA-256', data);
            const bytes = new Uint8Array(digest);
            let str = '';
            bytes.forEach(b => str += String.fromCharCode(b));
            return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        }
        return verifier;
    }
}
