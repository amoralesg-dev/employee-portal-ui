import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { TabsModule } from 'primeng/tabs';
import { RassiniI18nService, Toast } from '@rassini/rassini-ui';
import { DASHBOARD_I18N } from '../../../dashboard/i18n/dashboard.i18n';
import {
  AudienceOptionsDto,
  PortalContentCategory,
  PortalContentDto,
  PortalContentType
} from '../../models/portal-content.model';
import { PortalMediaService } from '../../services/portal-media.service';
import { SecureImageDirective } from '../../../../shared/directives/secure-image.directive';

@Component({
  selector: 'app-portal-content-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    MultiSelectModule,
    InputNumberModule,
    CheckboxModule,
    TabsModule,
    SecureImageDirective
  ],
  templateUrl: './portal-content-form.html'
})
export class PortalContentFormComponent implements OnChanges {
  @Input() content: PortalContentDto | null = null;
  @Input() audienceOptions: AudienceOptionsDto = { businessUnits: [], roles: [] };
  @Input() canUploadMedia = false;
  @Input() saving = false;

  @Output() save = new EventEmitter<PortalContentDto>();
  @Output() cancel = new EventEmitter<void>();

  private readonly mediaService = inject(PortalMediaService);
  private readonly toast = inject(Toast);
  readonly i18n = inject(RassiniI18nService);

  constructor() {
    this.i18n.registerTranslations('es-MX', DASHBOARD_I18N['es-MX']);
    this.i18n.registerTranslations('en-US', DASHBOARD_I18N['en-US']);
  }

  uploading = false;
  pendingFile: File | null = null;
  localPreviewUrl: string | null = null;

  get typeOptions(): { label: string; value: PortalContentType }[] {
    return [
      { label: this.i18n.translate('employee.dashboard.types.HERO_NEWS', 'Noticia principal'), value: 'HERO_NEWS' },
      { label: this.i18n.translate('employee.dashboard.types.NEWS', 'Noticia'), value: 'NEWS' },
      { label: this.i18n.translate('employee.dashboard.types.CAMPAIGN', 'Campaña'), value: 'CAMPAIGN' },
      { label: this.i18n.translate('employee.dashboard.types.WEEKLY_INFO', 'Lo que necesitas saber esta semana'), value: 'WEEKLY_INFO' },
      { label: this.i18n.translate('employee.dashboard.types.EVENT', 'Evento'), value: 'EVENT' },
      { label: this.i18n.translate('employee.dashboard.types.QUICK_ACCESS', 'Acceso rápido'), value: 'QUICK_ACCESS' },
      { label: this.i18n.translate('employee.dashboard.types.NOTICE', 'Aviso'), value: 'NOTICE' }
    ];
  }

  get categoryOptions(): { label: string; value: PortalContentCategory | null }[] {
    return [
      { label: this.i18n.currentLang() === 'en-US' ? 'No category' : 'Sin categoría', value: null },
      { label: this.i18n.translate('employee.dashboard.categories.SEGURIDAD', 'Seguridad'), value: 'SEGURIDAD' },
      { label: this.i18n.translate('employee.dashboard.categories.PERSONAS', 'Personas'), value: 'PERSONAS' },
      { label: this.i18n.translate('employee.dashboard.categories.NEGOCIO', 'Negocio'), value: 'NEGOCIO' },
      { label: this.i18n.translate('employee.dashboard.categories.CULTURA', 'Cultura'), value: 'CULTURA' }
    ];
  }

  private readonly baseIconOptions: { label: string; value: string | null }[] = [
    { label: 'Sin ícono', value: null },
    { label: 'Comunicación', value: 'pi pi-megaphone' },
    { label: 'Calendario', value: 'pi pi-calendar' },
    { label: 'Aviso', value: 'pi pi-bell' },
    { label: 'Personas', value: 'pi pi-users' },
    { label: 'Bienestar', value: 'pi pi-heart' },
    { label: 'Seguridad', value: 'pi pi-exclamation-triangle' },
    { label: 'Negocio', value: 'pi pi-briefcase' },
    { label: 'Empresa', value: 'pi pi-building' },
    { label: 'Documento', value: 'pi pi-file' },
    { label: 'Enlace', value: 'pi pi-link' },
    { label: 'Video', value: 'pi pi-video' },
    { label: 'Destacado', value: 'pi pi-star' },
    { label: 'Resultados', value: 'pi pi-chart-bar' },
    { label: 'Información', value: 'pi pi-info-circle' }
  ];

  iconOptions: { label: string; value: string | null }[] = [...this.baseIconOptions];
  form = this.createEmptyForm();

  get showCategory(): boolean {
    return this.form.contentType !== 'QUICK_ACCESS' && this.form.contentType !== 'NOTICE';
  }

  get showImage(): boolean {
    return this.form.contentType === 'HERO_NEWS'
      || this.form.contentType === 'NEWS'
      || this.form.contentType === 'CAMPAIGN'
      || this.form.contentType === 'EVENT';
  }

  get showIcon(): boolean {
    return this.form.contentType === 'QUICK_ACCESS';
  }

  get showEventFields(): boolean {
    return this.form.contentType === 'EVENT';
  }

  get showBody(): boolean {
    return this.form.contentType !== 'QUICK_ACCESS';
  }

  get showLinkLabel(): boolean {
    return this.form.contentType !== 'QUICK_ACCESS';
  }

  onContentTypeChange(): void {
    if (!this.showCategory) {
      this.form.category = null;
    }
    if (!this.showImage) {
      this.form.imageId = null;
    }
    if (!this.showIcon) {
      this.form.icon = null;
    }
    if (!this.showEventFields) {
      this.form.eventStart = '';
      this.form.eventEnd = '';
      this.form.eventLocation = '';
      this.form.teamsUrl = '';
    }
  }

  ngOnChanges(): void {
    this.iconOptions = [...this.baseIconOptions];
    if (!this.content) {
      this.form = this.createEmptyForm();
      return;
    }
    const existingIcon = this.content.icon?.trim() || null;
    if (existingIcon && !this.iconOptions.some(o => o.value === existingIcon)) {
      this.iconOptions = [...this.baseIconOptions, { label: `Actual (${existingIcon})`, value: existingIcon }];
    }
    const es = this.content.translations?.find(t => t.language === 'es-MX');
    const en = this.content.translations?.find(t => t.language === 'en-US');
    this.form = {
      contentType: this.content.contentType,
      category: this.content.category ?? null,
      priority: this.content.priority ?? 100,
      publishFrom: this.toInputDateTime(this.content.publishFrom),
      publishTo: this.toInputDateTime(this.content.publishTo),
      imageId: this.content.imageId ?? null,
      linkUrl: this.content.linkUrl ?? '',
      linkNewTab: !!this.content.linkNewTab,
      icon: existingIcon,
      eventStart: this.toInputDateTime(this.content.event?.start),
      eventEnd: this.toInputDateTime(this.content.event?.end),
      eventLocation: this.content.event?.location ?? '',
      teamsUrl: this.content.event?.teamsUrl ?? '',
      businessUnitIds: [...(this.content.businessUnitIds ?? [])],
      roleIds: [...(this.content.roleIds ?? [])],
      esTitle: es?.title ?? '',
      esSummary: es?.summary ?? '',
      esBody: es?.body ?? '',
      esLinkLabel: es?.linkLabel ?? '',
      enTitle: en?.title ?? '',
      enSummary: en?.summary ?? '',
      enBody: en?.body ?? '',
      enLinkLabel: en?.linkLabel ?? ''
    };
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      this.toast.error('La imagen excede el tamaño máximo de 5 MB');
      input.value = '';
      return;
    }
    this.clearLocalPreview();
    this.pendingFile = file;
    this.localPreviewUrl = URL.createObjectURL(file);
    input.value = '';
  }

  removeImage(): void {
    this.clearLocalPreview();
    this.pendingFile = null;
    this.form.imageId = null;
  }

  private clearLocalPreview(): void {
    if (this.localPreviewUrl) {
      URL.revokeObjectURL(this.localPreviewUrl);
      this.localPreviewUrl = null;
    }
  }

  submit(): void {
    if (this.uploading || this.saving) return;
    if (!this.form.esTitle.trim()) {
      this.toast.error('El título en español (es-MX) es obligatorio');
      return;
    }
    if (this.form.linkUrl.trim().length > 2000) {
      this.toast.error('La URL del enlace no debe exceder 2000 caracteres');
      return;
    }
    if (this.form.contentType === 'QUICK_ACCESS' && !this.form.linkUrl.trim()) {
      this.toast.error('El enlace es obligatorio para un Acceso rápido');
      return;
    }
    if (this.form.contentType === 'EVENT') {
      if (!this.form.eventStart) {
        this.toast.error('La fecha de inicio del evento es obligatoria');
        return;
      }
      if (this.form.eventEnd && this.form.eventEnd < this.form.eventStart) {
        this.toast.error('La fecha de fin del evento no puede ser anterior al inicio');
        return;
      }
      const teams = this.form.teamsUrl.trim();
      if (teams && (!teams.startsWith('https://') || teams.length > 2000)) {
        this.toast.error('El enlace de Microsoft Teams debe usar HTTPS y no exceder 2000 caracteres');
        return;
      }
    }
    if (this.form.publishFrom && this.form.publishTo && this.form.publishTo < this.form.publishFrom) {
      this.toast.error('La vigencia hasta no puede ser anterior a la vigencia desde');
      return;
    }

    if (this.showImage && this.pendingFile) {
      this.uploading = true;
      this.mediaService.upload(this.pendingFile).subscribe({
        next: (media) => {
          this.form.imageId = media.id;
          this.pendingFile = null;
          this.clearLocalPreview();
          this.uploading = false;
          this.emitPayload();
        },
        error: (err) => {
          this.uploading = false;
          this.toast.error(err?.error?.message || 'Error al subir la imagen');
        }
      });
      return;
    }

    this.emitPayload();
  }

  private emitPayload(): void {

    const translations: PortalContentDto['translations'] = [
      {
        language: 'es-MX',
        title: this.form.esTitle.trim(),
        summary: this.form.esSummary.trim() || null,
        body: this.showBody ? (this.form.esBody || null) : null,
        linkLabel: this.showLinkLabel ? (this.form.esLinkLabel.trim() || null) : null
      }
    ];
    if (this.form.enTitle.trim()) {
      translations.push({
        language: 'en-US',
        title: this.form.enTitle.trim(),
        summary: this.form.enSummary.trim() || null,
        body: this.showBody ? (this.form.enBody || null) : null,
        linkLabel: this.showLinkLabel ? (this.form.enLinkLabel.trim() || null) : null
      });
    }

    const payload: PortalContentDto = {
      contentType: this.form.contentType,
      category: this.showCategory ? this.form.category : null,
      priority: this.form.priority ?? 100,
      publishFrom: this.form.publishFrom || null,
      publishTo: this.form.publishTo || null,
      imageId: this.showImage ? this.form.imageId : null,
      linkUrl: this.form.linkUrl.trim() || null,
      linkNewTab: this.form.linkNewTab,
      icon: this.showIcon && this.form.icon ? this.form.icon.trim() : null,
      event: this.showEventFields
        ? {
            start: this.form.eventStart || null,
            end: this.form.eventEnd || null,
            location: this.form.eventLocation.trim() || null,
            teamsUrl: this.form.teamsUrl.trim() || null
          }
        : null,
      businessUnitIds: this.form.businessUnitIds,
      roleIds: this.form.roleIds,
      translations
    };
    this.save.emit(payload);
  }

  private createEmptyForm() {
    return {
      contentType: 'NEWS' as PortalContentType,
      category: null as PortalContentCategory | null,
      priority: 100,
      publishFrom: '',
      publishTo: '',
      imageId: null as number | null,
      linkUrl: '',
      linkNewTab: false,
      icon: null as string | null,
      eventStart: '',
      eventEnd: '',
      eventLocation: '',
      teamsUrl: '',
      businessUnitIds: [] as number[],
      roleIds: [] as number[],
      esTitle: '',
      esSummary: '',
      esBody: '',
      esLinkLabel: '',
      enTitle: '',
      enSummary: '',
      enBody: '',
      enLinkLabel: ''
    };
  }

  private toInputDateTime(val?: string | null): string {
    if (!val) return '';
    return val.length >= 16 ? val.substring(0, 16) : val;
  }
}
