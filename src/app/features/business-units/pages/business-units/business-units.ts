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
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { BusinessUnitService } from '../../services/business-unit.service';
import { BusinessUnitDto } from '../../models/business-unit.model';
import { PermissionService } from '../../../../shared/services/permission.service';
import { BusinessUnitFormComponent } from '../../components/business-unit-form/business-unit-form';
import { BusinessUnitUsersComponent } from '../../components/business-unit-users/business-unit-users';

@Component({
  selector: 'app-business-units',
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
    BusinessUnitFormComponent,
    BusinessUnitUsersComponent,
    TagModule
  ],
  template: `
    <app-page-header
        title="Business Units"
        subtitle="Administración y gestión de unidades de negocio de la corporación">
    </app-page-header>

    <app-page-toolbar>
        <button
            *ngIf="canCreate"
            pButton
            label="Nueva Business Unit"
            icon="pi pi-plus"
            (click)="showCreateDialog()">
        </button>
    </app-page-toolbar>

    <app-page-content>
        <div class="business-units-container">
            <app-data-table
                [columns]="columns"
                [data]="businessUnits"
                [loading]="loading"
                [rows]="10"
                [enableSelection]="false"
                [globalFilterFields]="['id', 'code', 'name', 'parentName', 'statusText']">
                
                <ng-template #actions let-row>
                    <button
                        *ngIf="canUpdate"
                        pButton
                        icon="pi pi-pencil"
                        class="p-button-text"
                        pTooltip="Editar Business Unit"
                        tooltipPosition="top"
                        (click)="showEditDialog(row)">
                    </button>

                    <button
                        *ngIf="canAssignUsers"
                        pButton
                        icon="pi pi-users"
                        class="p-button-text"
                        pTooltip="Asignar Usuarios"
                        tooltipPosition="top"
                        (click)="showAssignUsersDialog(row)">
                    </button>
                    
                    <button
                        *ngIf="canUpdate"
                        pButton
                        [icon]="row.enabled ? 'pi pi-ban' : 'pi pi-check-circle'"
                        [severity]="row.enabled ? 'warn' : 'success'"
                        class="p-button-text"
                        [pTooltip]="row.enabled ? 'Desactivar Business Unit' : 'Activar Business Unit'"
                        tooltipPosition="top"
                        (click)="toggleStatus(row)">
                    </button>

                    <button
                        *ngIf="canDelete"
                        pButton
                        icon="pi pi-trash"
                        severity="danger"
                        class="p-button-text"
                        pTooltip="Eliminar Business Unit"
                        tooltipPosition="top"
                        (click)="eliminarBU(row)">
                    </button>
                </ng-template>
            </app-data-table>
        </div>
    </app-page-content>

    <app-app-dialog
        [(visible)]="formDialogVisible"
        [title]="selectedBU ? 'Editar Business Unit' : 'Nueva Business Unit'"
        width="500px">
        
        <app-business-unit-form
            *ngIf="formDialogVisible"
            [businessUnit]="selectedBU"
            [parentOptions]="parentOptions"
            (save)="guardarBU($event)"
            (cancel)="formDialogVisible = false">
        </app-business-unit-form>
    </app-app-dialog>

    <app-app-dialog
        [(visible)]="usersDialogVisible"
        [title]="'Asignar Usuarios a: ' + (selectedBU?.name || '')"
        width="800px">
        
        <app-business-unit-users
            *ngIf="usersDialogVisible && selectedBU"
            [businessUnitId]="selectedBU.id!"
            (save)="onUsersSaved()"
            (cancel)="usersDialogVisible = false">
        </app-business-unit-users>
    </app-app-dialog>
  `
})
export class BusinessUnits implements OnInit {
  private readonly businessUnitService = inject(BusinessUnitService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toast = inject(Toast);
  private readonly loader = inject(Loader);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly permissionService = inject(PermissionService);

  get canCreate(): boolean { return this.permissionService.hasPermission('BU_CREATE'); }
  get canUpdate(): boolean { return this.permissionService.hasPermission('BU_EDIT'); }
  get canDelete(): boolean { return this.permissionService.hasPermission('BU_DELETE'); }
  get canAssignUsers(): boolean { return this.permissionService.hasPermission('BU_ASSIGN_USERS'); }

  loading = true;
  formDialogVisible = false;
  usersDialogVisible = false;
  selectedBU: BusinessUnitDto | null = null;
  businessUnits: (BusinessUnitDto & { parentName?: string; statusText?: string })[] = [];
  parentOptions: BusinessUnitDto[] = [];

  columns = [
    { field: 'id', header: 'ID', sortable: true },
    { field: 'code', header: 'Código', sortable: true },
    { field: 'name', header: 'Nombre', sortable: true },
    { field: 'parentName', header: 'BU Padre', sortable: true },
    { field: 'statusText', header: 'Estado', sortable: true },
    { field: 'actions', header: 'Acciones', type: 'actions' as const }
  ];

  ngOnInit(): void {
    this.loadBusinessUnits();
  }

  loadBusinessUnits(): void {
    this.loading = true;
    this.businessUnitService.getBusinessUnits().subscribe({
      next: (data) => {
        this.parentOptions = data.filter(bu => bu.enabled);
        this.businessUnits = data.map(bu => {
          const parent = data.find(p => p.id === bu.parentId);
          return {
            ...bu,
            parentName: parent ? parent.name : 'Ninguna',
            statusText: bu.enabled ? 'Activo' : 'Inactivo'
          };
        });
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.toast.error('Error al cargar la lista de Business Units');
        console.error(err);
      }
    });
  }

  showCreateDialog(): void {
    this.selectedBU = null;
    this.formDialogVisible = true;
  }

  showEditDialog(bu: BusinessUnitDto): void {
    this.selectedBU = bu;
    this.formDialogVisible = true;
  }

  showAssignUsersDialog(bu: BusinessUnitDto): void {
    this.selectedBU = bu;
    this.usersDialogVisible = true;
  }

  onUsersSaved(): void {
    this.usersDialogVisible = false;
    this.toast.success('Usuarios asignados exitosamente');
    this.loadBusinessUnits();
  }

  guardarBU(bu: BusinessUnitDto): void {
    this.formDialogVisible = false;
    this.loader.show();

    if (this.selectedBU && this.selectedBU.id) {
      this.businessUnitService.updateBusinessUnit(this.selectedBU.id, bu).subscribe({
        next: () => {
          this.loader.hide();
          this.toast.success('Business Unit actualizada exitosamente');
          this.loadBusinessUnits();
        },
        error: (err) => {
          this.loader.hide();
          this.toast.error('Error al actualizar la Business Unit');
          console.error(err);
        }
      });
    } else {
      this.businessUnitService.createBusinessUnit(bu).subscribe({
        next: () => {
          this.loader.hide();
          this.toast.success('Business Unit creada exitosamente');
          this.loadBusinessUnits();
        },
        error: (err) => {
          this.loader.hide();
          this.toast.error('Error al crear la Business Unit');
          console.error(err);
        }
      });
    }
  }

  toggleStatus(bu: BusinessUnitDto): void {
    const actionText = bu.enabled ? 'desactivar' : 'activar';
    this.confirmationService.confirm({
      header: 'Actualizar Estado',
      message: `¿Está seguro de que desea ${actionText} la Business Unit ${bu.name}?`,
      acceptLabel: 'Confirmar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.loader.show();
        this.businessUnitService.updateStatus(bu.id!, !bu.enabled).subscribe({
          next: () => {
            this.loader.hide();
            this.toast.success(`Business Unit ${bu.enabled ? 'desactivada' : 'activada'} exitosamente`);
            this.loadBusinessUnits();
          },
          error: (err) => {
            this.loader.hide();
            this.toast.error('Error al cambiar el estado de la Business Unit');
            console.error(err);
          }
        });
      }
    });
  }

  eliminarBU(bu: BusinessUnitDto): void {
    this.confirmationService.confirm({
      header: 'Eliminar Business Unit',
      message: `¿Está seguro de que desea eliminar físicamente la Business Unit ${bu.name}? Esta acción no se puede deshacer.`,
      acceptLabel: 'Confirmar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      accept: () => {
        this.loader.show();
        this.businessUnitService.deleteBusinessUnit(bu.id!).subscribe({
          next: () => {
            this.loader.hide();
            this.toast.success('Business Unit eliminada exitosamente');
            this.loadBusinessUnits();
          },
          error: (err: any) => {
            this.loader.hide();
            if (err.status === 400 && err.error?.message) {
              this.toast.error(err.error.message);
            } else {
              this.toast.error('No se pudo eliminar la Business Unit. Asegúrese de que no tenga usuarios ni sub-unidades asociadas.');
            }
            console.error('Delete error', err);
          }
        });
      }
    });
  }
}
