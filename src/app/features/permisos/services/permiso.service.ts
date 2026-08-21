import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PermissionRequest, PermissionResponse } from '../models/permiso.model';
import { MenuResponse } from '../../menus/models/menu.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PermisoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/permissions`;

  getPermissions(): Observable<PermissionResponse[]> {
    return this.http.get<ApiResponse<PermissionResponse[]>>(this.baseUrl)
      .pipe(map(res => res.data));
  }

  getPermissionById(id: number): Observable<PermissionResponse> {
    return this.http.get<ApiResponse<PermissionResponse>>(`${this.baseUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  createPermission(request: PermissionRequest): Observable<PermissionResponse> {
    return this.http.post<ApiResponse<PermissionResponse>>(this.baseUrl, request)
      .pipe(map(res => res.data));
  }

  updatePermission(id: number, request: PermissionRequest): Observable<PermissionResponse> {
    return this.http.put<ApiResponse<PermissionResponse>>(`${this.baseUrl}/${id}`, request)
      .pipe(map(res => res.data));
  }

  deletePermission(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => void 0));
  }

  getPermissionMenus(id: number): Observable<MenuResponse[]> {
    return this.http.get<ApiResponse<MenuResponse[]>>(`${this.baseUrl}/${id}/menus`)
      .pipe(map(res => res.data));
  }

  updatePermissionMenus(id: number, menuIds: number[]): Observable<PermissionResponse> {
    return this.http.put<ApiResponse<PermissionResponse>>(`${this.baseUrl}/${id}/menus`, { menuIds })
      .pipe(map(res => res.data));
  }
}
