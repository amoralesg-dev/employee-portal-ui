import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  Auth,
  PageHeaderComponent,
  PageContentComponent,
  RassiniI18nService,
  RassiniTranslatePipe
} from '@rassini/rassini-ui';
import { DASHBOARD_I18N } from '../../i18n/dashboard.i18n';
import { HomeService } from '../../services/home.service';
import { HomeItemDto, HomeResponseDto } from '../../models/home.model';
import { SecureImageDirective } from '../../../../shared/directives/secure-image.directive';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PageHeaderComponent,
    PageContentComponent,
    RassiniTranslatePipe,
    SecureImageDirective
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  private readonly auth = inject(Auth);
  private readonly homeService = inject(HomeService);
  private readonly router = inject(Router);
  readonly i18n = inject(RassiniI18nService);

  readonly loading = signal(true);
  readonly home = signal<HomeResponseDto | null>(null);

  constructor() {
    this.i18n.registerTranslations('es-MX', DASHBOARD_I18N['es-MX']);
    this.i18n.registerTranslations('en-US', DASHBOARD_I18N['en-US']);

    effect(() => {
      const lang = this.i18n.currentLang();
      this.loadHome(lang);
    });
  }

  readonly greetingPrefix = computed(() => {
    this.i18n.currentLang();
    const hour = new Date().getHours();
    if (hour < 12) {
      return this.i18n.translate('employee.dashboard.greeting.morning', 'Buenos días');
    }
    if (hour < 19) {
      return this.i18n.translate('employee.dashboard.greeting.afternoon', 'Buenas tardes');
    }
    return this.i18n.translate('employee.dashboard.greeting.evening', 'Buenas noches');
  });

  get displayUsername(): string {
    const user = this.auth.currentUser() as { displayName?: string | null; username?: string | null } | null;
    const displayName = user?.displayName?.trim();
    if (displayName) {
      return displayName;
    }
    const username = user?.username?.trim();
    if (username) {
      return username;
    }
    return this.i18n.translate('employee.dashboard.greeting.defaultUser', 'Colaborador');
  }

  getCategoryLabel(category?: string | null): string {
    if (!category) return '';
    return this.i18n.translate(`employee.dashboard.categories.${category}`, category);
  }

  getQuickGridClass(count: number): string {
    if (count <= 1) return 'ep-quick-grid ep-quick-grid--count-1';
    if (count === 2) return 'ep-quick-grid ep-quick-grid--count-2';
    if (count === 3) return 'ep-quick-grid ep-quick-grid--count-3';
    return 'ep-quick-grid ep-quick-grid--count-4';
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

  readonly hasAnyContent = computed(() => {
    const data = this.home();
    if (!data) return false;
    return !!(
      data.hero ||
      data.secondaryNews.length ||
      data.quickAccess.length ||
      data.campaigns.length ||
      data.weeklyInfo.length ||
      data.events.length ||
      data.notices.length
    );
  });

  ngOnInit(): void {
    // Carga inicial disparada por effect() con el idioma activo
  }

  private loadHome(lang: string): void {
    this.loading.set(true);
    this.homeService.getHome(lang).subscribe({
      next: (data) => {
        this.home.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.home.set(null);
        this.loading.set(false);
      }
    });
  }

  isActionable(item: HomeItemDto): boolean {
    return !!(item.type === 'EVENT' || item.hasBody || item.link?.url);
  }

  openItem(item: HomeItemDto): void {
    if (item.type === 'EVENT' || item.hasBody) {
      this.router.navigate(['/dashboard/contenido', item.id]);
      return;
    }
    const url = item.link?.url;
    if (!url) return;
    if (url.startsWith('/')) {
      this.router.navigateByUrl(url);
    } else if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, item.link?.newTab ? '_blank' : '_self', 'noopener,noreferrer');
    }
  }
}
