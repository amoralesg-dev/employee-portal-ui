import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  PageHeaderComponent,
  PageToolbarComponent,
  PageContentComponent,
  DataTable,
  AppDialog,
  Toast,
  Loader
} from '@rassini/rassini-ui';
import { RoleForm } from '../../components/role-form/role-form';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';
import { RoleService } from '../../services/role.service';
import { RoleResponse, RoleRequest } from '../../models/role.model';
import { PermissionService } from '../../../../shared/services/permission.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    PageToolbarComponent,
    PageContentComponent,
    ButtonModule,
    TooltipModule,
    DataTable,
    AppDialog,
    RoleForm
  ],
  templateUrl: './roles.html',
  styleUrl: './roles.scss',
})
export class Roles implements OnInit {
  private readonly roleService = inject(RoleService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toast = inject(Toast);
  private readonly loader = inject(Loader);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly permissionService = inject(PermissionService);

  // Permisos visuales calculados desde auth.permissions()
  get canCreate(): boolean { return this.permissionService.hasPermission('ROLE_CREATE'); }
  get canUpdate(): boolean { return this.permissionService.hasPermission('ROLE_UPDATE'); }
  get canDelete(): boolean { return this.permissionService.hasPermission('ROLE_DELETE'); }

  loading = true;
  dialogVisible = false;
  selectedRole: RoleResponse | null = null;
  roles: RoleResponse[] = [];

  columns = [
    { field: 'id', header: 'ID', sortable: true },
    { field: 'code', header: 'Código', sortable: true },
    { field: 'name', header: 'Nombre', sortable: true },
    { field: 'description', header: 'Descripción', sortable: true },
    { field: 'permissionsText', header: 'Permisos', sortable: false },
    { field: 'actions', header: 'Acciones', type: 'actions' as const }
  ];

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading = true;
    this.roleService.getRoles().subscribe({
      next: (data) => {
        this.roles = data.map(role => ({
          ...role,
          permissionsText: role.permissions ? role.permissions.map(p => p.name).join(', ') : ''
        }));
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.toast.error('Error al cargar la lista de roles');
        console.error('Error listing roles', err);
      }
    });
  }

  showCreateDialog(): void {
    this.selectedRole = null;
    this.dialogVisible = true;
  }

  showEditDialog(role: RoleResponse): void {
    this.selectedRole = role;
    this.dialogVisible = true;
  }

  guardarRol(formData: any): void {
    this.dialogVisible = false;
    this.loader.show();

    const roleReq: RoleRequest = {
      code: formData.code,
      name: formData.name,
      description: formData.description
    };

    if (this.selectedRole) {
      // Update Mode
      this.roleService.updateRole(this.selectedRole.id, roleReq).subscribe({
        next: (roleRes) => {
          this.roleService.replaceRolePermissions(roleRes.id, formData.permissionIds).subscribe({
            next: () => {
              this.loader.hide();
              this.toast.success('Rol actualizado exitosamente');
              this.loadRoles();
            },
            error: (err) => {
              this.loader.hide();
              this.toast.error('Rol actualizado pero los permisos no pudieron asignarse');
              console.error(err);
            }
          });
        },
        error: (err) => {
          this.loader.hide();
          this.toast.error('Error al actualizar el rol');
          console.error(err);
        }
      });
    } else {
      // Create Mode
      this.roleService.createRole(roleReq).subscribe({
        next: (roleRes) => {
          this.roleService.replaceRolePermissions(roleRes.id, formData.permissionIds).subscribe({
            next: () => {
              this.loader.hide();
              this.toast.success('Rol creado exitosamente');
              this.loadRoles();
            },
            error: (err) => {
              this.loader.hide();
              this.toast.error('Rol creado pero los permisos no pudieron asignarse');
              console.error(err);
            }
          });
        },
        error: (err) => {
          this.loader.hide();
          this.toast.error('Error al crear el rol');
          console.error(err);
        }
      });
    }
  }

  eliminarRol(role: RoleResponse): void {
    this.confirmationService.confirm({
      header: 'Eliminar Rol',
      message: `¿Está seguro de que desea eliminar el rol ${role.name}? Esta acción no se puede deshacer.`,
      acceptLabel: 'Confirmar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: {
        severity: 'danger'
      },
      accept: () => {
        this.loader.show();
        this.roleService.deleteRole(role.id).subscribe({
          next: () => {
            this.loader.hide();
            this.toast.success('Rol eliminado exitosamente');
            this.loadRoles();
          },
          error: (err) => {
            this.loader.hide();
            this.toast.error('Error al eliminar el rol. Verifique si tiene usuarios asignados.');
            console.error(err);
          }
        });
      }
    });
  }
}
