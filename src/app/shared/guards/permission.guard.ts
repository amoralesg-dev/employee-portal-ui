import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
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
    const permissionService = inject(PermissionService);
    const router = inject(Router);

    if (permissionService.hasPermission(requiredPermission)) {
      return true;
    }

    router.navigate(['/notfound']);
    return false;
  };
}
