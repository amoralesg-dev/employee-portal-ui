export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface PermissionResponse {
  id: number;
  code: string;
  name: string;
  description: string;
  module: string;
  createdAt: string;
}

export interface RoleResponse {
  id: number;
  code: string;
  name: string;
  description: string;
  createdAt: string;
  permissions?: PermissionResponse[];
}

export interface RoleRequest {
  code: string;
  name: string;
  description: string;
}

export interface AssignPermissionsRequest {
  permissionIds: number[];
}
