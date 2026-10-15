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
import { PermissionService } from '../../../../shared/services/permission.service';

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
  private readonly permissionService = inject(PermissionService);

  // Permisos visuales calculados desde auth.permissions()
  get canCreate(): boolean { return this.permissionService.hasPermission('USER_CREATE'); }
  get canUpdate(): boolean { return this.permissionService.hasPermission('USER_UPDATE'); }
  get canDelete(): boolean { return this.permissionService.hasPermission('USER_DELETE'); }
  get canResetPassword(): boolean { return this.permissionService.hasPermission('USER_PASSWORD_RESET'); }

  loading = true;
  dialogVisible = false;
  tempPasswordVisible = false;
  generatedTempPassword = '';
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
    console.log('--- Permisos cargados en runtime (Usuarios Component) ---');
    console.log('Todos los permisos:', this.permissionService.getPermissions());
    console.log('Tiene USER_PASSWORD_RESET?', this.canResetPassword);
    
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
        email: formData.email,
        hasAllBusinessUnits: formData.hasAllBusinessUnits,
        businessUnitIds: formData.businessUnitIds
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
        password: formData.password,
        hasAllBusinessUnits: formData.hasAllBusinessUnits,
        businessUnitIds: formData.businessUnitIds
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

  /**
   * Reseteo de contraseña por administrador.
   * Genera una contraseña temporal aleatoria, la envía al backend y muestra confirmación.
   * El administrador NO conoce la contraseña final — solo confirma la acción.
   */
  resetPassword(user: UserResponse): void {
    this.selectedUser = user;
    this.confirmationService.confirm({
      header: 'Resetear Contraseña',
      message: `¿Está seguro de que desea resetear la contraseña del usuario "${user.username}"? Se generará una contraseña temporal aleatoria.`,
      acceptLabel: 'Resetear',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'warn' },
      accept: () => {
        const tempPassword = this.generateTemporaryPassword();
        this.loader.show();
        this.usuarioService.adminResetPassword(user.username, tempPassword).subscribe({
          next: () => {
            this.loader.hide();
            this.generatedTempPassword = tempPassword;
            this.tempPasswordVisible = true;
          },
          error: (err) => {
            this.loader.hide();
            this.toast.error('Error al resetear la contraseña del usuario');
            console.error(err);
          }
        });
      }
    });
  }

  /**
   * Copia la contraseña temporal al portapapeles.
   */
  copyTempPassword(): void {
    navigator.clipboard.writeText(this.generatedTempPassword).then(() => {
      this.toast.success('Contraseña copiada al portapapeles');
    }).catch(err => {
      console.error('Error copying text: ', err);
      this.toast.error('No se pudo copiar la contraseña');
    });
  }


  /**
   * Genera una contraseña temporal segura aleatoria (12 caracteres).
   * La contraseña no se almacena ni se muestra al administrador después de enviarse.
   */
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    const array = new Uint32Array(12);
    crypto.getRandomValues(array);
    return Array.from(array, (val) => chars[val % chars.length]).join('');
  }

  handleMfaAction(action: 'enable' | 'disable' | 'reset' | 'require' | 'optional'): void {
    if (!this.selectedUser) return;
    
    const userId = this.selectedUser.id;
    const username = this.selectedUser.username;
    let header = '';
    let message = '';
    
    if (action === 'enable') {
      header = 'Habilitar MFA';
      message = `¿Está seguro que desea habilitar MFA para el usuario ${username}? Se le requerirá configurar un autenticador en su próximo inicio de sesión.`;
    } else if (action === 'disable') {
      header = 'Deshabilitar MFA';
      message = `¿Está seguro que desea deshabilitar MFA para el usuario ${username}? Su configuración actual será eliminada.`;
    } else if (action === 'reset') {
      header = 'Reiniciar MFA';
      message = `¿Está seguro que desea reiniciar el MFA para el usuario ${username}? Esto invalidará su dispositivo actual y se le obligará a configurar uno nuevo en su próximo inicio de sesión.`;
    } else if (action === 'require') {
      header = 'Requerir MFA';
      message = `¿Está seguro que desea marcar el MFA como obligatorio para el usuario ${username}? El usuario no podrá desactivarlo.`;
    } else if (action === 'optional') {
      header = 'Hacer MFA Opcional';
      message = `¿Está seguro que desea quitar la obligatoriedad del MFA para el usuario ${username}?`;
    }

    this.confirmationService.confirm({
      header,
      message,
      acceptLabel: 'Confirmar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: action === 'disable' ? 'danger' : (action === 'optional' ? 'secondary' : 'warn') },
      accept: () => {
        this.loader.show();
        let apiCall;
        if (action === 'enable') apiCall = this.usuarioService.enableMfa(userId);
        else if (action === 'disable') apiCall = this.usuarioService.disableMfa(userId);
        else if (action === 'reset') apiCall = this.usuarioService.resetMfa(userId);
        else if (action === 'require') apiCall = this.usuarioService.requireMfa(userId);
        else apiCall = this.usuarioService.optionalMfa(userId);

        apiCall.subscribe({
          next: () => {
            this.loader.hide();
            this.toast.success('Operación MFA realizada exitosamente');
            // Recargar datos y actualizar selectedUser
            this.usuarioService.getUserById(userId).subscribe(updatedUser => {
              this.selectedUser = updatedUser;
              this.loadUsers(); // Refresh grid
            });
          },
          error: (err) => {
            this.loader.hide();
            const msg = err.error?.message || 'Error al procesar la operación MFA';
            this.toast.error(msg);
          }
        });
      }
    });
  }
}
