import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, validateSession, logoutUser, getAuthState } from '@/app/emr/utils/auth';
import { PermissionsProvider } from './PermissionsContext';
import { toast } from 'sonner';

interface AuthGuardProps {
    children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
    const location = useLocation();
    const [isVerifying, setIsVerifying] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(isAuthenticated());

    useEffect(() => {
        const checkAuth = async () => {
            // If we don't even have a local token, stop here
            if (!isAuthorized) {
                setIsVerifying(false);
                return;
            }

            // Verify session with server on mount
            const sessionData = await validateSession();
            if (!sessionData) {
                setIsAuthorized(false);
                toast.error('Session expired. Please log in again.');
            }
            setIsVerifying(false);
        };

        checkAuth();

        // Set up inactivity timer
        let timeoutId: any;
        const authData = getAuthState();
        const timeoutMinutes = authData?.sessionTimeout || 30;

        const resetTimer = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                logoutUser();
                window.location.href = '/emr/login';
                toast.info('Logged out due to inactivity');
            }, timeoutMinutes * 60 * 1000);
        };

        const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
        events.forEach(event => window.addEventListener(event, resetTimer));
        resetTimer();

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, [location.pathname]);

    if (isVerifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/20">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground animate-pulse">Verifying session...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        // Redirect to login but save the current location they were trying to go to
        return <Navigate to="/emr/login" state={{ from: location }} replace />;
    }

    return (
        <PermissionsProvider>
            {children}
        </PermissionsProvider>
    );
}
