export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

export interface PermissionResponse {
  id: number;
  code: string;
  description: string;
  createdAt: string;
  applicationId?: number;
}

export interface PermissionRequest {
  code: string;
  description?: string;
}
