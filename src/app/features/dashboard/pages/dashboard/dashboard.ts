import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { 
  Auth, 
  PageHeaderComponent, 
  PageContentComponent, 
  RassiniI18nService, 
  RassiniTranslatePipe 
} from '@rassini/rassini-ui';
import { DASHBOARD_I18N } from '../../i18n/dashboard.i18n';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    CardModule,
    TagModule,
    TooltipModule,
    PageHeaderComponent,
    PageContentComponent,
    RassiniTranslatePipe
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly auth = inject(Auth);
  readonly i18n = inject(RassiniI18nService);
  
  username = '';

  constructor() {
    // Registrar diccionarios propios del Dashboard de Employee Portal
    this.i18n.registerTranslations('es-MX', DASHBOARD_I18N['es-MX']);
    this.i18n.registerTranslations('en-US', DASHBOARD_I18N['en-US']);
  }

  get displayUsername(): string {
    return this.auth.currentUser()?.username || this.username || this.i18n.translate('employee.dashboard.session.defaultUser', 'Colaborador');
  }

  get displayEmail(): string {
    return this.auth.currentUser()?.email || 'N/A';
  }

  get displayBus(): string {
    // Dependencia reactiva al locale
    this.i18n.currentLang();

    if (this.auth.hasAllBusinessUnits()) {
      return this.i18n.translate('employee.dashboard.session.allBus', 'Todas (ALL)');
    }
    const bus = this.auth.businessUnits();
    if (bus && bus.length > 0) {
      return bus.map((b: any) => b.name || b.code).join(', ');
    }
    return 'N/A';
  }

  get displayRoles(): string {
    const roles = this.auth.roles();
    if (roles && roles.length > 0) {
      return roles.join(', ');
    }
    return 'EMPLOYEE_USER';
  }
  
  readonly newsList = computed(() => {
    this.i18n.currentLang();
    return [
      {
        id: 1,
        title: this.i18n.translate('employee.dashboard.news.item1.title', 'Nueva Política de Trabajo Remoto'),
        summary: this.i18n.translate('employee.dashboard.news.item1.summary', 'Revisa las actualizaciones sobre nuestros días de home office y flexibilidad.'),
        image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=400&q=80',
        date: '2026-09-01'
      }
    ];
  });

  readonly announcements = computed(() => {
    this.i18n.currentLang();
    return [
      { 
        title: this.i18n.translate('employee.dashboard.announcements.item1.title', 'Mantenimiento del ERP'), 
        date: this.i18n.translate('employee.dashboard.announcements.item1.date', 'Esta noche, 22:00 hrs'), 
        content: this.i18n.translate('employee.dashboard.announcements.item1.content', 'El sistema SAP no estará disponible durante 2 horas.') 
      },
      { 
        title: this.i18n.translate('employee.dashboard.announcements.item2.title', 'Encuesta de Clima Laboral'), 
        date: this.i18n.translate('employee.dashboard.announcements.item2.date', 'Hasta el viernes'), 
        content: this.i18n.translate('employee.dashboard.announcements.item2.content', 'Tu opinión es importante, recuerda completarla.') 
      }
    ];
  });

  readonly events = computed(() => {
    this.i18n.currentLang();
    return [
      { 
        title: this.i18n.translate('employee.dashboard.events.item1.title', 'Townhall Q3'), 
        monthBadge: this.i18n.translate('employee.dashboard.events.item1.monthBadge', 'SEP'), 
        dayBadge: this.i18n.translate('employee.dashboard.events.item1.dayBadge', '15'), 
        location: this.i18n.translate('employee.dashboard.events.item1.location', 'Auditorio Principal / Teams') 
      },
      { 
        title: this.i18n.translate('employee.dashboard.events.item2.title', 'Torneo de Fútbol'), 
        monthBadge: this.i18n.translate('employee.dashboard.events.item2.monthBadge', 'SEP'), 
        dayBadge: this.i18n.translate('employee.dashboard.events.item2.dayBadge', '22'), 
        location: this.i18n.translate('employee.dashboard.events.item2.location', 'Canchas Deportivas Sur') 
      }
    ];
  });

  readonly birthdays = computed(() => {
    this.i18n.currentLang();
    return [
      { 
        name: 'Ana Martínez', 
        role: this.i18n.translate('employee.dashboard.birthdays.roles.finance', 'Finanzas'), 
        date: this.i18n.translate('employee.dashboard.birthdays.dates.today', 'Hoy') 
      },
      { 
        name: 'Carlos López', 
        role: this.i18n.translate('employee.dashboard.birthdays.roles.operations', 'Operaciones'), 
        date: this.i18n.translate('employee.dashboard.birthdays.dates.tomorrow', 'Mañana') 
      },
      { 
        name: 'Diana Gómez', 
        role: this.i18n.translate('employee.dashboard.birthdays.roles.it', 'Sistemas'), 
        date: this.i18n.translate('employee.dashboard.birthdays.dates.thursday', 'Jueves') 
      }
    ];
  });

  ngOnInit() {
    this.username = this.auth.currentUser()?.username || 'Colaborador';
  }
}
