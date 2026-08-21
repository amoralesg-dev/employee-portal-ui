import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MenuRequest, MenuResponse } from '../../models/menu.model';
import { ApplicationDto } from '../../services/menu.service';

@Component({
  selector: 'app-menu-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule],
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
    { label: 'pi pi-check', value: 'pi pi-check' },
    { label: 'pi pi-times', value: 'pi pi-times' }
  ];

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(100)]],
      label: ['', [Validators.required, Validators.maxLength(100)]],
      route: ['', Validators.maxLength(200)],
      icon: ['', Validators.maxLength(50)],
      orderIndex: [0, Validators.required],
      parentId: [null],
      applicationId: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    // Filter out the menu itself and its children to prevent circular dependencies
    if (this.menu) {
      this.filteredMenus = this.flatMenus.filter(m => m.id !== this.menu!.id && m.parentId !== this.menu!.id);
      
      this.form.patchValue({
        code: this.menu.code,
        label: this.menu.label,
        route: this.menu.route,
        icon: this.menu.icon,
        orderIndex: this.menu.orderIndex,
        parentId: this.menu.parentId,
        applicationId: this.menu.applicationId
      });
    } else {
      this.filteredMenus = [...this.flatMenus];
    }
  }

  guardar(): void {
    if (this.form.valid) {
      this.save.emit(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
