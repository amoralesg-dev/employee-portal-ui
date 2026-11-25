import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import {
  PageHeaderComponent,
  PageContentComponent,
  RassiniI18nService,
  RassiniTranslatePipe,
  Toast
} from '@rassini/rassini-ui';
import { HomeService } from '../../services/home.service';
import { EventAttendanceDto, EventAttendanceStatus, HomeItemDto } from '../../models/home.model';
import { SecureImageDirective } from '../../../../shared/directives/secure-image.directive';
import { DASHBOARD_I18N } from '../../i18n/dashboard.i18n';

@Component({
  selector: 'app-home-content-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    PageHeaderComponent,
    PageContentComponent,
    RassiniTranslatePipe,
    SecureImageDirective
  ],
  template: `
    <app-page-header
      [title]="item()?.title || ('employee.dashboard.detail.title' | ruiTranslate:'Detalle')"
      icon="pi pi-file">
    </app-page-header>
    <app-page-content>
      <div class="mb-4">
        <p-button
          [label]="'employee.dashboard.detail.back' | ruiTranslate:'Volver al inicio'"
          icon="pi pi-arrow-left"
          severity="secondary"
          (onClick)="goBack()" />
      </div>

      @if (loading()) {
        <div class="ep-empty">
          <i class="pi pi-spin pi-spinner"></i>
          <p>{{ 'employee.dashboard.loading' | ruiTranslate:'Cargando contenido...' }}</p>
        </div>
      } @else if (item(); as detail) {
        <article class="ep-detail">
          @if (detail.category) {
            <span class="ep-cat-badge ep-cat-badge--{{ detail.category }}">{{ getCategoryLabel(detail.category) }}</span>
          }
          <h1 class="ep-detail__title">{{ detail.title }}</h1>

          @if (detail.type === 'EVENT' && detail.event?.start) {
            <div class="flex flex-wrap gap-4 text-sm" style="color: var(--ep-text-muted);">
              <span>
                <i class="pi pi-calendar mr-1" style="color: var(--ep-accent);"></i>
                {{ detail.event?.start | date:'mediumDate' }} · {{ formatEventTime(detail.event?.start, detail.event?.end) }}
              </span>
              @if (detail.event?.location) {
                <span>
                  <i class="pi pi-map-marker mr-1" style="color: var(--ep-accent);"></i>
                  {{ detail.event?.location }}
                </span>
              }
            </div>
          }

          @if (detail.imageId) {
            <img [appSecureImage]="detail.imageId" [alt]="detail.title" class="ep-detail__img" />
          }
          @if (detail.summary) {
            <p class="ep-hero__summary"><strong>{{ detail.summary }}</strong></p>
          }
          @if (detail.body) {
            <p class="ep-detail__paragraph">{{ detail.body }}</p>
          }

          <div class="ep-event-actions">
            @if (detail.type === 'EVENT' && detail.event?.teamsUrl) {
              <p-button
                [label]="'employee.dashboard.event.joinTeams' | ruiTranslate:'Unirse por Teams'"
                icon="pi pi-video"
                (onClick)="joinTeams(detail)" />
            }
            @if (detail.type === 'EVENT' && detail.event?.start) {
              <p-button
                [label]="'employee.dashboard.event.addToCalendar' | ruiTranslate:'Agregar al calendario'"
                icon="pi pi-calendar-plus"
                styleClass="ep-btn-calendar"
                [loading]="downloadingCalendar()"
                [disabled]="downloadingCalendar()"
                (onClick)="downloadCalendar(detail)" />
            }
            @if (detail.link?.url) {
              <p-button
                [label]="detail.link?.label || ('employee.dashboard.openLink' | ruiTranslate:'Abrir enlace')"
                icon="pi pi-external-link"
                [severity]="detail.type === 'EVENT' ? 'secondary' : 'primary'"
                (onClick)="openLink(detail)" />
            }
          </div>

          @if (detail.type === 'EVENT') {
            <section class="ep-rsvp">
              <h3 class="ep-rsvp__title">{{ 'employee.dashboard.event.rsvpTitle' | ruiTranslate:'¿Asistirás?' }}</h3>
              <div class="ep-rsvp__actions">
                <p-button
                  [label]="'employee.dashboard.event.rsvpGoing' | ruiTranslate:'Sí, asistiré'"
                  icon="pi pi-check"
                  severity="success"
                  styleClass="ep-rsvp-btn"
                  [outlined]="attendance()?.status !== 'GOING'"
                  [disabled]="savingAttendance() || (attendance() !== null && !attendance()!.canRespond)"
                  [loading]="savingAttendance() && pendingStatus() === 'GOING'"
                  (onClick)="respondAttendance('GOING')" />
                <p-button
                  [label]="'employee.dashboard.event.rsvpNotGoing' | ruiTranslate:'No podré asistir'"
                  icon="pi pi-times"
                  severity="danger"
                  styleClass="ep-rsvp-btn"
                  [outlined]="attendance()?.status !== 'NOT_GOING'"
                  [disabled]="savingAttendance() || (attendance() !== null && !attendance()!.canRespond)"
                  [loading]="savingAttendance() && pendingStatus() === 'NOT_GOING'"
                  (onClick)="respondAttendance('NOT_GOING')" />
              </div>
              @if (attendance() !== null && !attendance()!.canRespond) {
                <p class="ep-rsvp__note">{{ 'employee.dashboard.event.rsvpClosed' | ruiTranslate:'Este evento ya no admite cambios en tu confirmación.' }}</p>
              }
            </section>
          }
        </article>
      } @else {
        <div class="ep-empty">
          <i class="pi pi-info-circle"></i>
          <p>{{ 'employee.dashboard.detail.notFound' | ruiTranslate:'El contenido no está disponible o ha expirado.' }}</p>
        </div>
      }
    </app-page-content>
  `
})
export class HomeContentDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly homeService = inject(HomeService);
  private readonly toast = inject(Toast);
  readonly i18n = inject(RassiniI18nService);

  readonly item = signal<HomeItemDto | null>(null);
  readonly loading = signal(true);
  readonly attendance = signal<EventAttendanceDto | null>(null);
  readonly savingAttendance = signal(false);
  readonly pendingStatus = signal<EventAttendanceStatus | null>(null);
  readonly downloadingCalendar = signal(false);
  private readonly contentId = signal(0);

  constructor() {
    this.i18n.registerTranslations('es-MX', DASHBOARD_I18N['es-MX']);
    this.i18n.registerTranslations('en-US', DASHBOARD_I18N['en-US']);

    effect(() => {
      const id = this.contentId();
      const lang = this.i18n.currentLang();
      if (id > 0) {
        this.load(id, lang);
      }
    });
  }

  ngOnInit(): void {
    const idParam = Number(this.route.snapshot.paramMap.get('id'));
    if (idParam > 0) {
      this.contentId.set(idParam);
    } else {
      this.loading.set(false);
    }
  }

  private load(id: number, lang: string): void {
    this.loading.set(true);
    this.homeService.getDetail(id, lang).subscribe({
      next: (data) => {
        this.item.set(data);
        this.loading.set(false);
        if (data.type === 'EVENT') {
          this.loadAttendance(data.id);
        } else {
          this.attendance.set(null);
        }
      },
      error: () => {
        this.item.set(null);
        this.attendance.set(null);
        this.loading.set(false);
      }
    });
  }

  private loadAttendance(id: number): void {
    this.homeService.getMyAttendance(id).subscribe({
      next: (att) => this.attendance.set(att),
      error: () => this.attendance.set(null)
    });
  }

  getCategoryLabel(category?: string | null): string {
    if (!category) return '';
    return this.i18n.translate(`employee.dashboard.categories.${category}`, category);
  }

  formatEventTime(start?: string | null, end?: string | null): string {
    if (!start) return '';
    const locale = this.i18n.currentLang() || 'es-MX';
    const formatter = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' });
    const startDate = new Date(start);
    if (Number.isNaN(startDate.getTime())) return '';
    const startText = formatter.format(startDate);
    if (!end) return startText;
    const endDate = new Date(end);
    if (Number.isNaN(endDate.getTime())) return startText;
    return `${startText} - ${formatter.format(endDate)}`;
  }

  joinTeams(detail: HomeItemDto): void {
    const url = detail.event?.teamsUrl;
    if (!url || !url.startsWith('https://')) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  downloadCalendar(detail: HomeItemDto): void {
    if (this.downloadingCalendar()) return;
    this.downloadingCalendar.set(true);
    this.homeService.downloadCalendar(detail.id, this.i18n.currentLang()).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `evento-${detail.id}.ics`;
        link.click();
        URL.revokeObjectURL(objectUrl);
        this.downloadingCalendar.set(false);
      },
      error: () => {
        this.downloadingCalendar.set(false);
        this.toast.error('No se pudo descargar el archivo del calendario');
      }
    });
  }

  respondAttendance(status: EventAttendanceStatus): void {
    const detail = this.item();
    if (!detail || detail.type !== 'EVENT' || this.savingAttendance()) return;
    if (this.attendance() !== null && !this.attendance()!.canRespond) return;

    this.savingAttendance.set(true);
    this.pendingStatus.set(status);
    this.homeService.upsertMyAttendance(detail.id, status).subscribe({
      next: (res) => {
        this.attendance.set(res);
        this.savingAttendance.set(false);
        this.pendingStatus.set(null);
        this.toast.success(this.i18n.translate('employee.dashboard.event.rsvpSaved', 'Respuesta guardada'));
      },
      error: (err) => {
        this.savingAttendance.set(false);
        this.pendingStatus.set(null);
        this.toast.error(err?.error?.message || 'No se pudo guardar tu respuesta');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  openLink(detail: HomeItemDto): void {
    const url = detail.link?.url;
    if (!url) return;
    if (url.startsWith('/')) {
      this.router.navigateByUrl(url);
    } else if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, detail.link?.newTab ? '_blank' : '_self', 'noopener,noreferrer');
    }
  }
}
