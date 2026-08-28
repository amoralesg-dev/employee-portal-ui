import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PickListModule } from 'primeng/picklist';
import { ButtonModule } from 'primeng/button';
import { UserResponse } from '../../../usuarios/models/usuario.model';
import { UsuarioService } from '../../../usuarios/services/usuario.service';
import { BusinessUnitService } from '../../services/business-unit.service';
import { Loader } from '@rassini/rassini-ui';

@Component({
  selector: 'app-business-unit-users',
  standalone: true,
  imports: [
    CommonModule, 
    PickListModule,
    ButtonModule
  ],
  template: `
    <div class="flex flex-col gap-4">
      <p-pickList 
        [source]="usersAvailable" 
        [target]="usersAssigned" 
        sourceHeader="Usuarios Disponibles" 
        targetHeader="Usuarios Asignados" 
        [dragdrop]="true" 
        [responsive]="true" 
        [showSourceControls]="false" 
        [showTargetControls]="false"
        [sourceStyle]="{ height: '18rem' }" 
        [targetStyle]="{ height: '18rem' }"
        filterBy="username,email" 
        sourceFilterPlaceholder="Buscar por usuario..." 
        targetFilterPlaceholder="Buscar por usuario..."
        (onMoveToTarget)="onMove()"
        (onMoveToSource)="onMove()"
        (onMoveAllToTarget)="onMove()"
        (onMoveAllToSource)="onMove()">
        <ng-template let-user #item>
          <div class="flex flex-col gap-0.5 p-1">
            <span class="font-semibold text-sm">{{ user.username }}</span>
            <span class="text-xs text-gray-500">{{ user.email }}</span>
          </div>
        </ng-template>
      </p-pickList>

      <div class="actions flex justify-end gap-2 mt-4">
        <p-button label="Cancelar" severity="secondary" (click)="cancel.emit()" type="button"></p-button>
        <p-button label="Guardar Asignación" (click)="guardar()"></p-button>
      </div>
    </div>
  `
})
export class BusinessUnitUsersComponent implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly businessUnitService = inject(BusinessUnitService);
  private readonly loader = inject(Loader);

  @Input() businessUnitId!: number;
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  usersAvailable: UserResponse[] = [];
  usersAssigned: UserResponse[] = [];

  ngOnInit(): void {
    this.loadUsersContext();
  }

  loadUsersContext(): void {
    this.loader.show();
    // Carga todos los usuarios
    this.usuarioService.getUsers().subscribe({
      next: (allUsers) => {
        // Filtrar usuarios globales (los usuarios globales no se asignan a BUs específicas)
        const specificUsers = allUsers.filter(u => !u.hasAllBusinessUnits);

        // Carga los usuarios asignados a esta BU
        this.businessUnitService.getBusinessUnitUsers(this.businessUnitId).subscribe({
          next: (assigned) => {
            const assignedIds = assigned.map(u => u.id);
            this.usersAssigned = specificUsers.filter(u => assignedIds.includes(u.id));
            this.usersAvailable = specificUsers.filter(u => !assignedIds.includes(u.id));
            this.loader.hide();
          },
          error: (err) => {
            this.loader.hide();
            console.error('Error loading BU assigned users', err);
          }
        });
      },
      error: (err) => {
        this.loader.hide();
        console.error('Error loading global users list', err);
      }
    });
  }

  onMove(): void {}

  guardar(): void {
    this.loader.show();
    const userIds = this.usersAssigned.map(u => u.id);
    this.businessUnitService.replaceBusinessUnitUsers(this.businessUnitId, userIds).subscribe({
      next: () => {
        this.loader.hide();
        this.save.emit();
      },
      error: (err) => {
        this.loader.hide();
        console.error('Error replacing BU users', err);
      }
    });
  }
}
