import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService } from 'primeng/api';
import {
  PageHeaderComponent,
  PageToolbarComponent,
  PageContentComponent,
  RassiniI18nService,
  Toast,
  Loader
} from '@rassini/rassini-ui';
import {
  AdminEventAttendanceSummaryDto,
  AudienceOptionsDto,
  PortalContentCategory,
  PortalContentDto,
  PortalContentStatus,
  PortalContentType
} from '../../models/portal-content.model';
import { DASHBOARD_I18N } from '../../../dashboard/i18n/dashboard.i18n';
import { PortalContentService } from '../../services/portal-content.service';
import { PortalContentFormComponent } from '../../components/portal-content-form/portal-content-form';
import { PermissionService } from '../../../../shared/services/permission.service';

@Component({
  selector: 'app-portal-content-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    TableModule,
    TagModule,
    TooltipModule,
    DialogModule,
    PageHeaderComponent,
    PageToolbarComponent,
    PageContentComponent,
    PortalContentFormComponent
  ],
  templateUrl: './portal-content-list.html'
})
export class PortalContentListPage implements OnInit {
  private readonly contentService = inject(PortalContentService);
  private readonly permissionService = inject(PermissionService);
  private readonly toast = inject(Toast);
  private readonly loader = inject(Loader);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly i18n = inject(RassiniI18nService);

  constructor() {
    this.i18n.registerTranslations('es-MX', DASHBOARD_I18N['es-MX']);
    this.i18n.registerTranslations('en-US', DASHBOARD_I18N['en-US']);
  }

  get canCreate(): boolean { return this.permissionService.hasPermission('PORTAL_CONTENT_CREATE'); }
  get canUpdate(): boolean { return this.permissionService.hasPermission('PORTAL_CONTENT_UPDATE'); }
  get canPublish(): boolean { return this.permissionService.hasPermission('PORTAL_CONTENT_PUBLISH'); }
  get canDelete(): boolean { return this.permissionService.hasPermission('PORTAL_CONTENT_DELETE'); }
  get canUploadMedia(): boolean { return this.permissionService.hasPermission('PORTAL_MEDIA_UPLOAD'); }
  get canReadAttendance(): boolean { return this.permissionService.hasPermission('PORTAL_EVENT_ATTENDANCE_READ'); }

  items: PortalContentDto[] = [];
  audienceOptions: AudienceOptionsDto = { businessUnits: [], roles: [] };
  loading = true;
  saving = false;
  dialogVisible = false;
  selectedItem: PortalContentDto | null = null;

  attendanceDialogVisible = false;
  attendanceLoading = false;
  attendanceEventTitle = '';
  attendanceEventId: number | null = null;
  attendanceSummary: AdminEventAttendanceSummaryDto | null = null;

  filterType: PortalContentType | null = null;
  filterStatus: PortalContentStatus | null = null;
  filterCategory: PortalContentCategory | null = null;
  filterQuery = '';

  get typeOptions() {
    const isEn = this.i18n.currentLang() === 'en-US';
    return [
      { label: isEn ? 'All types' : 'Todos los tipos', value: null },
      { label: this.getTypeLabel('HERO_NEWS'), value: 'HERO_NEWS' },
      { label: this.getTypeLabel('NEWS'), value: 'NEWS' },
      { label: this.getTypeLabel('CAMPAIGN'), value: 'CAMPAIGN' },
      { label: this.getTypeLabel('WEEKLY_INFO'), value: 'WEEKLY_INFO' },
      { label: this.getTypeLabel('EVENT'), value: 'EVENT' },
      { label: this.getTypeLabel('QUICK_ACCESS'), value: 'QUICK_ACCESS' },
      { label: this.getTypeLabel('NOTICE'), value: 'NOTICE' }
    ];
  }

  getTypeLabel(type?: string | null): string {
    if (!type) return '-';
    return this.i18n.translate(`employee.dashboard.types.${type}`, type);
  }

  getCategoryLabel(category?: string | null): string {
    if (!category) return '-';
    return this.i18n.translate(`employee.dashboard.categories.${category}`, category);
  }

  getStatusLabel(status?: string | null): string {
    if (!status) return '-';
    return this.i18n.translate(`employee.dashboard.statuses.${status}`, status);
  }

  get statusOptions() {
    const isEn = this.i18n.currentLang() === 'en-US';
    return [
      { label: isEn ? 'All statuses' : 'Todos los estados', value: null },
      { label: this.getStatusLabel('DRAFT'), value: 'DRAFT' },
      { label: this.getStatusLabel('PUBLISHED'), value: 'PUBLISHED' },
      { label: this.getStatusLabel('INACTIVE'), value: 'INACTIVE' }
    ];
  }

  get categoryOptions() {
    const isEn = this.i18n.currentLang() === 'en-US';
    return [
      { label: isEn ? 'All categories' : 'Todas las categorías', value: null },
      { label: this.getCategoryLabel('SEGURIDAD'), value: 'SEGURIDAD' },
      { label: this.getCategoryLabel('PERSONAS'), value: 'PERSONAS' },
      { label: this.getCategoryLabel('NEGOCIO'), value: 'NEGOCIO' },
      { label: this.getCategoryLabel('CULTURA'), value: 'CULTURA' }
    ];
  }

  ngOnInit(): void {
    this.loadAudienceOptions();
    this.loadItems();
  }

  loadAudienceOptions(): void {
    this.contentService.getAudienceOptions().subscribe({
      next: (opts) => {
        this.audienceOptions = opts;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  loadItems(): void {
    this.loading = true;
    this.contentService.list({
      type: this.filterType,
      status: this.filterStatus,
      category: this.filterCategory,
      q: this.filterQuery,
      page: 0,
      size: 50
    }).subscribe({
      next: (page) => {
        this.items = page.content;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.toast.error('Error al cargar el contenido del portal');
        this.cdr.detectChanges();
      }
    });
  }

  getEsTitle(item: PortalContentDto): string {
    return item.translations?.find(t => t.language === 'es-MX')?.title || '(Sin título)';
  }

  getStatusSeverity(displayStatus?: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (displayStatus) {
      case 'ACTIVE': return 'success';
      case 'SCHEDULED': return 'info';
      case 'EXPIRED': return 'warn';
      case 'INACTIVE': return 'secondary';
      default: return 'warn';
    }
  }

  openCreate(): void {
    this.selectedItem = null;
    this.dialogVisible = true;
  }

  openEdit(item: PortalContentDto): void {
    this.selectedItem = item;
    this.dialogVisible = true;
  }

  openAttendance(item: PortalContentDto): void {
    if (!item.id) return;
    this.attendanceEventId = item.id;
    this.attendanceEventTitle = this.getEsTitle(item);
    this.attendanceSummary = null;
    this.attendanceDialogVisible = true;
    this.loadAttendancePage(0, 10);
  }

  loadAttendancePage(page: number, size: number): void {
    if (!this.attendanceEventId) return;
    this.attendanceLoading = true;
    this.contentService.getEventAttendance(this.attendanceEventId, page, size).subscribe({
      next: (summary) => {
        this.attendanceSummary = summary;
        this.attendanceLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.attendanceLoading = false;
        this.toast.error(err?.error?.message || 'No se pudieron cargar las confirmaciones');
        this.cdr.detectChanges();
      }
    });
  }

  onAttendanceLazyLoad(event: { first?: number | null; rows?: number | null }): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? 10;
    this.loadAttendancePage(Math.floor(first / rows), rows);
  }

  onSave(payload: PortalContentDto): void {
    this.saving = true;
    this.loader.show();
    const obs = this.selectedItem?.id
      ? this.contentService.update(this.selectedItem.id, payload)
      : this.contentService.create(payload);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.dialogVisible = false;
        this.loader.hide();
        this.toast.success(this.selectedItem?.id ? 'Contenido actualizado' : 'Contenido creado en borrador');
        this.loadItems();
      },
      error: (err) => {
        this.saving = false;
        this.loader.hide();
        const fieldErrors = err?.error?.errors as Array<{ field?: string; message?: string }> | undefined;
        if (fieldErrors && fieldErrors.length > 0) {
          const detail = fieldErrors.map(e => e.message || e.field).filter(Boolean).join(' | ');
          this.toast.error(detail || err?.error?.message || 'Error de validación');
        } else {
          this.toast.error(err?.error?.message || 'Error al guardar el contenido');
        }
        this.cdr.detectChanges();
      }
    });
  }

  changeStatus(item: PortalContentDto, status: PortalContentStatus): void {
    if (!item.id) return;
    this.loader.show();
    this.contentService.updateStatus(item.id, status).subscribe({
      next: () => {
        this.loader.hide();
        this.toast.success('Estado actualizado correctamente');
        this.loadItems();
      },
      error: (err) => {
        this.loader.hide();
        this.toast.error(err?.error?.message || 'No se pudo cambiar el estado');
      }
    });
  }

  confirmDelete(item: PortalContentDto): void {
    if (!item.id) return;
    this.confirmationService.confirm({
      header: 'Eliminar contenido',
      message: `¿Desea eliminar "${this.getEsTitle(item)}"?`,
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      accept: () => {
        this.loader.show();
        this.contentService.delete(item.id!).subscribe({
          next: () => {
            this.loader.hide();
            this.toast.success('Contenido eliminado');
            this.loadItems();
          },
          error: (err) => {
            this.loader.hide();
            this.toast.error(err?.error?.message || 'No se pudo eliminar el contenido');
          }
        });
      }
    });
  }
}
