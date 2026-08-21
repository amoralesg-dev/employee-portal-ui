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
import { ApplicationFormComponent } from '../../components/application-form/application-form';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';
import { ApplicationService } from '../../services/application.service';
import { ApplicationDto } from '../../models/application.model';
import { PermissionService } from '../../../../shared/services/permission.service';
import { HttpErrorResponse } from '@angular/common/http';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-aplicaciones',
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
    ApplicationFormComponent,
    TagModule
  ],
  templateUrl: './aplicaciones.html',
  styleUrl: './aplicaciones.scss',
})
export class Aplicaciones implements OnInit {
  private readonly applicationService = inject(ApplicationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toast = inject(Toast);
  private readonly loader = inject(Loader);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly permissionService = inject(PermissionService);

  get canCreate(): boolean { return this.permissionService.hasPermission('APPLICATION_CREATE'); }
  get canUpdate(): boolean { return this.permissionService.hasPermission('APPLICATION_UPDATE'); }
  get canDelete(): boolean { return this.permissionService.hasPermission('APPLICATION_DELETE'); }

  loading = true;
  dialogVisible = false;
  selectedApp: ApplicationDto | null = null;
  applications: ApplicationDto[] = [];

  columns = [
    { field: 'id', header: 'ID', sortable: true },
    { field: 'code', header: 'Código', sortable: true },
    { field: 'name', header: 'Nombre', sortable: true },
    { field: 'description', header: 'Descripción', sortable: true },
    { field: 'statusText', header: 'Estado', sortable: true },
    { field: 'actions', header: 'Acciones', type: 'actions' as const }
  ];

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.loading = true;
    this.applicationService.getApplications().subscribe({
      next: (data) => {
        this.applications = data.map(app => ({
          ...app,
          statusText: app.active ? 'Activo' : 'Inactivo'
        }));
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.toast.error('Error al cargar la lista de aplicaciones');
        console.error('Error listing applications', err);
      }
    });
  }

  showCreateDialog(): void {
    this.selectedApp = null;
    this.dialogVisible = true;
  }

  showEditDialog(app: ApplicationDto): void {
    this.selectedApp = app;
    this.dialogVisible = true;
  }

  guardarApp(app: ApplicationDto): void {
    this.dialogVisible = false;
    this.loader.show();

    if (this.selectedApp && this.selectedApp.id) {
      this.applicationService.updateApplication(this.selectedApp.id, app).subscribe({
        next: () => {
          this.loader.hide();
          this.toast.success('Aplicación actualizada exitosamente');
          this.loadApplications();
        },
        error: (err) => {
          this.loader.hide();
          this.toast.error('Error al actualizar la aplicación');
          console.error(err);
        }
      });
    } else {
      this.applicationService.createApplication(app).subscribe({
        next: () => {
          this.loader.hide();
          this.toast.success('Aplicación creada exitosamente');
          this.loadApplications();
        },
        error: (err) => {
          this.loader.hide();
          this.toast.error('Error al crear la aplicación');
          console.error(err);
        }
      });
    }
  }

  eliminarApp(app: ApplicationDto): void {
    this.confirmationService.confirm({
      header: 'Eliminar Aplicación',
      message: `¿Está seguro de que desea eliminar la aplicación ${app.name}? Esta acción no se puede deshacer.`,
      acceptLabel: 'Confirmar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: {
        severity: 'danger'
      },
      accept: () => {
        this.loader.show();
        this.applicationService.deleteApplication(app.id!).subscribe({
          next: () => {
            this.loader.hide();
            this.toast.success('Aplicación eliminada exitosamente');
            this.loadApplications();
          },
          error: (err: HttpErrorResponse) => {
            this.loader.hide();
            console.error('Delete error', err);
            if (err.status === 400 && err.error?.message) {
              this.toast.error(err.error.message);
            } else {
               this.toast.error('Error al eliminar la aplicación.');
            }
          }
        });
      }
    });
  }
}
