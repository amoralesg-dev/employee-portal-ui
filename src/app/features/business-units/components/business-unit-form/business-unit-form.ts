import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { BusinessUnitDto } from '../../models/business-unit.model';

@Component({
  selector: 'app-business-unit-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    ButtonModule, 
    InputTextModule, 
    ToggleSwitchModule,
    SelectModule
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="guardar()" class="flex flex-col gap-4">
      <div class="field flex flex-col gap-1">
        <label for="code" class="font-medium">Código</label>
        <input id="code" pInputText formControlName="code" placeholder="CORP, FRENOS, etc." class="w-full" />
        <small class="text-red-500" *ngIf="form.get('code')?.touched && form.get('code')?.invalid">
          El código es requerido (máx. 50 caracteres).
        </small>
      </div>

      <div class="field flex flex-col gap-1">
        <label for="name" class="font-medium">Nombre</label>
        <input id="name" pInputText formControlName="name" placeholder="Ingrese nombre descriptivo" class="w-full" />
        <small class="text-red-500" *ngIf="form.get('name')?.touched && form.get('name')?.invalid">
          El nombre es requerido (máx. 150 caracteres).
        </small>
      </div>

      <div class="field flex flex-col gap-1">
        <label for="parentId" class="font-medium">Business Unit Padre</label>
        <p-select 
          id="parentId" 
          [options]="parentOptions" 
          formControlName="parentId" 
          optionLabel="name" 
          optionValue="id" 
          placeholder="Seleccione BU padre (opcional)" 
          [showClear]="true" 
          styleClass="w-full"
          appendTo="body">
        </p-select>
      </div>

      <div class="field flex align-items-center gap-2 mt-2">
        <p-toggleSwitch id="enabled" formControlName="enabled"></p-toggleSwitch>
        <label for="enabled" class="font-medium cursor-pointer">Activo / Operacional</label>
      </div>

      <div class="actions flex justify-end gap-2 mt-4">
        <p-button label="Cancelar" severity="secondary" (click)="cancel.emit()" type="button"></p-button>
        <p-button label="Guardar" type="submit" [disabled]="form.invalid"></p-button>
      </div>
    </form>
  `
})
export class BusinessUnitFormComponent implements OnInit {
  private fb = inject(FormBuilder);

  @Input() set businessUnit(val: BusinessUnitDto | null) {
    if (val) {
      this.form.patchValue({
        id: val.id,
        code: val.code,
        name: val.name,
        parentId: val.parentId,
        enabled: val.enabled
      });
    } else {
      this.form.reset({ enabled: true });
    }
  }

  @Input() parentOptions: BusinessUnitDto[] = [];
  @Output() save = new EventEmitter<BusinessUnitDto>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup = this.fb.group({
    id: [null],
    code: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    parentId: [null],
    enabled: [true, Validators.required]
  });

  ngOnInit(): void {}

  guardar() {
    if (this.form.valid) {
      this.save.emit(this.form.value as BusinessUnitDto);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
