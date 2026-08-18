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
import { MultiSelectModule } from 'primeng/multiselect';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { RoleResponse, UserResponse } from '../../models/usuario.model';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    MultiSelectModule,
    ToggleButtonModule
  ],
  templateUrl: './usuario-form.html',
  styleUrl: './usuario-form.scss',
})
export class UsuarioForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);

  @Input() user: UserResponse | null = null;
  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  rolesList: RoleResponse[] = [];

  constructor() {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      password: ['', [Validators.minLength(8), Validators.maxLength(255)]],
      roleIds: [[], Validators.required]
    });
  }

  ngOnInit(): void {
    // Load roles list from backend
    this.usuarioService.getRoles().subscribe({
      next: (roles) => {
        this.rolesList = roles;
        this.initializeForm();
      },
      error: (err) => console.error('Error loading roles list', err)
    });
  }

  private initializeForm(): void {
    if (this.user) {
      // Edit mode: set values, email and username
      // Remove password validator since it is optional on update
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
      
      const userRoleIds = this.user.roles ? this.user.roles.map(r => r.id) : [];

      this.form.patchValue({
        username: this.user.username,
        email: this.user.email,
        password: '',
        roleIds: userRoleIds
      });
    } else {
      // Create mode: password is required
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8), Validators.maxLength(255)]);
      this.form.get('password')?.updateValueAndValidity();
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.form.value);
  }
}