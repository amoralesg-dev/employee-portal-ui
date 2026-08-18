import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  PageHeaderComponent,
  PageToolbarComponent,
  PageContentComponent,
  DataTable,
  AppDialog,
  Toast,
  Loader
} from '@rassini/rassini-ui';
import { UsuarioForm } from '../../components/usuario-form/usuario-form';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';
import { UsuarioService } from '../../services/usuario.service';
import { UserResponse, UserRequest, UserUpdateRequest } from '../../models/usuario.model';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    PageToolbarComponent,
    PageContentComponent,
    ButtonModule,
    TooltipModule,
    DataTable,
    AppDialog,
    UsuarioForm
  ],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toast = inject(Toast);
  private readonly loader = inject(Loader);
  private readonly confirmationService = inject(ConfirmationService);

  loading = true;
  dialogVisible = false;
  selectedUser: UserResponse | null = null;
  usuarios: UserResponse[] = [];

  columns = [
    { field: 'id', header: 'ID', sortable: true },
    { field: 'username', header: 'Usuario', sortable: true },
    { field: 'email', header: 'Correo Electrónico', sortable: true },
    { field: 'enabledText', header: 'Estado', sortable: true },
    { field: 'rolesText', header: 'Roles', sortable: false },
    { field: 'actions', header: 'Acciones', type: 'actions' as const }
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.usuarioService.getUsers().subscribe({
      next: (data) => {
        this.usuarios = data.map(user => ({
          ...user,
          enabledText: user.enabled ? 'Activo' : 'Inactivo',
          rolesText: user.roles ? user.roles.map(r => r.name).join(', ') : ''
        }));
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.toast.error('Error al cargar la lista de usuarios');
        console.error('Error listing users', err);
      }
    });
  }

  showCreateDialog(): void {
    this.selectedUser = null;
    this.dialogVisible = true;
  }

  showEditDialog(user: UserResponse): void {
    this.selectedUser = user;
    this.dialogVisible = true;
  }

  guardarUsuario(formData: any): void {
    this.dialogVisible = false;
    this.loader.show();

    if (this.selectedUser) {
      // Update Mode
      const updateReq: UserUpdateRequest = {
        username: formData.username,
        email: formData.email
      };
      this.usuarioService.updateUser(this.selectedUser.id, updateReq).subscribe({
        next: (userRes) => {
          // Re-assign roles if updated
          this.usuarioService.assignRoles(userRes.id, formData.roleIds).subscribe({
            next: () => {
              this.loader.hide();
              this.toast.success('Usuario actualizado exitosamente');
              this.loadUsers();
            },
            error: (err) => {
              this.loader.hide();
              this.toast.error('Usuario actualizado pero los roles no pudieron asignarse');
              console.error(err);
            }
          });
        },
        error: (err) => {
          this.loader.hide();
          this.toast.error('Error al actualizar el usuario');
          console.error(err);
        }
      });
    } else {
      // Create Mode
      const createReq: UserRequest = {
        username: formData.username,
        email: formData.email,
        password: formData.password
      };
      this.usuarioService.createUser(createReq).subscribe({
        next: (userRes) => {
          // Assign roles
          this.usuarioService.assignRoles(userRes.id, formData.roleIds).subscribe({
            next: () => {
              this.loader.hide();
              this.toast.success('Usuario creado exitosamente');
              this.loadUsers();
            },
            error: (err) => {
              this.loader.hide();
              this.toast.error('Usuario creado pero los roles no pudieron asignarse');
              console.error(err);
            }
          });
        },
        error: (err) => {
          this.loader.hide();
          this.toast.error('Error al crear el usuario');
          console.error(err);
        }
      });
    }
  }

  toggleStatus(user: UserResponse): void {
    const newStatus = !user.enabled;
    const actionText = newStatus ? 'activar' : 'desactivar';

    this.confirmationService.confirm({
      header: `${newStatus ? 'Activar' : 'Desactivar'} Usuario`,
      message: `¿Está seguro de que desea ${actionText} al usuario ${user.username}?`,
      acceptLabel: 'Confirmar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: {
        severity: newStatus ? 'success' : 'warn'
      },
      accept: () => {
        this.loader.show();
        this.usuarioService.updateStatus(user.id, newStatus).subscribe({
          next: () => {
            this.loader.hide();
            this.toast.success(`Usuario ${newStatus ? 'activado' : 'desactivado'} exitosamente`);
            this.loadUsers();
          },
          error: (err) => {
            this.loader.hide();
            this.toast.error('Error al actualizar el estado del usuario');
            console.error(err);
          }
        });
      }
    });
  }
}
