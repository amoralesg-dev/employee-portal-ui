import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PermisoMenusComponent } from './permiso-menus';
import { PermisoService } from '../../services/permiso.service';
import { MenuService } from '../../../menus/services/menu.service';
import { ApplicationService } from '../../../aplicaciones/services/application.service';
import { Toast, Loader } from '@rassini/rassini-ui';
import { MenuResponse } from '../../../menus/models/menu.model';
import { PermissionResponse } from '../../models/permiso.model';
import { ApplicationDto } from '../../../aplicaciones/models/application.model';

describe('PermisoMenusComponent', () => {
  let component: PermisoMenusComponent;
  let fixture: ComponentFixture<PermisoMenusComponent>;

  let mockPermisoService: any;
  let mockMenuService: any;
  let mockApplicationService: any;
  let mockToast: any;
  let mockLoader: any;

  const permissionTarget: PermissionResponse = {
    id: 35,
    code: 'CXP_ACCESS',
    description: 'Permiso general CxP',
    applicationId: 3,
    createdAt: '2026-01-01T00:00:00Z'
  };

  const sampleFlatMenus: MenuResponse[] = [
    // 1. Contenedor sin route ni externalUrl (ej. CXP_ROOT) -> Excluido
    {
      id: 23,
      code: 'CXP_ROOT',
      label: 'Cuentas por Pagar',
      route: '',
      externalUrl: '',
      icon: 'pi pi-folder',
      orderIndex: 1,
      parentId: null,
      applicationId: 3
    },
    // 2. Menú externo con externalUrl y route NULL -> Incluido
    {
      id: 24,
      code: 'CXP_PENDIENTES',
      label: 'Pagos Pendientes',
      route: null as any,
      externalUrl: 'https://cxp.rassini.com/pagos-pendientes',
      icon: 'pi pi-wallet',
      orderIndex: 2,
      parentId: 23,
      applicationId: 3
    },
    // 3. Menú externo con externalUrl y route solo espacios -> Incluido
    {
      id: 25,
      code: 'CXP_ENVIADOS',
      label: 'Pagos Enviados',
      route: '   ',
      externalUrl: 'https://cxp.rassini.com/pagos-enviados',
      icon: 'pi pi-history',
      orderIndex: 3,
      parentId: 23,
      applicationId: 3
    },
    // 4. Menú interno tradicional con route (externalUrl vacío/null) -> Incluido
    {
      id: 26,
      code: 'CXP_ERRORES',
      label: 'Pagos con Error',
      route: '/pagos-errores',
      externalUrl: null as any,
      icon: 'pi pi-exclamation-circle',
      orderIndex: 4,
      parentId: 23,
      applicationId: 3
    },
    // 5. Menú con route='' y externalUrl informado (caso del menú 28 en DEV) -> Incluido
    {
      id: 28,
      code: 'CXP_SUPPLIER_BANK_HISTORY',
      label: 'Historial Bancario Proveedores',
      route: '',
      externalUrl: 'https://cxp.rassini.com/proveedores-historial-bancario',
      icon: 'pi pi-building',
      orderIndex: 6,
      parentId: 23,
      applicationId: 3
    },
    // 6. Menú perteneciente a OTRA applicationId (ej. applicationId: 1) -> Excluido
    {
      id: 99,
      code: 'PORTAL_USERS',
      label: 'Usuarios Portal',
      route: '/usuarios',
      externalUrl: '',
      icon: 'pi pi-users',
      orderIndex: 1,
      parentId: null,
      applicationId: 1
    }
  ];

  beforeEach(async () => {
    mockPermisoService = {
      getPermissionMenus: vi.fn(),
      updatePermissionMenus: vi.fn()
    };
    mockMenuService = {
      getMenusFlat: vi.fn()
    };
    mockApplicationService = {
      getApplicationById: vi.fn()
    };
    mockToast = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn()
    };
    mockLoader = {
      show: vi.fn(),
      hide: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [PermisoMenusComponent],
      providers: [
        { provide: PermisoService, useValue: mockPermisoService },
        { provide: MenuService, useValue: mockMenuService },
        { provide: ApplicationService, useValue: mockApplicationService },
        { provide: Toast, useValue: mockToast },
        { provide: Loader, useValue: mockLoader }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PermisoMenusComponent);
    component = fixture.componentInstance;
    component.permission = { ...permissionTarget };
  });

  it('debe filtrar correctamente menús navegables (route o externalUrl), discriminar por applicationId y separar asignados de disponibles', () => {
    // Configurar menú 28 como actualmente asignado al permiso 35
    const assignedMenus: MenuResponse[] = [
      {
        id: 28,
        code: 'CXP_SUPPLIER_BANK_HISTORY',
        label: 'Historial Bancario Proveedores',
        route: '',
        externalUrl: 'https://cxp.rassini.com/proveedores-historial-bancario',
        icon: 'pi pi-building',
        orderIndex: 6,
        parentId: 23,
        applicationId: 3
      }
    ];

    const appMock: ApplicationDto = {
      id: 3,
      code: 'MS_PAGOS',
      name: 'Portal Pagos',
      description: 'Pagos CxP',
      active: true
    };

    mockMenuService.getMenusFlat.mockReturnValue(of(sampleFlatMenus));
    mockPermisoService.getPermissionMenus.mockReturnValue(of(assignedMenus));
    mockApplicationService.getApplicationById.mockReturnValue(of(appMock));

    component.loadData();

    // 1. Menús asignados: debe contener únicamente el menú 28
    expect(component.assignedMenus.length).toBe(1);
    expect(component.assignedMenus[0].id).toBe(28);

    // 2. Menús disponibles: deben incluir 24 (externalUrl con route null), 25 (externalUrl con route whitespace) y 26 (interno con route)
    const availableIds = component.availableMenus.map(m => m.id);
    expect(availableIds).toContain(24);
    expect(availableIds).toContain(25);
    expect(availableIds).toContain(26);

    // 3. Contenedor sin route ni externalUrl (id: 23) NO debe estar ni en asignados ni en disponibles
    expect(availableIds).not.toContain(23);
    expect(component.assignedMenus.map(m => m.id)).not.toContain(23);

    // 4. Menú de otra aplicación (id: 99, applicationId: 1) NO debe estar ni en asignados ni en disponibles
    expect(availableIds).not.toContain(99);
    expect(component.assignedMenus.map(m => m.id)).not.toContain(99);

    // 5. El menú ya asignado (id: 28) NO debe estar en disponibles
    expect(availableIds).not.toContain(28);
  });
});
