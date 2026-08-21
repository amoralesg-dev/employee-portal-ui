import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { map } from 'rxjs/operators';
import { ApiResponse, MenuRequest, MenuResponse } from '../models/menu.model';

export interface ApplicationDto {
  id: number;
  code: string;
  name: string;
  description: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/menus`;
  private readonly appsUrl = `${environment.apiBaseUrl}/applications`;

  getMenusTree(): Observable<MenuResponse[]> {
    return this.http.get<ApiResponse<MenuResponse[]>>(`${this.baseUrl}/tree`)
      .pipe(map(res => res.data));
  }

  getMenusFlat(): Observable<MenuResponse[]> {
    return this.http.get<ApiResponse<MenuResponse[]>>(this.baseUrl)
      .pipe(map(res => res.data));
  }

  getMenuById(id: number): Observable<MenuResponse> {
    return this.http.get<ApiResponse<MenuResponse>>(`${this.baseUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  createMenu(request: MenuRequest): Observable<MenuResponse> {
    return this.http.post<ApiResponse<MenuResponse>>(this.baseUrl, request)
      .pipe(map(res => res.data));
  }

  updateMenu(id: number, request: MenuRequest): Observable<MenuResponse> {
    return this.http.put<ApiResponse<MenuResponse>>(`${this.baseUrl}/${id}`, request)
      .pipe(map(res => res.data));
  }

  deleteMenu(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => void 0));
  }

  getApplications(): Observable<ApplicationDto[]> {
    return this.http.get<ApplicationDto[]>(this.appsUrl);
  }
}
