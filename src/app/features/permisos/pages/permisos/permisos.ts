import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  PageHeaderComponent,
  PageToolbarComponent,
  PageContentComponent,
  DataTable,
  AppDialog,
  Toast,
  Loader
} from '@rassini/rassini-ui';
import { PermisoForm } from '../../components/permiso-form/permiso-form';
import { PermisoMenusComponent } from '../../components/permiso-menus/permiso-menus';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';
import { PermisoService } from '../../services/permiso.service';
import { PermissionResponse, PermissionRequest } from '../../models/permiso.model';
import { PermissionService as SharedPermissionService } from '../../../../shared/services/permission.service';

@Component({
  selector: 'app-permisos',
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
    PermisoForm,
    PermisoMenusComponent
  ],
  providers: [DatePipe],
  templateUrl: './permisos.html'
})
export class Permisos implements OnInit {
  private readonly permisoService = inject(PermisoService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toast = inject(Toast);
  private readonly loader = inject(Loader);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly sharedPermissionService = inject(SharedPermissionService);
  private readonly datePipe = inject(DatePipe);

  get canCreate(): boolean { return this.sharedPermissionService.hasPermission('PERMISSION_CREATE'); }
  get canUpdate(): boolean { return this.sharedPermissionService.hasPermission('PERMISSION_UPDATE'); }
  get canDelete(): boolean { return this.sharedPermissionService.hasPermission('PERMISSION_DELETE'); }

  loading = true;
  dialogVisible = false;
  menuDialogVisible = false;
  selectedPermission: PermissionResponse | null = null;
  permissions: any[] = [];

  columns = [
    { field: 'id', header: 'ID', sortable: true },
    { field: 'code', header: 'Código', sortable: true },
    { field: 'description', header: 'Descripción', sortable: true },
    { field: 'createdAtFormatted', header: 'Fecha Creación', sortable: true },
    { field: 'actions', header: 'Acciones', type: 'actions' as const }
  ];

  ngOnInit(): void {
    this.loadPermissions();
  }

  loadPermissions(): void {
    this.loading = true;
    this.permisoService.getPermissions().subscribe({
      next: (data) => {
        this.permissions = data.map(p => ({
          ...p,
          createdAtFormatted: this.datePipe.transform(p.createdAt, 'dd/MM/yyyy HH:mm')
        }));
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.toast.error('Error al cargar la lista de permisos');
        console.error('Error listing permissions', err);
      }
    });
  }

  showCreateDialog(): void {
    this.selectedPermission = null;
    this.dialogVisible = true;
  }

  showEditDialog(permission: PermissionResponse): void {
    this.selectedPermission = permission;
    this.dialogVisible = true;
  }

  showMenuDialog(permission: PermissionResponse): void {
    this.selectedPermission = permission;
    this.menuDialogVisible = true;
  }

  guardarPermiso(formData: PermissionRequest): void {
    this.dialogVisible = false;
    this.loader.show();

    if (this.selectedPermission) {
      this.permisoService.updatePermission(this.selectedPermission.id, formData).subscribe({
        next: () => {
          this.loader.hide();
          this.toast.success('Permiso actualizado exitosamente');
          this.loadPermissions();
        },
        error: (err) => {
          this.loader.hide();
          this.toast.error(err.error?.message || 'Error al actualizar el permiso');
          console.error(err);
        }
      });
    } else {
      this.permisoService.createPermission(formData).subscribe({
        next: () => {
          this.loader.hide();
          this.toast.success('Permiso creado exitosamente');
          this.loadPermissions();
        },
        error: (err) => {
          this.loader.hide();
          this.toast.error(err.error?.message || 'Error al crear el permiso');
          console.error(err);
        }
      });
    }
  }

  eliminarPermiso(permission: PermissionResponse): void {
    this.confirmationService.confirm({
      header: 'Eliminar Permiso',
      message: `¿Está seguro de que desea eliminar el permiso ${permission.code}? Esta acción no se puede deshacer.`,
      acceptLabel: 'Confirmar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: {
        severity: 'danger'
      },
      accept: () => {
        this.loader.show();
        this.permisoService.deletePermission(permission.id).subscribe({
          next: () => {
            this.loader.hide();
            this.toast.success('Permiso eliminado exitosamente');
            this.loadPermissions();
          },
          error: (err) => {
            this.loader.hide();
            this.toast.error('Error al eliminar el permiso. Verifique si está asignado a un rol.');
            console.error(err);
          }
        });
      }
    });
  }
}
