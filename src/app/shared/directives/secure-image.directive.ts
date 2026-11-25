import { Directive, ElementRef, Input, OnChanges, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

const imageObjectUrlCache = new Map<number, string>();

@Directive({
  selector: 'img[appSecureImage]',
  standalone: true
})
export class SecureImageDirective implements OnChanges, OnDestroy {
  @Input('appSecureImage') mediaId: number | null | undefined;

  private readonly el = inject(ElementRef<HTMLImageElement>);
  private readonly http = inject(HttpClient);
  private sub?: Subscription;

  ngOnChanges(): void {
    this.sub?.unsubscribe();
    const img = this.el.nativeElement;

    if (!this.mediaId) {
      img.removeAttribute('src');
      return;
    }

    const cached = imageObjectUrlCache.get(this.mediaId);
    if (cached) {
      img.src = cached;
      return;
    }

    const id = this.mediaId;
    const url = `${environment.apiBaseUrl}/portal-media/${id}/content`;
    this.sub = this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        imageObjectUrlCache.set(id, objectUrl);
        img.src = objectUrl;
      },
      error: () => {
        img.removeAttribute('src');
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
