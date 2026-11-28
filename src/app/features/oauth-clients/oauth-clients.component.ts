import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { environment } from '../../../environments/environment';

export interface OauthClientItem {
  id: number;
  clientId: string;
  clientName: string;
  authorizationGrantTypes: string;
  scopes: string;
  accessTokenTimeToLiveSeconds: number;
  enabled: boolean;
}

@Component({
  selector: 'app-oauth-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, DialogModule, ButtonModule, InputTextModule, MultiSelectModule, TagModule, SelectModule],
  template: `
    <div class="p-4">
      <div class="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h2 class="text-xl font-semibold m-0">IAM &gt; Clientes OAuth2 (client_credentials)</h2>
        <p-button label="Nuevo cliente OAuth2" icon="pi pi-plus" (onClick)="abrirCrear()" />
      </div>

      <div *ngIf="errorMsg()" class="p-3 mb-3 rounded bg-red-100 text-red-800 border border-red-300">{{ errorMsg() }}</div>
      <div *ngIf="successMsg()" class="p-3 mb-3 rounded bg-green-100 text-green-800 border border-green-300">{{ successMsg() }}</div>

      <div class="flex flex-wrap gap-3 mb-4 items-end">
        <div>
          <label class="block text-sm font-medium mb-1">Buscar</label>
          <input pInputText type="text" [ngModel]="search()" (ngModelChange)="search.set($event)" placeholder="Client ID o nombre..." />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Estado</label>
          <p-select [options]="estadoOptions" [ngModel]="filtroEstado()" (ngModelChange)="filtroEstado.set($event)" optionLabel="label" optionValue="value" />
        </div>
      </div>

      <p-table [value]="filteredClients()" [loading]="loading()" [paginator]="true" [rows]="10" styleClass="p-datatable-sm p-datatable-striped">
        <ng-template #header>
          <tr>
            <th>Client ID</th>
            <th>Nombre</th>
            <th>Grant Type</th>
            <th>Scopes</th>
            <th>TTL (seg)</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </ng-template>
        <ng-template #body let-c>
          <tr>
            <td class="font-semibold">{{ c.clientId }}</td>
            <td>{{ c.clientName }}</td>
            <td><p-tag [severity]="isS2s(c) ? 'info' : 'secondary'" [value]="isS2s(c) ? 'client_credentials' : 'SPA / OIDC (solo lectura)'"></p-tag></td>
            <td>{{ c.scopes }}</td>
            <td>{{ c.accessTokenTimeToLiveSeconds }}</td>
            <td><p-tag [severity]="c.enabled ? 'success' : 'danger'" [value]="c.enabled ? 'Activo' : 'Inactivo'"></p-tag></td>
            <td class="flex flex-wrap gap-1">
              <p-button icon="pi pi-pencil" size="small" severity="secondary" title="Editar" [disabled]="!isS2s(c)" (onClick)="abrirEditar(c)" />
              <p-button icon="pi pi-key" size="small" severity="warn" title="Rotar secreto" [disabled]="!isS2s(c)" (onClick)="rotarSecreto(c)" />
              <p-button [icon]="c.enabled ? 'pi pi-ban' : 'pi pi-check-circle'" size="small" [severity]="c.enabled ? 'danger' : 'success'" [title]="c.enabled ? 'Desactivar' : 'Activar'" [disabled]="!isS2s(c)" (onClick)="toggleEstado(c)" />
              <p-button icon="pi pi-history" size="small" severity="info" title="Historial" (onClick)="verHistorial(c)" />
            </td>
          </tr>
        </ng-template>
      </p-table>

      <p-dialog [(visible)]="formVisible" [modal]="true" [header]="editingId ? 'Editar cliente OAuth2' : 'Nuevo cliente OAuth2'" [style]="{ width: '38rem' }">
        <div class="flex flex-col gap-3">
          <div>
            <label class="block text-sm font-medium mb-1" title="Identificador único del cliente técnico en IAM">Client ID *</label>
            <input pInputText type="text" [(ngModel)]="formClientId" [disabled]="!!editingId" class="w-full" />
            <small *ngIf="!formClientId.trim()" class="text-red-600">El Client ID es obligatorio.</small>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1" title="Nombre descriptivo del cliente OAuth2">Nombre *</label>
            <input pInputText type="text" [(ngModel)]="formClientName" class="w-full" />
            <small *ngIf="!formClientName.trim()" class="text-red-600">El nombre es obligatorio.</small>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1" title="Aplicación corporativa propietaria del cliente">Aplicación *</label>
            <p-select [options]="applications()" [(ngModel)]="formApplicationId" optionLabel="name" optionValue="id" placeholder="Seleccione una aplicación" class="w-full" />
            <small *ngIf="!formApplicationId" class="text-red-600">La aplicación es obligatoria.</small>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1" title="Scopes técnicos autorizados para este cliente">Scopes autorizados *</label>
            <p-multiSelect [options]="allowedScopes()" [(ngModel)]="formScopes" optionLabel="label" optionValue="code" placeholder="Seleccione scopes" class="w-full" />
            <small *ngIf="formScopes.length === 0" class="text-red-600">Seleccione al menos un scope.</small>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1" title="Duración del access token en segundos">Vigencia Access Token (segundos)</label>
            <input pInputText type="number" [(ngModel)]="formTtl" class="w-full" />
            <small class="text-gray-600">Equivalente: {{ (formTtl / 60) | number:'1.0-1' }} minutos</small>
          </div>
        </div>
        <ng-template #footer>
          <p-button label="Cancelar" severity="secondary" (onClick)="formVisible = false" />
          <p-button label="Guardar" icon="pi pi-check" [disabled]="!formClientId.trim() || !formClientName.trim() || !formApplicationId || formScopes.length === 0" (onClick)="guardar()" />
        </ng-template>
      </p-dialog>

      <p-dialog [(visible)]="secretVisible" [modal]="true" header="Secreto generado (única visualización)" [style]="{ width: '34rem' }">
        <p class="text-sm text-amber-700 font-medium mb-2">Copia este Client Secret ahora. Por seguridad no volverá a mostrarse.</p>
        <input pInputText type="text" [value]="generatedSecret()" readonly class="w-full font-mono" />
      </p-dialog>

      <p-dialog [(visible)]="historyVisible" [modal]="true" header="Historial de auditoría" [style]="{ width: '44rem' }">
        <div *ngIf="history().length === 0" class="p-3 text-center text-gray-600">No existen eventos registrados.</div>
        <p-table *ngIf="history().length > 0" [value]="history()" styleClass="p-datatable-sm">
          <ng-template #header>
            <tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Detalle</th></tr>
          </ng-template>
          <ng-template #body let-h>
            <tr><td>{{ h.created_at }}</td><td>{{ h.actor_username }}</td><td>{{ h.action }}</td><td>{{ h.detail }}</td></tr>
          </ng-template>
        </p-table>
      </p-dialog>
    </div>
  `
})
export class OauthClientsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/oauth-clients`;

  clients = signal<OauthClientItem[]>([]);
  allowedScopes = signal<{ code: string; label: string }[]>([]);
  applications = signal<{ id: number; name: string }[]>([]);
  history = signal<any[]>([]);
  loading = signal(false);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  search = signal('');
  filtroEstado = signal<boolean | null>(true);
  estadoOptions = [{ label: 'Activos', value: true }, { label: 'Inactivos', value: false }, { label: 'Todos', value: null }];

  filteredClients = computed(() => {
    const q = this.search().trim().toLowerCase();
    const est = this.filtroEstado();
    return this.clients().filter(c =>
      (est === null || c.enabled === est) &&
      (!q || c.clientId.toLowerCase().includes(q) || c.clientName.toLowerCase().includes(q))
    );
  });

  formVisible = false;
  editingId: number | null = null;
  formClientId = '';
  formClientName = '';
  formApplicationId: number | null = null;
  formScopes: string[] = [];
  formTtl = 900;

  secretVisible = false;
  generatedSecret = signal('');
  historyVisible = false;

  ngOnInit(): void {
    this.cargar();
    this.http.get<{ code: string; description?: string }[]>(`${this.baseUrl}/scopes`).subscribe({
      next: s => this.allowedScopes.set(s.map(x => ({ code: x.code, label: x.description ? `${x.code} — ${x.description}` : x.code })))
    });
    this.http.get<any>(`${environment.apiBaseUrl}/applications`).subscribe({
      next: res => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        this.applications.set(list);
      }
    });
  }

  isS2s(c: OauthClientItem): boolean {
    return !!c.authorizationGrantTypes && c.authorizationGrantTypes.includes('client_credentials');
  }

  cargar(): void {
    this.loading.set(true);
    this.http.get<OauthClientItem[]>(this.baseUrl).subscribe({
      next: data => { this.clients.set(data); this.loading.set(false); },
      error: () => { this.errorMsg.set('Error al consultar clientes OAuth2.'); this.loading.set(false); }
    });
  }

  abrirCrear(): void {
    this.editingId = null;
    this.formClientId = '';
    this.formClientName = '';
    this.formApplicationId = this.applications()[0]?.id ?? null;
    this.formScopes = ['workflow.invoke'];
    this.formTtl = 900;
    this.formVisible = true;
  }

  abrirEditar(c: OauthClientItem): void {
    this.editingId = c.id;
    this.formClientId = c.clientId;
    this.formClientName = c.clientName;
    this.formApplicationId = (c as any).applicationId ?? this.applications()[0]?.id ?? null;
    this.formScopes = c.scopes ? c.scopes.split(',').map(s => s.trim()).filter(Boolean) : [];
    this.formTtl = c.accessTokenTimeToLiveSeconds || 900;
    this.formVisible = true;
  }

  guardar(): void {
    const payload = {
      clientId: this.formClientId.trim(),
      clientName: this.formClientName.trim(),
      applicationId: this.formApplicationId,
      authorizationGrantTypes: 'client_credentials',
      clientAuthenticationMethods: 'client_secret_basic',
      scopes: this.formScopes.join(','),
      accessTokenTimeToLiveSeconds: this.formTtl,
      refreshTokenTimeToLiveSeconds: 3600,
      enabled: true
    };
    const isCreate = !this.editingId;
    const req$ = this.editingId
      ? this.http.put<OauthClientItem>(`${this.baseUrl}/${this.editingId}`, payload)
      : this.http.post<OauthClientItem>(this.baseUrl, payload);
    req$.subscribe({
      next: (saved) => {
        this.formVisible = false;
        this.successMsg.set('Cliente OAuth2 guardado.');
        this.cargar();
        if (isCreate && saved?.id) {
          this.rotarSecreto(saved);
        }
      },
      error: err => this.errorMsg.set(err?.error?.message || 'Error al guardar cliente OAuth2.')
    });
  }

  rotarSecreto(c: OauthClientItem): void {
    this.http.post<{ clientSecret: string }>(`${this.baseUrl}/${c.id}/rotate-secret`, {}).subscribe({
      next: res => { this.generatedSecret.set(res.clientSecret); this.secretVisible = true; this.successMsg.set('Secreto rotado.'); },
      error: () => this.errorMsg.set('Error al rotar secreto.')
    });
  }

  toggleEstado(c: OauthClientItem): void {
    this.http.patch<OauthClientItem>(`${this.baseUrl}/${c.id}/status`, { enabled: !c.enabled }).subscribe({
      next: () => { this.successMsg.set(`Cliente ${!c.enabled ? 'activado' : 'desactivado'}.`); this.cargar(); },
      error: () => this.errorMsg.set('Error al cambiar estado.')
    });
  }

  verHistorial(c: OauthClientItem): void {
    this.http.get<any[]>(`${this.baseUrl}/${c.id}/history`).subscribe({
      next: data => { this.history.set(data); this.historyVisible = true; },
      error: () => this.errorMsg.set('Error al consultar historial.')
    });
  }
}
