export interface ApiResponse<T> {
  status: number;
  message: String;
  data: T;
  timestamp: string;
}

export interface RoleResponse {
  id: number;
  code: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  roles: RoleResponse[];
}

export interface UserRequest {
  username: string;
  email: string;
  password?: string;
}

export interface UserUpdateRequest {
  username: string;
  email: string;
}

export interface UpdateStatusRequest {
  enabled: boolean;
}

export interface AssignRolesRequest {
  roleIds: number[];
}
