/**
 * Authentication Utility
 * Interacts with /api/auth.php for database-backed RBAC
 */

export type UserRole =
  | 'Super Administrator'
  | 'Receptionist'
  | 'Cashier'
  | 'Doctor'
  | 'Laboratory'
  | 'Pharmacy'
  | 'Nurse';

export interface UserPermissions {
  [module: string]: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    export: boolean;
    approve: boolean;
  };
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleId: string;
  department: string | null;
  staffId: string;
  phone_number: string;
}

export interface AuthState {
  user: AuthUser | null;
  permissions: UserPermissions;
  sessionTimeout: number; // minutes
}

// ─────────────────────────────────────────────────────────────────────────────
// API CALLS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Login user via API
 */
export async function loginUser(email: string, password: string, remember: boolean = false) {
  const response = await fetch('/api/auth.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Login failed');
  }

  // Store data locally based on remember me
  storeAuthData(data, remember);

  return data;
}

/**
 * Validate current session with server
 */
export async function validateSession() {
  try {
    const response = await fetch('/api/auth.php', {
      credentials: 'include'
    });
    if (response.ok) {
      const data = await response.json();
      // Update local storage with fresh data from server
      const isPersistent = !!localStorage.getItem('emr_auth');
      storeAuthData(data, isPersistent);
      return data;
    } else {
      // Session invalid on server
      logoutLocal();
      return null;
    }
  } catch (error) {
    console.error('Session validation failed:', error);
    return null;
  }
}

/**
 * Logout user
 */
export async function logoutUser() {
  try {
    await fetch('/api/auth.php', {
      method: 'DELETE',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Logout API call failed:', error);
  } finally {
    logoutLocal();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STATE MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Store auth data in local storage
 */
export function storeAuthData(data: AuthState, persistent: boolean = false) {
  const authPayload = JSON.stringify({
    ...data,
    lastActive: new Date().toISOString()
  });

  if (persistent) {
    localStorage.setItem('emr_auth', authPayload);
    sessionStorage.removeItem('emr_auth');
  } else {
    sessionStorage.setItem('emr_auth', authPayload);
    localStorage.removeItem('emr_auth');
  }
}

/**
 * Clear local auth data
 */
function logoutLocal() {
  localStorage.removeItem('emr_auth');
  sessionStorage.removeItem('emr_auth');
}

/**
 * Get the full auth state
 */
export function getAuthState(): AuthState | null {
  const authData = localStorage.getItem('emr_auth') || sessionStorage.getItem('emr_auth');
  if (!authData) return null;

  try {
    return JSON.parse(authData);
  } catch (e) {
    return null;
  }
}

/**
 * Check if authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAuthState();
}

/**
 * Get current user object
 */
export function getCurrentUser(): AuthUser | null {
  return getAuthState()?.user || null;
}

/**
 * Get current permissions
 */
export function getPermissions(): UserPermissions {
  return getAuthState()?.permissions || {};
}

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get dashboard path based on role
 */
export function getDashboardPath(role: UserRole): string {
  const pathMap: Record<UserRole, string> = {
    'Super Administrator': '/emr/dashboard',
    'Receptionist': '/emr/reception/dashboard',
    'Cashier': '/emr/cashier/dashboard',
    'Doctor': '/emr/doctor/dashboard',
    'Laboratory': '/emr/laboratory-staff/dashboard',
    'Pharmacy': '/emr/pharmacy-staff/dashboard',
    'Nurse': '/emr/nurse/dashboard',
  };
  return pathMap[role] || '/emr/dashboard';
}