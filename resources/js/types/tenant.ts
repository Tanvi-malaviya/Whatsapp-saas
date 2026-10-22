export type TenantRole = 'Owner' | 'Admin' | 'Agent' | 'Read-only';

export type TenantOrganization = {
    id: string;
    name: string;
    slug: string;
    role: TenantRole;
    status?: string;
    timezone?: string;
};

export type TenantData = {
    current: TenantOrganization | null;
    all: TenantOrganization[];
};
