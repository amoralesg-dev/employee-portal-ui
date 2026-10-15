import { Injectable, inject } from '@angular/core';
import { Auth, AuthBusinessUnit } from '@rassini/rassini-ui';

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

  hasAnyPermission(...permissionCodes: string[]): boolean {
    return permissionCodes.some(code => this.hasPermission(code));
  }

  /**
   * Retorna la lista de Business Units asignadas directamente al usuario autenticado.
   */
  businessUnits(): AuthBusinessUnit[] {
    return this.auth.businessUnits() ?? [];
  }

  /**
   * Retorna true si el usuario tiene acceso a todas las Business Units (acceso global).
   */
  hasAllBusinessUnits(): boolean {
    return this.auth.hasAllBusinessUnits() ?? false;
  }

  /**
   * Retorna true si el usuario tiene acceso a la Business Unit especificada.
   * - Si es usuario global (hasAllBusinessUnits=true), retorna true para cualquier BU.
   * - Si no, busca el ID en la lista de BUs asignadas.
   */
  canAccessBusinessUnit(businessUnitId: number): boolean {
    if (this.hasAllBusinessUnits()) {
      return true;
    }
    return this.businessUnits().some(bu => bu.id === businessUnitId);
  }
}
