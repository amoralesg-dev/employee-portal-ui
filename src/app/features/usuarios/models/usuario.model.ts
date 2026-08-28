export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface AuthBusinessUnit {
  id: number;
  code: string;
  name: string;
  parentId?: number | null;
  enabled?: boolean;
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
  businessUnits: AuthBusinessUnit[];
  hasAllBusinessUnits: boolean;
}

export interface UserRequest {
  username: string;
  email: string;
  password?: string;
  hasAllBusinessUnits?: boolean;
  businessUnitIds?: number[];
}

export interface UserUpdateRequest {
  username: string;
  email: string;
  hasAllBusinessUnits?: boolean;
  businessUnitIds?: number[];
}

export interface UpdateStatusRequest {
  enabled: boolean;
}

export interface AssignRolesRequest {
  roleIds: number[];
}

