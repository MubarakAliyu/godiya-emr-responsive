import { useLocation } from 'react-router-dom';

/**
 * Returns the base path for patient navigation, resolved from the current URL.
 * This allows shared patient components to work in both the Admin (/emr/dashboard)
 * and Reception (/emr/reception) layouts without hardcoded paths.
 *
 * Examples:
 *   /emr/dashboard/patients → /emr/dashboard/patients
 *   /emr/reception/patients → /emr/reception/patients
 */
export function usePatientBasePath(): string {
    const { pathname } = useLocation();

    // Determine the layout prefix from the current path
    if (pathname.startsWith('/emr/reception')) {
        return '/emr/reception/patients';
    }
    if (pathname.startsWith('/emr/nurse')) {
        return '/emr/nurse/patients';
    }
    if (pathname.startsWith('/emr/doctor')) {
        return '/emr/doctor/patients';
    }
    // Default: super admin dashboard
    return '/emr/dashboard/patients';
}
