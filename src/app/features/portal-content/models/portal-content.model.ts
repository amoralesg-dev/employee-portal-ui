export type PortalContentType =
  | 'HERO_NEWS'
  | 'NEWS'
  | 'CAMPAIGN'
  | 'WEEKLY_INFO'
  | 'EVENT'
  | 'QUICK_ACCESS'
  | 'NOTICE';

export type PortalContentCategory = 'SEGURIDAD' | 'PERSONAS' | 'NEGOCIO' | 'CULTURA';

export type PortalContentStatus = 'DRAFT' | 'PUBLISHED' | 'INACTIVE';

export interface PortalContentTranslation {
  language: 'es-MX' | 'en-US';
  title: string;
  summary?: string | null;
  body?: string | null;
  linkLabel?: string | null;
}

export interface PortalContentEvent {
  start?: string | null;
  end?: string | null;
  location?: string | null;
  teamsUrl?: string | null;
}

export interface AdminEventAttendeeDto {
  userId: number;
  displayName?: string | null;
  username: string;
  email: string;
  status: 'GOING' | 'NOT_GOING';
  respondedAt?: string | null;
}

export interface AdminEventAttendanceSummaryDto {
  contentId: number;
  goingCount: number;
  notGoingCount: number;
  attendees: PageDto<AdminEventAttendeeDto>;
}

export interface PortalContentDto {
  id?: number;
  contentType: PortalContentType;
  category?: PortalContentCategory | null;
  status?: PortalContentStatus;
  displayStatus?: string;
  priority: number;
  publishFrom?: string | null;
  publishTo?: string | null;
  imageId?: number | null;
  linkUrl?: string | null;
  linkNewTab?: boolean;
  icon?: string | null;
  event?: PortalContentEvent | null;
  businessUnitIds: number[];
  roleIds: number[];
  translations: PortalContentTranslation[];
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface AudienceOptionItem {
  id: number;
  code: string;
  name: string;
}

export interface AudienceOptionsDto {
  businessUnits: AudienceOptionItem[];
  roles: AudienceOptionItem[];
}

export interface PortalMediaDto {
  id: number;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  createdAt?: string;
}

export interface PageDto<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ApiEnvelope<T> {
  status: number;
  message: string;
  data: T;
}
