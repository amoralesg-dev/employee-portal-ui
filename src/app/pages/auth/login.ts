import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth, RassiniLogin } from '@rassini/rassini-ui';
import { Router } from '@angular/router';

/**
 * Pantalla de Login.
 *
 * Incluye enlace "¿Olvidaste tu contraseña?" de manera visual.
 * NOTA: El flujo completo de recuperación por email no está implementado
 * en el backend (faltan endpoints forgot-password, validate-token, set-new-password).
 * El enlace redirige a /auth/forgot-password cuando esos endpoints estén disponibles.
 */
@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, RassiniLogin],
    styles: [`
        .login-wrapper {
            position: relative;
        }
        .forgot-password-bar {
            position: fixed;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            z-index: 10;
        }
        .forgot-password-bar a {
            color: var(--primary-color, #f59e0b);
            font-size: 0.9rem;
            text-decoration: none;
            cursor: not-allowed;
            opacity: 0.7;
        }
        .forgot-password-bar small {
            display: block;
            color: var(--text-color-secondary, #999);
            font-size: 0.75rem;
            margin-top: 0.25rem;
        }
    `],
    template: `
        <div class="login-wrapper">
            <rui-login
                (loginEvent)="onLogin($event)">
            </rui-login>

            <!--
                ENLACE "¿Olvidaste tu contraseña?" — Solo visual por ahora.
                Los endpoints de backend para recuperación por email aún no existen:
                  - POST /api/v1/auth/forgot-password   ❌ pendiente
                  - POST /api/v1/auth/validate-reset-token ❌ pendiente
                  - POST /api/v1/auth/set-new-password  ❌ pendiente
                Habilitarlo cuando el backend implemente el flujo completo.
            -->
            <div class="forgot-password-bar">
                <a href="javascript:void(0)" title="Funcionalidad pendiente de implementación en backend">
                    ¿Olvidaste tu contraseña?
                </a>
                <small>Contacta al administrador del sistema</small>
            </div>
        </div>
    `
})
export class Login {

    private router = inject(Router);
    private auth = inject(Auth);

    errorMessage = '';
    loading = false;

    onLogin(event: {
        username: string;
        password: string;
    }): void {
        // La lógica real de login, mostrar loading y redireccionar 
        // ya se maneja de manera asíncrona dentro del componente 
        // <rui-login> de la librería rassini-ui, 
        // el cual subscribe a this.auth.login(...) directamente.
        // No es necesario realizar doble suscripción ni doble navegación aquí.
        console.log('Login action delegated to rui-login component');
    }
}