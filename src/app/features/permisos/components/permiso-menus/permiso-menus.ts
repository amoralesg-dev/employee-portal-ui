import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { PickListModule } from 'primeng/picklist';
import { PermissionResponse } from '../../models/permiso.model';
import { MenuResponse } from '../../../menus/models/menu.model';
import { PermisoService } from '../../services/permiso.service';
import { MenuService } from '../../../menus/services/menu.service';
import { Toast, Loader } from '@rassini/rassini-ui';
import { ApplicationService } from '../../../aplicaciones/services/application.service';
import { ApplicationDto } from '../../../aplicaciones/models/application.model';
import { forkJoin } from 'rxjs';

interface ExtendedMenu extends MenuResponse {
  hierarchicalPath: string;
}

@Component({
  selector: 'app-permiso-menus',
  standalone: true,
  imports: [CommonModule, ButtonModule, PickListModule],
  templateUrl: './permiso-menus.html',
  styleUrls: ['./permiso-menus.scss']
})
export class PermisoMenusComponent implements OnInit {
  private readonly permisoService = inject(PermisoService);
  private readonly menuService = inject(MenuService);
  private readonly applicationService = inject(ApplicationService);
  private readonly toast = inject(Toast);
  private readonly loader = inject(Loader);

  @Input() permission!: PermissionResponse;
  @Output() cancel = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  application: ApplicationDto | null = null;
  availableMenus: ExtendedMenu[] = [];
  assignedMenus: ExtendedMenu[] = [];
  loadingData = true;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loadingData = true;
    this.loader.show();

    forkJoin({
      allMenusFlat: this.menuService.getMenusFlat(),
      assigned: this.permisoService.getPermissionMenus(this.permission.id),
      app: this.permission.applicationId ? this.applicationService.getApplicationById(this.permission.applicationId) : Promise.resolve(null)
    }).subscribe({
      next: (res) => {
        this.application = res.app as ApplicationDto;
        
        // Flatten and build hierarchical paths
        const allMenusWithPaths = this.buildHierarchicalPaths(res.allMenusFlat);
        
        // Filter out non-leaf menus (only route != null) and match applicationId
        const leafMenus = allMenusWithPaths.filter(m => m.route != null && m.applicationId === this.permission.applicationId);

        const assignedIds = new Set(res.assigned.map(m => m.id));
        
        this.assignedMenus = leafMenus.filter(m => assignedIds.has(m.id));
        this.availableMenus = leafMenus.filter(m => !assignedIds.has(m.id));

        this.loadingData = false;
        this.loader.hide();
      },
      error: (err) => {
        this.loadingData = false;
        this.loader.hide();
        this.toast.error('Error al cargar datos para la asignación de menús');
        console.error(err);
      }
    });
  }

  buildHierarchicalPaths(flatMenus: MenuResponse[]): ExtendedMenu[] {
    const map = new Map<number, MenuResponse>();
    flatMenus.forEach(m => map.set(m.id, m));

    return flatMenus.map(m => {
      let path = m.label;
      let current = m;
      while (current.parentId && map.has(current.parentId)) {
        current = map.get(current.parentId)!;
        path = current.label + ' / ' + path;
      }
      return { ...m, hierarchicalPath: path };
    });
  }

  guardar(): void {
    if (this.assignedMenus.length === 0) {
      this.toast.error('El permiso debe tener al menos un menú asignado.');
      return;
    }

    this.loader.show();
    const menuIds = this.assignedMenus.map(m => m.id);

    this.permisoService.updatePermissionMenus(this.permission.id, menuIds).subscribe({
      next: () => {
        this.loader.hide();
        this.toast.success('Menús asignados exitosamente');
        this.saved.emit();
      },
      error: (err) => {
        this.loader.hide();
        this.toast.error(err.error?.message || 'Error al asignar menús');
        console.error(err);
      }
    });
  }
}
