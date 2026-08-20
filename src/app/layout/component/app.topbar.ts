import { Component, inject, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { MenuModule } from 'primeng/menu';
import { DialogModule } from 'primeng/dialog';
import { ChangePasswordComponent, Auth } from '@rassini/rassini-ui';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '@/app/layout/service/layout.service';

@Component({
    selector: 'app-topbar',
    standalone: true,
    styleUrl: './app.topbar.scss',
    imports: [RouterModule, CommonModule, StyleClassModule, AppConfigurator, MenuModule, DialogModule, ChangePasswordComponent],
    template: ` <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars"></i>
            </button>
            <a class="layout-topbar-logo" routerLink="/">
                <img
                    src="assets/images/rassini-logo.png"
                    alt="Rassini"
                    class="rassini-logo">
            </a>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
            </div>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-calendar"></i>
                        <span>Calendar</span>
                    </button>
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-inbox"></i>
                        <span>Messages</span>
                    </button>
                    <button type="button" class="layout-topbar-action" (click)="profileMenu.toggle($event)">
                        <i class="pi pi-user"></i>
                        <span>Profile</span>
                    </button>
                    
                    <p-menu #profileMenu [model]="profileMenuItems" [popup]="true"></p-menu>
                    
                    <p-dialog header="Mi Perfil" [(visible)]="profileVisible" [modal]="true" [style]="{width: '400px'}">
                        <div class="flex flex-col gap-3" *ngIf="auth.currentUser() as user">
                            <div><strong>Usuario:</strong> {{ user.username }}</div>
                            <div><strong>Email:</strong> {{ user.email }}</div>
                            <div><strong>Estado:</strong> {{ user.enabled ? 'Activo' : 'Inactivo' }}</div>
                            <div><strong>Roles:</strong> {{ auth.roles()?.length ? auth.roles().join(', ') : 'Ninguno' }}</div>
                        </div>
                    </p-dialog>

                    <p-dialog header="Mis Roles" [(visible)]="rolesVisible" [modal]="true" [style]="{width: '400px'}">
                        <ul class="list-none p-0 m-0">
                            <li *ngFor="let role of auth.roles()" class="p-2 border-b">{{ role }}</li>
                        </ul>
                        <div *ngIf="!auth.roles()?.length" class="p-2 text-gray-500">No tienes roles asignados.</div>
                    </p-dialog>

                    <p-dialog header="Mis Permisos" [(visible)]="permissionsVisible" [modal]="true" [style]="{width: '400px'}">
                        <ul class="list-none p-0 m-0">
                            <li *ngFor="let perm of auth.permissions()" class="p-2 border-b">{{ perm }}</li>
                        </ul>
                        <div *ngIf="!auth.permissions()?.length" class="p-2 text-gray-500">No tienes permisos asignados.</div>
                    </p-dialog>

                    <app-change-password #changePasswordDialog></app-change-password>
                </div>
            </div>
        </div>
    </div>`
})
export class AppTopbar {
    items!: MenuItem[];

    layoutService = inject(LayoutService);
    auth = inject(Auth);
    router = inject(Router);

    @ViewChild('changePasswordDialog') changePasswordDialog!: ChangePasswordComponent;

    profileVisible = false;
    rolesVisible = false;
    permissionsVisible = false;

    profileMenuItems: MenuItem[] = [
        {
            label: 'Mi Perfil',
            icon: 'pi pi-user',
            command: () => this.profileVisible = true
        },
        {
            label: 'Cambiar Contraseña',
            icon: 'pi pi-key',
            command: () => this.changePasswordDialog.show()
        },
        {
            label: 'Mis Roles',
            icon: 'pi pi-id-card',
            command: () => this.rolesVisible = true
        },
        {
            label: 'Mis Permisos',
            icon: 'pi pi-lock',
            command: () => this.permissionsVisible = true
        },
        { separator: true },
        {
            label: 'Cerrar Sesión',
            icon: 'pi pi-sign-out',
            command: () => {
                this.auth.logout();
                this.router.navigate(['/auth/login']);
            }
        }
    ];

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({
            ...state,
            darkTheme: !state.darkTheme
        }));
    }
}
