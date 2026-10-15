import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PickListModule } from 'primeng/picklist';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TabsModule } from 'primeng/tabs';
import { ConfirmationService } from 'primeng/api';
import { RoleResponse, UserResponse } from '../../models/usuario.model';
import { UsuarioService } from '../../services/usuario.service';
import { BusinessUnitService } from '../../../business-units/services/business-unit.service';
import { BusinessUnitDto } from '../../../business-units/models/business-unit.model';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PickListModule,
    ToggleButtonModule,
    TabsModule
  ],
  templateUrl: './usuario-form.html',
  styleUrl: './usuario-form.scss',
})
export class UsuarioForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);
  private readonly businessUnitService = inject(BusinessUnitService);
  private readonly confirmationService = inject(ConfirmationService);

  @Input() user: UserResponse | null = null;
  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();
  @Output() mfaAction = new EventEmitter<'enable' | 'disable' | 'reset' | 'require' | 'optional'>();

  form: FormGroup;
  rolesAvailable: RoleResponse[] = [];
  rolesAssigned: RoleResponse[] = [];

  // Business Units PickList arrays and properties
  buAvailable: BusinessUnitDto[] = [];
  buAssigned: BusinessUnitDto[] = [];

  constructor() {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      password: ['', [Validators.minLength(8), Validators.maxLength(255)]],
      roleIds: [[], Validators.required],
      hasAllBusinessUnits: [false],
      businessUnitIds: [[]]
    });
  }

  ngOnInit(): void {
    // Load roles list
    this.usuarioService.getRoles().subscribe({
      next: (roles) => {
        this.initializeRoles(roles);
      },
      error: (err) => console.error('Error loading roles list', err)
    });

    // Load business units list
    this.businessUnitService.getBusinessUnits().subscribe({
      next: (bus) => {
        this.initializeBusinessUnits(bus);
      },
      error: (err) => console.error('Error loading business units list', err)
    });
  }

  private initializeRoles(allRoles: RoleResponse[]): void {
    if (this.user) {
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
      
      const userRoleIds = this.user.roles ? this.user.roles.map(r => r.id) : [];
      this.rolesAssigned = allRoles.filter(r => userRoleIds.includes(r.id));
      this.rolesAvailable = allRoles.filter(r => !userRoleIds.includes(r.id));

      this.form.patchValue({
        username: this.user.username,
        email: this.user.email,
        password: '',
        roleIds: userRoleIds
      });
    } else {
      this.rolesAvailable = [...allRoles];
      this.rolesAssigned = [];
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8), Validators.maxLength(255)]);
      this.form.get('password')?.updateValueAndValidity();
      this.form.patchValue({
        roleIds: []
      });
    }
  }

  private initializeBusinessUnits(allBUs: BusinessUnitDto[]): void {
    const activeBUs = allBUs.filter(bu => bu.enabled && bu.id !== undefined);

    if (this.user) {
      const userBuIds = this.user.businessUnits ? this.user.businessUnits.map(b => b.id).filter(id => id !== undefined) : [];
      this.buAssigned = activeBUs.filter(b => b.id !== undefined && userBuIds.includes(b.id!));
      this.buAvailable = activeBUs.filter(b => b.id !== undefined && !userBuIds.includes(b.id!));

      this.form.patchValue({
        hasAllBusinessUnits: this.user.hasAllBusinessUnits ?? false,
        businessUnitIds: userBuIds
      });

      this.applyConditionalValidators(this.user.hasAllBusinessUnits ?? false);
    } else {
      this.buAvailable = [...activeBUs];
      this.buAssigned = [];
      this.form.patchValue({
        hasAllBusinessUnits: false,
        businessUnitIds: []
      });
      this.applyConditionalValidators(false);
    }
  }

  onGlobalAccessChange(event: any): void {
    const isGlobal = event.checked;
    if (isGlobal) {
      // Si tiene asignaciones específicas y se activa el acceso global, pedir confirmación
      if (this.buAssigned.length > 0) {
        this.confirmationService.confirm({
          header: 'Confirmar Acceso Global',
          message: 'Al activar el acceso global, se limpiarán las asignaciones específicas de Business Units para este usuario. ¿Desea continuar?',
          acceptLabel: 'Confirmar',
          rejectLabel: 'Cancelar',
          accept: () => {
            this.setGlobalState();
          },
          reject: () => {
            // Revertir switch visual
            this.form.get('hasAllBusinessUnits')?.setValue(false);
          }
        });
      } else {
        this.setGlobalState();
      }
    } else {
      this.applyConditionalValidators(false);
    }
  }

  private setGlobalState(): void {
    // Retornar BUs asignadas a la lista de disponibles
    this.buAvailable = [...this.buAvailable, ...this.buAssigned];
    this.buAssigned = [];
    
    this.form.patchValue({
      businessUnitIds: []
    });

    this.applyConditionalValidators(true);
  }

  private applyConditionalValidators(isGlobal: boolean): void {
    const buIdsControl = this.form.get('businessUnitIds');

    if (isGlobal) {
      buIdsControl?.clearValidators();
    } else {
      buIdsControl?.setValidators([Validators.required]);
    }
    buIdsControl?.updateValueAndValidity();
  }

  onMove(): void {
    const assignedIds = this.rolesAssigned.map(r => r.id);
    this.form.get('roleIds')?.setValue(assignedIds);
    this.form.get('roleIds')?.markAsTouched();
  }

  onBuMove(): void {
    const assignedIds = this.buAssigned.map(b => b.id).filter(id => id !== undefined) as number[];
    this.form.get('businessUnitIds')?.setValue(assignedIds);
    this.form.get('businessUnitIds')?.markAsTouched();
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.form.value);
  }
}