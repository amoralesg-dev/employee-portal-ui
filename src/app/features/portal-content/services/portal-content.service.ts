import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AdminEventAttendanceSummaryDto,
  ApiEnvelope,
  AudienceOptionsDto,
  PageDto,
  PortalContentCategory,
  PortalContentDto,
  PortalContentStatus,
  PortalContentType
} from '../models/portal-content.model';

@Injectable({ providedIn: 'root' })
export class PortalContentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/portal-content`;

  list(filters: {
    type?: PortalContentType | null;
    status?: PortalContentStatus | null;
    category?: PortalContentCategory | null;
    q?: string | null;
    page?: number;
    size?: number;
  }): Observable<PageDto<PortalContentDto>> {
    let params = new HttpParams()
      .set('page', String(filters.page ?? 0))
      .set('size', String(filters.size ?? 20));
    if (filters.type) params = params.set('type', filters.type);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.q && filters.q.trim()) params = params.set('q', filters.q.trim());

    return this.http.get<ApiEnvelope<PageDto<PortalContentDto>>>(this.baseUrl, { params })
      .pipe(map(res => res.data));
  }

  getById(id: number): Observable<PortalContentDto> {
    return this.http.get<ApiEnvelope<PortalContentDto>>(`${this.baseUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  getAudienceOptions(): Observable<AudienceOptionsDto> {
    return this.http.get<ApiEnvelope<AudienceOptionsDto>>(`${this.baseUrl}/audience-options`)
      .pipe(map(res => res.data));
  }

  create(payload: PortalContentDto): Observable<PortalContentDto> {
    return this.http.post<ApiEnvelope<PortalContentDto>>(this.baseUrl, payload)
      .pipe(map(res => res.data));
  }

  update(id: number, payload: PortalContentDto): Observable<PortalContentDto> {
    return this.http.put<ApiEnvelope<PortalContentDto>>(`${this.baseUrl}/${id}`, payload)
      .pipe(map(res => res.data));
  }

  updateStatus(id: number, status: PortalContentStatus): Observable<PortalContentDto> {
    return this.http.patch<ApiEnvelope<PortalContentDto>>(`${this.baseUrl}/${id}/status`, { status })
      .pipe(map(res => res.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiEnvelope<void>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => void 0));
  }

  getEventAttendance(id: number, page = 0, size = 20): Observable<AdminEventAttendanceSummaryDto> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<ApiEnvelope<AdminEventAttendanceSummaryDto>>(`${this.baseUrl}/${id}/attendance`, { params })
      .pipe(map(res => res.data));
  }
}
