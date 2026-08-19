# Regla: Autorización Visual por Acción — IAM Portal

## Principio fundamental

Todo módulo nuevo **DEBE** implementar autorización visual basada en permisos.

**No es suficiente proteger el menú lateral.**

Cada pantalla debe evaluar `auth.permissions()` para controlar individualmente
cada botón, toolbar, ícono, acción de tabla, formulario y operación disponible.

Esta regla aplica a **todos** los módulos IAM, sin excepción:

- Usuarios
- Roles
- Permisos
- Menús
- Aplicaciones
- Business Units
- Cualquier módulo futuro

---

## Helper obligatorio — PermissionService

Siempre usar el servicio existente. **No duplicar lógica.**

```typescript
// Ubicación: src/app/shared/services/permission.service.ts
private readonly permissionService = inject(PermissionService);

hasPermission(code: string): boolean
hasAnyPermission(...codes: string[]): boolean
```

---

## Convención de permisos por módulo

| Permiso              | Controla                                   |
|----------------------|--------------------------------------------|
| `NOMBRE_READ`        | Acceso a la ruta del módulo (route guard)  |
| `NOMBRE_CREATE`      | Botón / toolbar de alta (Nuevo / Crear)    |
| `NOMBRE_UPDATE`      | Botón de edición por fila                  |
| `NOMBRE_DELETE`      | Botón de eliminación / desactivación       |

### Módulos y sus códigos de permiso

| Módulo         | READ               | CREATE               | UPDATE               | DELETE               |
|----------------|--------------------|----------------------|----------------------|----------------------|
| Usuarios       | `USER_READ`        | `USER_CREATE`        | `USER_UPDATE`        | `USER_DELETE`        |
| Roles          | `ROLE_READ`        | `ROLE_CREATE`        | `ROLE_UPDATE`        | `ROLE_DELETE`        |
| Permisos       | `PERMISSION_READ`  | `PERMISSION_CREATE`  | `PERMISSION_UPDATE`  | `PERMISSION_DELETE`  |
| Menús          | `MENU_READ`        | `MENU_CREATE`        | `MENU_UPDATE`        | `MENU_DELETE`        |
| Aplicaciones   | `APP_READ`         | `APP_CREATE`         | `APP_UPDATE`         | `APP_DELETE`         |
| Business Units | `BU_READ`          | `BU_CREATE`          | `BU_UPDATE`          | `BU_DELETE`          |

---

## Checklist de implementación para cada módulo nuevo

### ✅ 1. Base de datos

```sql
-- Permisos del nuevo módulo
INSERT INTO iam.permissions (code, name, description, application_id) VALUES
  ('NOMBRE_READ',   'Ver NOMBRE',     'Permite ver listado', 1),
  ('NOMBRE_CREATE', 'Crear NOMBRE',   'Permite crear',       1),
  ('NOMBRE_UPDATE', 'Editar NOMBRE',  'Permite editar',      1),
  ('NOMBRE_DELETE', 'Eliminar NOMBRE','Permite eliminar',    1);

-- Asignar al rol ADMIN (role_id = 1 en dev/qa)
INSERT INTO iam.role_permissions (role_id, permission_id)
SELECT 1, id FROM iam.permissions
WHERE code IN ('NOMBRE_READ','NOMBRE_CREATE','NOMBRE_UPDATE','NOMBRE_DELETE');

-- Vincular permiso READ al menú del módulo
INSERT INTO iam.permission_menu (permission_id, menu_id)
SELECT p.id, m.id FROM iam.permissions p, iam.menus m
WHERE p.code = 'NOMBRE_READ' AND m.code = 'NOMBRE';
```

### ✅ 2. Route guard (`app.routes.ts`)

```typescript
import { permissionGuard } from './app/shared/guards/permission.guard';

{
    path: 'mi-modulo',
    component: MiModulo,
    canActivate: [permissionGuard('NOMBRE_READ')]
}
```

### ✅ 3. Componente TypeScript (`.ts`)

```typescript
import { PermissionService } from '../../../../shared/services/permission.service';

export class MiModulo implements OnInit {
  private readonly permissionService = inject(PermissionService);

  // Permisos calculados desde auth.permissions() — no hardcodear
  get canCreate(): boolean { return this.permissionService.hasPermission('NOMBRE_CREATE'); }
  get canUpdate(): boolean { return this.permissionService.hasPermission('NOMBRE_UPDATE'); }
  get canDelete(): boolean { return this.permissionService.hasPermission('NOMBRE_DELETE'); }
}
```

### ✅ 4. Template HTML (`.html`)

```html
<!-- Toolbar: botón Nuevo solo si CREATE -->
<app-page-toolbar>
    <button *ngIf="canCreate" pButton label="Nuevo" icon="pi pi-plus"
            (click)="showCreateDialog()">
    </button>
</app-page-toolbar>

<!-- Acciones por fila: solo si UPDATE / DELETE -->
<ng-template #actions let-row>
    <button *ngIf="canUpdate" pButton icon="pi pi-pencil" class="p-button-text"
            pTooltip="Editar" tooltipPosition="top"
            (click)="showEditDialog(row)">
    </button>
    <button *ngIf="canDelete" pButton icon="pi pi-trash" severity="danger"
            class="p-button-text" pTooltip="Eliminar" tooltipPosition="top"
            (click)="eliminar(row)">
    </button>
</ng-template>
```

---

## Reglas estrictas — NUNCA violar

| ❌ PROHIBIDO                              | ✅ CORRECTO                                    |
|-------------------------------------------|------------------------------------------------|
| `*ngIf="user.role === 'ADMIN'"`           | `*ngIf="canCreate"`                            |
| `[disabled]="!isAdmin"`                   | `*ngIf="canUpdate"` (ocultar, no solo disable) |
| Hardcodear usernames o roles              | `permissionService.hasPermission('CODE')`      |
| Módulo sin guard de ruta                  | `permissionGuard('NOMBRE_READ')` en route      |
| Botón sin evaluar permiso                 | Siempre con `*ngIf` evaluado                   |
| Duplicar lógica de permisos en componente | Siempre usar `PermissionService`               |
| Usar `[disabled]` en lugar de `*ngIf`     | Usar `*ngIf` — el elemento no debe existir en DOM |

---

## Módulos implementados (referencia de estado)

| Módulo   | READ guard | canCreate | canUpdate | canDelete |
|----------|-----------|-----------|-----------|-----------|
| Usuarios | ✅        | ✅        | ✅        | ✅        |
| Roles    | ✅        | ✅        | ✅        | ✅        |
| Permisos | ⏳        | ⏳        | ⏳        | ⏳        |
| Menús    | ⏳        | ⏳        | ⏳        | ⏳        |
| Apps     | ⏳        | ⏳        | ⏳        | ⏳        |
| BU       | ⏳        | ⏳        | ⏳        | ⏳        |
