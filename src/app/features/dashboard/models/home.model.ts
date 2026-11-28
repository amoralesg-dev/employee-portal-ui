import { PortalContentCategory, PortalContentType } from '../../portal-content/models/portal-content.model';

export interface HomeLinkInfo {
  url: string;
  label?: string | null;
  newTab: boolean;
}

export interface HomeEventInfo {
  start?: string | null;
  end?: string | null;
  location?: string | null;
  teamsUrl?: string | null;
}

export type EventAttendanceStatus = 'GOING' | 'NOT_GOING';

export interface EventAttendanceDto {
  contentId: number;
  status: EventAttendanceStatus | null;
  respondedAt: string | null;
  canRespond: boolean;
}

export interface HomeItemDto {
  id: number;
  type: PortalContentType;
  category?: PortalContentCategory | null;
  language: string;
  title: string;
  summary?: string | null;
  body?: string | null;
  hasBody: boolean;
  imageId?: number | null;
  link?: HomeLinkInfo | null;
  icon?: string | null;
  event?: HomeEventInfo | null;
  publishFrom?: string | null;
}

export interface HomeResponseDto {
  requestedLanguage: string;
  generatedAt: string;
  hero: HomeItemDto | null;
  secondaryNews: HomeItemDto[];
  campaigns: HomeItemDto[];
  weeklyInfo: HomeItemDto[];
  events: HomeItemDto[];
  quickAccess: HomeItemDto[];
  notices: HomeItemDto[];
}
