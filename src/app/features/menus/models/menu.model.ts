export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

export type TargetType = 'INTERNO' | 'EXTERNO';
export type AppType = 'INTERNA' | 'TERCERO' | 'SAAS';
export type AuthType = 'NONE' | 'SSO_IAM' | 'OIDC' | 'CREDENCIALES_PROPIAS';

export interface MenuParameterDto {
  id?: number;
  paramName: string;
  paramValue: string;
  active?: boolean;
}

export interface MenuResponse {
  id: number;
  code: string;
  label: string;
  route: string;
  icon: string;
  orderIndex: number;
  targetType?: TargetType;
  externalUrl?: string;
  openInNewTab?: boolean;
  appType?: AppType;
  authType?: AuthType;
  resolvedUrl?: string;
  parameters?: MenuParameterDto[];
  parentId: number | null;
  applicationId: number | null;
  children?: MenuResponse[];
}

export interface MenuRequest {
  code: string;
  label: string;
  route?: string;
  icon: string;
  orderIndex: number;
  targetType?: TargetType;
  externalUrl?: string;
  openInNewTab?: boolean;
  appType?: AppType;
  authType?: AuthType;
  parameters?: MenuParameterDto[];
  parentId: number | null;
  applicationId: number;
}
