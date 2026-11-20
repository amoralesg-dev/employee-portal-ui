import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@rassini/rassini-ui';
import { catchError, map, of } from 'rxjs';
import { PermissionService } from '../services/permission.service';

/**
 * permissionGuard factory
 *
 * Bloquea el acceso a una ruta si el usuario no posee el permiso de READ
 * del módulo indicado. Redirige a /notfound en caso de acceso denegado.
 *
 * Uso en app.routes.ts:
 *   canActivate: [authGuard, permissionGuard('USER_READ')]
 *
 * @param requiredPermission - Código del permiso de lectura requerido
 */
export function permissionGuard(requiredPermission: string): CanActivateFn {
  return () => {
    const auth = inject(Auth);
    const permissionService = inject(PermissionService);
    const router = inject(Router);

    const evaluate = () =>
      permissionService.hasPermission(requiredPermission)
        ? true
        : router.createUrlTree(['/notfound']);

    if (auth.sessionRestored()) {
      return evaluate();
    }

    return auth.restoreSession().pipe(
      map(() => evaluate()),
      catchError(() => of(router.createUrlTree(['/notfound'])))
    );
  };
}
