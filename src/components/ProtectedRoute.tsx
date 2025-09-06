import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, session } = useAuth();
  const location = useLocation();
  const [localLoading, setLocalLoading] = useState(true);
  
  // Use local loading state with a safety timeout
  useEffect(() => {
    // Initially sync with auth loading state
    setLocalLoading(loading);
    
    // Safety timeout to prevent indefinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('ProtectedRoute - Safety timeout reached, forcing render decision');
        setLocalLoading(false);
      }
    }, 5000); // 5 second max wait
    
    return () => clearTimeout(timeout);
  }, [loading]);
  
  // Detailed logging
  useEffect(() => {
    console.log('ProtectedRoute - Current state:', {
      user: user ? `${user.email} (${user.id})` : 'null',
      loading,
      localLoading,
      session: session ? `exists (${session.user.id})` : 'null',
      pathname: location.pathname
    });
  }, [user, loading, localLoading, session, location.pathname]);
  
  // When session exists but user is null, attempt recovery from session
  useEffect(() => {
    if (session?.user && !user && !loading) {
      console.log('ProtectedRoute - Detected session but no user, attempting recovery');
      // This means we have a session but user profile failed to load
      // We can construct a minimal user object from the session
      // This is a workaround for production issues
      const recoveredUser = {
        id: session.user.id,
        email: session.user.email || '',
        // Any other properties would be undefined, but that's better than redirect
      };
      console.log('ProtectedRoute - Recovered user from session:', recoveredUser);
      // We can't directly set user here as it's from the AuthContext
      // but we can allow rendering the protected content
      setLocalLoading(false);
    }
  }, [session, user, loading]);

  // Show loading spinner while authentication is being determined
  if (localLoading) {
    console.log('ProtectedRoute - Still loading authentication, showing spinner');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your account...</p>
          <p className="text-xs text-muted-foreground">
            Checking authentication status...
          </p>
        </div>
      </div>
    );
  }

  // Special case: If we have a session but no user, we can still render protected content
  // This handles the case where user profile fetch failed but the user is authenticated
  if (session?.user && !user) {
    console.log('ProtectedRoute - Session exists without user, allowing access anyway');
    return <>{children}</>;
  }

  // Regular case: If not loading and no user/session, redirect to login
  if (!user && !session?.user) {
    console.log('ProtectedRoute - Authentication check complete: No user found, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected content
  console.log('ProtectedRoute - User authenticated successfully, rendering protected content');
  return <>{children}</>;
};

export default ProtectedRoute;