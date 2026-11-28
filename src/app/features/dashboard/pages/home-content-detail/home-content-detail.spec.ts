import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { MessageService } from 'primeng/api';
import { RassiniI18nService, Toast } from '@rassini/rassini-ui';
import { HomeContentDetailPage } from './home-content-detail';
import { HomeService } from '../../services/home.service';
import { HomeItemDto } from '../../models/home.model';

describe('HomeContentDetailPage (Calendar, RSVP & Single Load)', () => {
  const mockEvent: HomeItemDto = {
    id: 12,
    type: 'EVENT',
    category: 'CULTURA',
    language: 'es-MX',
    title: 'Town Hall Rassini 2026',
    summary: 'Sesión trimestral',
    body: 'Detalle del evento',
    hasBody: true,
    imageId: null,
    link: null,
    icon: null,
    event: {
      start: '2026-11-27T10:59:00',
      end: '2026-11-27T11:00:00',
      location: 'Auditorio Corporativo / Microsoft Teams',
      teamsUrl: 'https://teams.microsoft.com/l/meetup-join/demo'
    },
    publishFrom: '2026-11-25T16:06:00'
  };

  let homeServiceMock: {
    getDetail: ReturnType<typeof vi.fn>;
    getMyAttendance: ReturnType<typeof vi.fn>;
    upsertMyAttendance: ReturnType<typeof vi.fn>;
    downloadCalendar: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    homeServiceMock = {
      getDetail: vi.fn(() => of(mockEvent)),
      getMyAttendance: vi.fn(() => of({ contentId: 12, status: null, respondedAt: null, canRespond: true })),
      upsertMyAttendance: vi.fn((_id, status) => of({ contentId: 12, status, respondedAt: '2026-11-25T17:20:00', canRespond: true })),
      downloadCalendar: vi.fn(() => of(new Blob(['BEGIN:VCALENDAR'], { type: 'text/calendar' })))
    };

    await TestBed.configureTestingModule({
      imports: [HomeContentDetailPage],
      providers: [
        MessageService,
        Toast,
        RassiniI18nService,
        { provide: HomeService, useValue: homeServiceMock },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '12' } } } },
        { provide: Router, useValue: { navigate: vi.fn(), navigateByUrl: vi.fn() } }
      ]
    }).compileComponents();
  });

  it('should load content and attendance exactly once on init (no duplicate requests)', () => {
    const fixture = TestBed.createComponent(HomeContentDetailPage);
    fixture.detectChanges();

    expect(homeServiceMock.getDetail).toHaveBeenCalledTimes(1);
    expect(homeServiceMock.getMyAttendance).toHaveBeenCalledTimes(1);
  });

  it('should keep Calendar enabled by default and disabled only while downloading', () => {
    const fixture = TestBed.createComponent(HomeContentDetailPage);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;

    expect(cmp.downloadingCalendar()).toBe(false);
    cmp.downloadingCalendar.set(true);
    expect(cmp.downloadingCalendar()).toBe(true);
  });

  it('should allow RSVP when status is null & canRespond=true, update GOING/NOT_GOING, and block when canRespond=false or saving', () => {
    const fixture = TestBed.createComponent(HomeContentDetailPage);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;

    expect(cmp.attendance()?.status).toBeNull();
    expect(cmp.attendance()?.canRespond).toBe(true);

    cmp.respondAttendance('GOING');
    expect(cmp.attendance()?.status).toBe('GOING');

    cmp.respondAttendance('NOT_GOING');
    expect(cmp.attendance()?.status).toBe('NOT_GOING');

    // canRespond=false blocks further updates
    cmp.attendance.set({ contentId: 12, status: 'NOT_GOING', respondedAt: '2026-11-25T17:20:00', canRespond: false });
    const callsBefore = homeServiceMock.upsertMyAttendance.mock.calls.length;
    cmp.respondAttendance('GOING');
    expect(homeServiceMock.upsertMyAttendance.mock.calls.length).toBe(callsBefore);

    // savingAttendance=true blocks double submit
    cmp.attendance.set({ contentId: 12, status: null, respondedAt: null, canRespond: true });
    cmp.savingAttendance.set(true);
    cmp.respondAttendance('GOING');
    expect(homeServiceMock.upsertMyAttendance.mock.calls.length).toBe(callsBefore);
  });
});
