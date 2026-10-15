export interface BusinessUnitDto {
    id?: number;
    code: string;
    name: string;
    parentId?: number | null;
    enabled: boolean;
    createdAt?: string;
    updatedAt?: string;
    children?: BusinessUnitDto[];
}

