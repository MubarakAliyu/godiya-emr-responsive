import { useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { EMRSidebar } from '../components/emr-sidebar';
import { EMRHeader } from '../components/emr-header';
import { SidebarInset, SidebarProvider } from '@/app/components/ui/sidebar';
import { getCurrentUser } from '../utils/auth';
import { useEMRStore } from '../store/emr-store';

// Helper to generate breadcrumbs from path
function getBreadcrumbs(pathname: string) {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs = [{ label: 'Dashboard', path: '/emr/dashboard' }];

  // Map paths to readable labels
  const pathMap: Record<string, string> = {
    'staffs': 'Staffs Management',
    'departments': 'Departments',
    'finance': 'Finance',
    'cms': 'Staff Attendance Analytics',
    'patients': 'Patient Management',
    'inpatient': 'Inpatient',
    'outpatient': 'Outpatient',
    'er': 'ER Patients',
    'icu': 'ICU Patients',
    'copd': 'COPD Patients',
    'appointments': 'Appointments',
    'doctors': 'Doctors Management',
    'nurse-desk': 'Nurse Desk',
    'rooms': 'Hospital Bed',
    'billing': 'Billing & Payments',
    'pharmacy': 'Pharmacy',
    'laboratory': 'Laboratory',
    'reports': 'Reports Center',
    'admin': 'Administration',
    'roles': 'Roles & Permissions',
    'users': 'User Management',
    'audit': 'Audit Logs',
    'settings': 'Settings',
    'notifications': 'Notifications Center',
  };

  // Build breadcrumb trail
  let currentPath = '';
  for (let i = 2; i < paths.length; i++) {
    currentPath += '/' + paths[i];
    const label = pathMap[paths[i]] || paths[i];
    breadcrumbs.push({
      label,
      path: `/emr/dashboard${currentPath}`,
    });
  }

  // If we're at the dashboard root, just show "Home"
  if (pathname === '/emr/dashboard') {
    return [{ label: 'Dashboard', path: '/emr/dashboard' }, { label: 'Home' }];
  }

  return breadcrumbs;
}

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { recordStaffLogin, recordStaffLogout } = useEMRStore();
  const routeRenderKey = `${location.pathname}${location.search}${location.hash}`;

  useEffect(() => {
    // Check if user is authenticated
    const auth = getCurrentUser();
    if (!auth) {
      navigate('/emr/login');
      return;
    }

    // Check if we've already recorded login for this session
    const sessionKey = `attendance_logged_${auth.staffId}_${new Date().toISOString().split('T')[0]}`;
    const alreadyLogged = sessionStorage.getItem(sessionKey);

    // Only record login ONCE per browser session
    if (auth.staffId && !alreadyLogged) {
      recordStaffLogin(auth.staffId);
      // Mark as logged for this session
      sessionStorage.setItem(sessionKey, 'true');
    }

    // Record logout only when user closes browser/tab
    const handleBeforeUnload = () => {
      if (auth.staffId) {
        recordStaffLogout(auth.staffId);
        // Clear the session flag so next login will be recorded
        sessionStorage.removeItem(sessionKey);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup - only remove event listener, DON'T record logout on unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [navigate]); // Only depend on navigate, not the record functions

  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <SidebarProvider defaultOpen>
      <EMRSidebar />

      <SidebarInset className="min-w-0 bg-muted/30 print:bg-white">
        <div className="flex min-h-svh flex-1 flex-col overflow-hidden print:min-h-0 print:overflow-visible">
          <EMRHeader breadcrumbs={breadcrumbs} />

          <main className="flex-1 overflow-y-auto overflow-x-hidden print:overflow-visible">
            <div key={routeRenderKey} className="min-w-0">
              <Outlet key={routeRenderKey} />
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
