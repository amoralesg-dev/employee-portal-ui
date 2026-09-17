import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { MenuRequest, MenuResponse, TargetType, AppType, AuthType } from '../../models/menu.model';
import { ApplicationDto, MenuService, PlaceholderDto } from '../../services/menu.service';

@Component({
  selector: 'app-menu-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    CheckboxModule,
    TooltipModule
  ],
  templateUrl: './menu-form.html'
})
export class MenuForm implements OnInit {
  @Input() menu: MenuResponse | null = null;
  @Input() flatMenus: MenuResponse[] = [];
  @Input() applications: ApplicationDto[] = [];
  
  @Output() save = new EventEmitter<MenuRequest>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  filteredMenus: MenuResponse[] = [];
  placeholders: PlaceholderDto[] = [];

  targetTypes = [
    { label: 'Interno (Ruta Angular)', value: 'INTERNO' },
    { label: 'Externo (URL Externa)', value: 'EXTERNO' }
  ];

  appTypes = [
    { label: 'Interna Rassini', value: 'INTERNA' },
    { label: 'Tercero', value: 'TERCERO' },
    { label: 'SaaS', value: 'SAAS' }
  ];

  authTypes = [
    { label: 'Ninguna (Pública / Anónima)', value: 'NONE' },
    { label: 'SSO IAM Corporativo', value: 'SSO_IAM' },
    { label: 'OpenID Connect (OIDC)', value: 'OIDC' },
    { label: 'Credenciales Propias', value: 'CREDENCIALES_PROPIAS' }
  ];

  iconList = [
    { label: 'pi pi-home', value: 'pi pi-home' },
    { label: 'pi pi-users', value: 'pi pi-users' },
    { label: 'pi pi-user', value: 'pi pi-user' },
    { label: 'pi pi-lock', value: 'pi pi-lock' },
    { label: 'pi pi-shield', value: 'pi pi-shield' },
    { label: 'pi pi-cog', value: 'pi pi-cog' },
    { label: 'pi pi-folder', value: 'pi pi-folder' },
    { label: 'pi pi-chart-bar', value: 'pi pi-chart-bar' },
    { label: 'pi pi-list', value: 'pi pi-list' },
    { label: 'pi pi-building', value: 'pi pi-building' },
    { label: 'pi pi-sitemap', value: 'pi pi-sitemap' },
    { label: 'pi pi-external-link', value: 'pi pi-external-link' },
    { label: 'pi pi-credit-card', value: 'pi pi-credit-card' },
    { label: 'pi pi-check', value: 'pi pi-check' },
    { label: 'pi pi-times', value: 'pi pi-times' }
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly menuService: MenuService
  ) {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(100)]],
      label: ['', [Validators.required, Validators.maxLength(100)]],
      route: ['', Validators.maxLength(200)],
      icon: ['', Validators.maxLength(50)],
      orderIndex: [0, Validators.required],
      parentId: [null],
      applicationId: [null, Validators.required],
      targetType: ['INTERNO', Validators.required],
      externalUrl: ['', Validators.maxLength(500)],
      openInNewTab: [false],
      appType: ['INTERNA', Validators.required],
      authType: ['NONE', Validators.required],
      parameters: this.fb.array([])
    });

    // Validaciones dinámicas según targetType
    this.form.get('targetType')?.valueChanges.subscribe((val: TargetType) => {
      const extControl = this.form.get('externalUrl');
      const routeControl = this.form.get('route');
      if (val === 'EXTERNO') {
        extControl?.setValidators([Validators.required, Validators.maxLength(500)]);
        routeControl?.clearValidators();
      } else {
        extControl?.clearValidators();
        routeControl?.setValidators([Validators.maxLength(200)]);
      }
      extControl?.updateValueAndValidity();
      routeControl?.updateValueAndValidity();
    });
  }

  get parametersArray(): FormArray {
    return this.form.get('parameters') as FormArray;
  }

  get isExternal(): boolean {
    return this.form.get('targetType')?.value === 'EXTERNO';
  }

  addParameter(paramName: string = '', paramValue: string = ''): void {
    const paramGroup = this.fb.group({
      paramName: [paramName, [Validators.required, Validators.maxLength(100)]],
      paramValue: [paramValue, [Validators.required, Validators.maxLength(255)]],
      active: [true]
    });
    this.parametersArray.push(paramGroup);
  }

  removeParameter(index: number): void {
    this.parametersArray.removeAt(index);
  }

  ngOnInit(): void {
    this.loadPlaceholders();

    if (this.menu) {
      this.filteredMenus = this.flatMenus.filter(m => m.id !== this.menu!.id && m.parentId !== this.menu!.id);
      
      this.form.patchValue({
        code: this.menu.code,
        label: this.menu.label,
        route: this.menu.route,
        icon: this.menu.icon,
        orderIndex: this.menu.orderIndex,
        parentId: this.menu.parentId,
        applicationId: this.menu.applicationId,
        targetType: this.menu.targetType || 'INTERNO',
        externalUrl: this.menu.externalUrl || '',
        openInNewTab: this.menu.openInNewTab || false,
        appType: this.menu.appType || 'INTERNA',
        authType: this.menu.authType || 'NONE'
      });

      if (this.menu.parameters && this.menu.parameters.length > 0) {
        this.menu.parameters.forEach(p => {
          this.addParameter(p.paramName, p.paramValue);
        });
      }
    } else {
      this.filteredMenus = [...this.flatMenus];
    }
  }

  loadPlaceholders(): void {
    this.menuService.getPlaceholders().subscribe({
      next: (list) => {
        this.placeholders = list;
      },
      error: (err) => {
        console.error('Error cargando catálogo de placeholders:', err);
      }
    });
  }

  getPlaceholderDescription(value: string): string | null {
    if (!value) return null;
    const found = this.placeholders.find(p => p.placeholder === value || p.code === value);
    return found ? found.description : null;
  }

  guardar(): void {
    if (this.form.valid) {
      this.save.emit(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
