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
import { RoleResponse, PermissionResponse } from '../../models/role.model';
import { RoleService } from '../../services/role.service';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PickListModule
  ],
  templateUrl: './role-form.html',
  styleUrl: './role-form.scss',
})
export class RoleForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly roleService = inject(RoleService);

  @Input() role: RoleResponse | null = null;
  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  permissionsAvailable: PermissionResponse[] = [];
  permissionsAssigned: PermissionResponse[] = [];

  constructor() {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(255)]],
      permissionIds: [[], Validators.required]
    });
  }

  ngOnInit(): void {
    // Load all system permissions
    this.roleService.getPermissions().subscribe({
      next: (allPerms) => {
        this.initializePermissions(allPerms);
      },
      error: (err) => console.error('Error loading permissions list', err)
    });
  }

  private initializePermissions(allPerms: PermissionResponse[]): void {
    if (this.role) {
      // Edit mode: set values
      // Fetch permissions assigned to the role
      this.roleService.getRolePermissions(this.role.id).subscribe({
        next: (assignedPerms) => {
          const assignedIds = assignedPerms.map(p => p.id);
          this.permissionsAssigned = assignedPerms;
          this.permissionsAvailable = allPerms.filter(p => !assignedIds.includes(p.id));
          
          this.form.patchValue({
            code: this.role?.code,
            name: this.role?.name,
            description: this.role?.description,
            permissionIds: assignedIds
          });
        },
        error: (err) => console.error('Error loading assigned permissions', err)
      });
    } else {
      // Create mode: all permissions are available
      this.permissionsAvailable = [...allPerms];
      this.permissionsAssigned = [];
      this.form.patchValue({
        code: '',
        name: '',
        description: '',
        permissionIds: []
      });
    }
  }

  onMove(): void {
    const assignedIds = this.permissionsAssigned.map(p => p.id);
    this.form.get('permissionIds')?.setValue(assignedIds);
    this.form.get('permissionIds')?.markAsTouched();
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.form.value);
  }
}
