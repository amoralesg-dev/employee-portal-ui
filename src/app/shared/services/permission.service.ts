import { Injectable, inject } from '@angular/core';
import { Auth } from '@rassini/rassini-ui';

/**
 * PermissionService
 *
 * Helper reutilizable para verificar si el usuario autenticado posee
 * un permiso específico. Consume únicamente auth.permissions() Signal.
 *
 * Uso en componente:
 *   private readonly permissionService = inject(PermissionService);
 *   canCreate = this.permissionService.hasPermission('ROLE_CREATE');
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly auth = inject(Auth);

  /**
   * Retorna true si el usuario autenticado posee el permiso indicado.
   * @param permissionCode - Código exacto del permiso (ej. 'ROLE_CREATE')
   */
  hasPermission(permissionCode: string): boolean {
    const permissions: string[] = this.auth.permissions() ?? [];
    return permissions.includes(permissionCode);
  }

  /**
   * Retorna la lista completa de permisos actuales.
   */
  getPermissions(): string[] {
    return this.auth.permissions() ?? [];
  }

  /**
   * Retorna true si el usuario posee al menos uno de los permisos indicados.
   * @param permissionCodes - Listado de códigos de permisos
   */
  hasAnyPermission(...permissionCodes: string[]): boolean {
    return permissionCodes.some(code => this.hasPermission(code));
  }
}
