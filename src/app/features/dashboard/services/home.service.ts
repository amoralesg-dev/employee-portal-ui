import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiEnvelope } from '../../portal-content/models/portal-content.model';
import { HomeItemDto, HomeResponseDto, EventAttendanceDto, EventAttendanceStatus } from '../models/home.model';

@Injectable({ providedIn: 'root' })
export class HomeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/home`;

  getHome(lang: string): Observable<HomeResponseDto> {
    const params = new HttpParams().set('lang', lang || 'es-MX');
    return this.http.get<ApiEnvelope<HomeResponseDto>>(this.baseUrl, { params })
      .pipe(map(res => res.data));
  }

  getDetail(id: number, lang: string): Observable<HomeItemDto> {
    const params = new HttpParams().set('lang', lang || 'es-MX');
    return this.http.get<ApiEnvelope<HomeItemDto>>(`${this.baseUrl}/${id}`, { params })
      .pipe(map(res => res.data));
  }

  downloadCalendar(id: number, lang: string): Observable<Blob> {
    const params = new HttpParams().set('lang', lang || 'es-MX');
    return this.http.get(`${this.baseUrl}/${id}/calendar`, { params, responseType: 'blob' });
  }

  getMyAttendance(id: number): Observable<EventAttendanceDto> {
    return this.http.get<ApiEnvelope<EventAttendanceDto>>(`${this.baseUrl}/${id}/attendance`)
      .pipe(map(res => res.data));
  }

  upsertMyAttendance(id: number, status: EventAttendanceStatus): Observable<EventAttendanceDto> {
    return this.http.put<ApiEnvelope<EventAttendanceDto>>(`${this.baseUrl}/${id}/attendance`, { status })
      .pipe(map(res => res.data));
  }

  deleteMyAttendance(id: number): Observable<void> {
    return this.http.delete<ApiEnvelope<void>>(`${this.baseUrl}/${id}/attendance`)
      .pipe(map(() => void 0));
  }
}
