import React, { createContext, useContext, ReactNode } from 'react';
import { UserPermissions, UserRole, getPermissions, getAuthState } from '@/app/emr/utils/auth';

interface PermissionsContextType {
    permissions: UserPermissions;
    role: UserRole | null;
    hasPermission: (module: string, action: 'view' | 'create' | 'edit' | 'delete' | 'export' | 'approve') => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
    const authState = getAuthState();
    const permissions = authState?.permissions || {};
    const role = authState?.user?.role || null;

    const hasPermission = (module: string, action: 'view' | 'create' | 'edit' | 'delete' | 'export' | 'approve') => {
        // Super Admin has all permissions
        if (role === 'Super Admin') return true;

        const modulePerms = permissions[module];
        if (!modulePerms) return false;

        return !!modulePerms[action];
    };

    return (
        <PermissionsContext.Provider value={{ permissions, role, hasPermission }}>
            {children}
        </PermissionsContext.Provider>
    );
}

export function usePermissions() {
    const context = useContext(PermissionsContext);
    if (context === undefined) {
        throw new Error('usePermissions must be used within a PermissionsProvider');
    }
    return context;
}
