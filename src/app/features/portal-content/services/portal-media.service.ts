import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiEnvelope, PortalMediaDto } from '../models/portal-content.model';

@Injectable({ providedIn: 'root' })
export class PortalMediaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/portal-media`;

  upload(file: File): Observable<PortalMediaDto> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiEnvelope<PortalMediaDto>>(this.baseUrl, formData)
      .pipe(map(res => res.data));
  }
}
