import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, session } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log('ProtectedRoute - Current state:', {
      user: user ? `${user.email} (${user.id})` : 'null',
      loading,
      session: session ? 'exists' : 'null',
      pathname: location.pathname
    });
  }, [user, loading, session, location.pathname]);

  // Show loading spinner while authentication is being determined
  if (loading) {
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

  // If not loading and no user, redirect to login
  if (!user) {
    console.log('ProtectedRoute - Authentication check complete: No user found, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected content
  console.log('ProtectedRoute - User authenticated successfully, rendering protected content');
  return <>{children}</>;
};

export default ProtectedRoute;