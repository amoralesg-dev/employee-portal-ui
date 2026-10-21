import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Auth, RassiniSidebar, RassiniMenuItem } from '@rassini/rassini-ui';
import { AppLayout } from './app.layout';

describe('AppLayout & RassiniSidebar OIDC Menu Navigation', () => {
    let component: AppLayout;
    let fixture: ComponentFixture<AppLayout>;
    let router: Router;
    const mockMenusSignal = signal<any[]>([]);
    const mockAuthenticatedSignal = signal<boolean>(true);

    const mockAuth = {
        isAuthenticated: mockAuthenticatedSignal,
        menus: mockMenusSignal,
        currentUser: signal({ username: 'admin', email: 'admin@rassini.com' }),
        roles: signal(['ADMIN']),
        permissions: signal([]),
        businessUnits: signal([]),
        hasAllBusinessUnits: signal(true),
        logout: vi.fn()
    };

    beforeEach(async () => {
        sessionStorage.clear();
        mockMenusSignal.set([]);
        mockAuthenticatedSignal.set(true);

        await TestBed.configureTestingModule({
            imports: [AppLayout],
            providers: [
                provideRouter([]),
                MessageService,
                ConfirmationService,
                { provide: Auth, useValue: mockAuth }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AppLayout);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
    });

    it('1. Menú EXTERNO + OIDC: inicia el flujo OIDC, no llama router.navigate/navigateByUrl, no navega a /notfound y conserva resolvedUrl', async () => {
        const navigateSpy = vi.spyOn(router, 'navigate');
        const navigateByUrlSpy = vi.spyOn(router, 'navigateByUrl');
        const externalNavigateSpy = vi.spyOn(component, 'navigateToExternalUrl').mockImplementation(() => {});

        const oidcMenu = {
            code: 'CXP_PENDIENTES',
            label: 'Pagos Pendientes',
            icon: 'wallet',
            targetType: 'EXTERNO',
            authType: 'OIDC',
            appType: 'INTERNA',
            route: null,
            externalUrl: 'https://rss-cxp-dev.rassini.com/portal-cxp/pagos-pendientes',
            resolvedUrl: 'https://rss-cxp-dev.rassini.com/portal-cxp/pagos-pendientes',
            openInNewTab: false,
            children: []
        };

        mockMenusSignal.set([oidcMenu]);
        const transformed = component.menu[0];

        expect(transformed.routerLink).toBeNull();
        expect(transformed.targetType).toBe('EXTERNO');
        expect(transformed.authType).toBe('OIDC');
        expect(typeof transformed.command).toBe('function');

        // Verificar que RassiniSidebar tampoco trate un menú EXTERNO + OIDC del mismo host como ruta interna
        const sidebar = TestBed.runInInjectionContext(() => new RassiniSidebar());
        expect(sidebar.isInternalNavigation(transformed)).toBe(false);

        // Ejecutar la construcción de autorización para el destino DEV
        const parsedTarget = new URL(oidcMenu.resolvedUrl);
        const authUrl = await component.buildOidcAuthorizationUrl(parsedTarget);

        // Ejecutar launchOidcMenu simulando mismo origin o destino permitido
        await component.launchOidcMenu(oidcMenu);

        expect(navigateSpy).not.toHaveBeenCalled();
        expect(navigateByUrlSpy).not.toHaveBeenCalled();
        expect(externalNavigateSpy).toHaveBeenCalled();
        expect(sessionStorage.getItem('rassini_redirect_url')).toBe('https://rss-cxp-dev.rassini.com/portal-cxp/pagos-pendientes');
        expect(authUrl).toContain('/employee-portal/oauth2/authorize?');
        expect(authUrl).toContain('client_id=ms-pagos-client');
        expect(authUrl).toContain(encodeURIComponent('https://rss-cxp-dev.rassini.com/portal-cxp/callback'));
        expect(authUrl).toContain('code_challenge_method=S256');
    });

    it('2. Menú EXTERNO sin OIDC: abre resolvedUrl/externalUrl directamente sin usar Angular Router', () => {
        const navigateByUrlSpy = vi.spyOn(router, 'navigateByUrl');

        const externalThirdPartyMenu = {
            code: 'EXT_DOCS',
            label: 'Portal Externo',
            icon: 'globe',
            targetType: 'EXTERNO',
            authType: 'NONE',
            appType: 'TERCERO',
            route: null,
            externalUrl: 'https://portal-tercero.rassini.com/docs',
            resolvedUrl: 'https://portal-tercero.rassini.com/docs',
            openInNewTab: true,
            children: []
        };

        mockMenusSignal.set([externalThirdPartyMenu]);
        const transformed = component.menu[0];

        expect(transformed.routerLink).toBeNull();
        expect(transformed.command).toBeUndefined();
        expect(transformed.url).toBe('https://portal-tercero.rassini.com/docs');
        expect(transformed.target).toBe('_blank');

        const sidebar = TestBed.runInInjectionContext(() => new RassiniSidebar());
        expect(sidebar.isInternalNavigation(transformed)).toBe(false);
        expect(navigateByUrlSpy).not.toHaveBeenCalled();
    });

    it('3. Menú INTERNO: usa Angular Router con route', () => {
        const internalMenu = {
            code: 'EMP_USERS',
            label: 'Usuarios',
            icon: 'people',
            targetType: 'INTERNO',
            authType: 'NONE',
            appType: 'INTERNA',
            route: '/usuarios',
            externalUrl: null,
            resolvedUrl: null,
            openInNewTab: false,
            children: []
        };

        mockMenusSignal.set([internalMenu]);
        const transformed = component.menu[0];

        expect(transformed.routerLink).toEqual(['/usuarios']);
        expect(transformed.command).toBeUndefined();

        const sidebar = TestBed.runInInjectionContext(() => new RassiniSidebar());
        expect(sidebar.isInternalNavigation(transformed)).toBe(true);
        expect(sidebar.getInternalRoute(transformed)).toEqual(['/usuarios']);
    });

    it('4. Menú padre con children: solo expande/contrae y no inicia navegación', () => {
        const externalNavigateSpy = vi.spyOn(component, 'navigateToExternalUrl').mockImplementation(() => {});
        const parentMenu = {
            code: 'CXP_GROUP',
            label: 'Cuentas por Pagar',
            icon: 'folder',
            targetType: 'EXTERNO',
            authType: 'OIDC',
            appType: 'INTERNA',
            route: null,
            externalUrl: 'https://rss-cxp-dev.rassini.com/portal-cxp',
            resolvedUrl: 'https://rss-cxp-dev.rassini.com/portal-cxp',
            openInNewTab: false,
            children: [
                {
                    code: 'CXP_PENDIENTES',
                    label: 'Pagos Pendientes',
                    icon: 'wallet',
                    targetType: 'EXTERNO',
                    authType: 'OIDC',
                    appType: 'INTERNA',
                    route: null,
                    externalUrl: 'https://rss-cxp-dev.rassini.com/portal-cxp/pagos-pendientes',
                    resolvedUrl: 'https://rss-cxp-dev.rassini.com/portal-cxp/pagos-pendientes',
                    openInNewTab: false,
                    children: []
                }
            ]
        };

        mockMenusSignal.set([parentMenu]);
        const transformedParent: RassiniMenuItem = component.menu[0];

        expect(transformedParent.routerLink).toBeNull();
        expect(transformedParent.command).toBeUndefined();
        expect(transformedParent.items?.length).toBe(1);

        const sidebar = TestBed.runInInjectionContext(() => new RassiniSidebar());
        expect(sidebar.isInternalNavigation(transformedParent)).toBe(false);
        expect(sidebar.isItemExpanded(transformedParent)).toBe(false);

        sidebar.onItemClick(transformedParent, new MouseEvent('click'));

        expect(sidebar.isItemExpanded(transformedParent)).toBe(true);
        expect(externalNavigateSpy).not.toHaveBeenCalled();
    });

    it('6. Seguridad: rechaza dominios externos no permitidos o esquemas peligrosos (Open Redirect)', async () => {
        const externalNavigateSpy = vi.spyOn(component, 'navigateToExternalUrl').mockImplementation(() => {});

        expect(component.isAllowedOidcDestination('https://evil.com/portal-cxp/pagos-pendientes')).toBe(false);
        expect(component.isAllowedOidcDestination('//evil.com/portal-cxp')).toBe(false);
        expect(component.isAllowedOidcDestination('javascript:alert(1)')).toBe(false);
        expect(component.isAllowedOidcDestination('https://rss-cxp-dev.rassini.com/portal-cxp/pagos-pendientes')).toBe(true);

        const maliciousMenu = {
            targetType: 'EXTERNO',
            authType: 'OIDC',
            resolvedUrl: 'https://evil.com/phishing'
        };

        const result = await component.launchOidcMenu(maliciousMenu);
        expect(result).toBeNull();
        expect(externalNavigateSpy).not.toHaveBeenCalled();
        expect(sessionStorage.getItem('rassini_redirect_url')).toBeNull();
    });
});
