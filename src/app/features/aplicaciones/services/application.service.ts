import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApplicationDto } from '../models/application.model';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/applications`;

  getApplications(): Observable<ApplicationDto[]> {
    return this.http.get<ApplicationDto[]>(this.baseUrl);
  }

  getActiveApplications(): Observable<ApplicationDto[]> {
    return this.http.get<ApplicationDto[]>(`${this.baseUrl}/active`);
  }

  getApplicationById(id: number): Observable<ApplicationDto> {
    return this.http.get<ApplicationDto>(`${this.baseUrl}/${id}`);
  }

  createApplication(dto: ApplicationDto): Observable<ApplicationDto> {
    return this.http.post<ApplicationDto>(this.baseUrl, dto);
  }

  updateApplication(id: number, dto: ApplicationDto): Observable<ApplicationDto> {
    return this.http.put<ApplicationDto>(`${this.baseUrl}/${id}`, dto);
  }

  deleteApplication(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
