import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { BusinessUnitDto } from '../models/business-unit.model';
import { ApiResponse, UserResponse } from '../../usuarios/models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class BusinessUnitService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/business-units`;

  getBusinessUnits(): Observable<BusinessUnitDto[]> {
    return this.http.get<ApiResponse<BusinessUnitDto[]>>(this.baseUrl).pipe(
      map(response => response.data)
    );
  }

  getBusinessUnitTree(): Observable<BusinessUnitDto[]> {
    return this.http.get<ApiResponse<BusinessUnitDto[]>>(`${this.baseUrl}/tree`).pipe(
      map(response => response.data)
    );
  }

  getBusinessUnitById(id: number): Observable<BusinessUnitDto> {
    return this.http.get<ApiResponse<BusinessUnitDto>>(`${this.baseUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  createBusinessUnit(dto: BusinessUnitDto): Observable<BusinessUnitDto> {
    return this.http.post<ApiResponse<BusinessUnitDto>>(this.baseUrl, dto).pipe(
      map(response => response.data)
    );
  }

  updateBusinessUnit(id: number, dto: BusinessUnitDto): Observable<BusinessUnitDto> {
    return this.http.put<ApiResponse<BusinessUnitDto>>(`${this.baseUrl}/${id}`, dto).pipe(
      map(response => response.data)
    );
  }

  updateStatus(id: number, enabled: boolean): Observable<BusinessUnitDto> {
    return this.http.patch<ApiResponse<BusinessUnitDto>>(`${this.baseUrl}/${id}/status`, { enabled }).pipe(
      map(response => response.data)
    );
  }

  deleteBusinessUnit(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`).pipe(
      map(() => undefined)
    );
  }

  getBusinessUnitUsers(id: number): Observable<UserResponse[]> {
    return this.http.get<ApiResponse<UserResponse[]>>(`${this.baseUrl}/${id}/users`).pipe(
      map(response => response.data)
    );
  }

  replaceBusinessUnitUsers(id: number, userIds: number[]): Observable<void> {
    return this.http.put<ApiResponse<void>>(`${this.baseUrl}/${id}/users`, userIds).pipe(
      map(() => undefined)
    );
  }
}
