export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

export interface MenuResponse {
  id: number;
  code: string;
  label: string;
  route: string;
  icon: string;
  orderIndex: number;
  parentId: number | null;
  applicationId: number | null;
  children?: MenuResponse[];
}

export interface MenuRequest {
  code: string;
  label: string;
  route: string;
  icon: string;
  orderIndex: number;
  parentId: number | null;
  applicationId: number;
}
