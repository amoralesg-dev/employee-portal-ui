import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  PageHeaderComponent,
  PageToolbarComponent,
  PageContentComponent,
  AppDialog,
  Toast,
  Loader
} from '@rassini/rassini-ui';
import { MenuForm } from '../../components/menu-form/menu-form';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, TreeNode } from 'primeng/api';
import { TreeTableModule } from 'primeng/treetable';
import { InputTextModule } from 'primeng/inputtext';
import { MenuService, ApplicationDto } from '../../services/menu.service';
import { MenuResponse, MenuRequest } from '../../models/menu.model';
import { PermissionService } from '../../../../shared/services/permission.service';

@Component({
  selector: 'app-menus',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    PageToolbarComponent,
    PageContentComponent,
    ButtonModule,
    TooltipModule,
    TreeTableModule,
    InputTextModule,
    AppDialog,
    MenuForm
  ],
  templateUrl: './menus.html',
  styleUrl: './menus.scss'
})
export class Menus implements OnInit {
  private readonly menuService = inject(MenuService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toast = inject(Toast);
  private readonly loader = inject(Loader);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly permissionService = inject(PermissionService);

  get canCreate(): boolean { return this.permissionService.hasPermission('MENU_CREATE'); }
  get canUpdate(): boolean { return this.permissionService.hasPermission('MENU_UPDATE'); }
  get canDelete(): boolean { return this.permissionService.hasPermission('MENU_DELETE'); }

  loading = true;
  dialogVisible = false;
  selectedMenu: MenuResponse | null = null;
  
  menuTree: TreeNode<MenuResponse>[] = [];
  flatMenus: MenuResponse[] = [];
  applications: ApplicationDto[] = [];
  
  globalFilter: string = '';

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    
    // Load Applications
    this.menuService.getApplications().subscribe({
      next: (apps) => {
        this.applications = apps;
        this.loadMenus();
      },
      error: (err) => {
        this.loading = false;
        this.toast.error('Error al cargar aplicaciones');
        console.error(err);
      }
    });
  }

  loadMenus(): void {
    this.menuService.getMenusTree().subscribe({
      next: (data) => {
        this.menuTree = this.buildTreeNodes(data);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.toast.error('Error al cargar la jerarquía de menús');
        console.error(err);
      }
    });

    this.menuService.getMenusFlat().subscribe({
      next: (data) => {
        this.flatMenus = data;
      },
      error: (err) => console.error(err)
    });
  }

  private buildTreeNodes(menus: MenuResponse[]): TreeNode<MenuResponse>[] {
    return menus.map(menu => ({
      data: menu,
      expanded: true,
      children: menu.children ? this.buildTreeNodes(menu.children) : []
    }));
  }

  showCreateDialog(): void {
    this.selectedMenu = null;
    this.dialogVisible = true;
  }

  showEditDialog(menu: MenuResponse): void {
    this.selectedMenu = menu;
    this.dialogVisible = true;
  }

  guardarMenu(formData: MenuRequest): void {
    this.dialogVisible = false;
    this.loader.show();

    if (this.selectedMenu) {
      this.menuService.updateMenu(this.selectedMenu.id, formData).subscribe({
        next: () => {
          this.loader.hide();
          this.toast.success('Menú actualizado exitosamente');
          this.loadMenus();
        },
        error: (err) => {
          this.loader.hide();
          this.toast.error(err.error?.message || 'Error al actualizar el menú');
          console.error(err);
        }
      });
    } else {
      this.menuService.createMenu(formData).subscribe({
        next: () => {
          this.loader.hide();
          this.toast.success('Menú creado exitosamente');
          this.loadMenus();
        },
        error: (err) => {
          this.loader.hide();
          this.toast.error(err.error?.message || 'Error al crear el menú');
          console.error(err);
        }
      });
    }
  }

  eliminarMenu(menu: MenuResponse): void {
    this.confirmationService.confirm({
      header: 'Eliminar Menú',
      message: `¿Deseas eliminar el menú ${menu.label}?`,
      acceptLabel: 'Confirmar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      accept: () => {
        this.loader.show();
        this.menuService.deleteMenu(menu.id).subscribe({
          next: () => {
            this.loader.hide();
            this.toast.success('Menú eliminado exitosamente');
            this.loadMenus();
          },
          error: (err) => {
            this.loader.hide();
            this.toast.error(err.error?.message || 'Error al eliminar el menú. Verifique dependencias.');
            console.error(err);
          }
        });
      }
    });
  }
}
