import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: 'healthcare_professional' | 'nurse' | 'patient' | 'family';
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata: {
    first_name: string;
    last_name: string;
    username: string;
    role: string;
  }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    // Initialize session check
    const initializeAuth = async () => {
      try {
        console.log('AuthContext: Initializing authentication...');
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (isMounted) {
            setSession(null);
            setUser(null);
            setLoading(false);
          }
          return;
        }

        console.log('AuthContext: Session check complete:', session ? 'Session found' : 'No session');
        
        if (isMounted) {
          setSession(session);
          if (session?.user) {
            // User is logged in, fetch profile
            await fetchUserProfile(session.user);
          } else {
            // No session, user is not logged in
            setUser(null);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isMounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      }
    };

    // Start initialization
    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state changed:', event, session ? 'Session exists' : 'No session');
        
        if (!isMounted) {
          return;
        }
        
        try {
          setSession(session);
          if (session?.user) {
            await fetchUserProfile(session.user);
          } else {
            console.log('AuthContext: No session, clearing user and loading');
            setUser(null);
            setLoading(false);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
        }
        
        // Additional safety: ensure loading is always cleared after auth state change
        if (isMounted) {
          setTimeout(() => {
            console.log('AuthContext: Safety check - ensuring loading is cleared');
            setLoading(false);
          }, 100);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (authUser: User) => {
    console.log('AuthContext: Starting fetchUserProfile for:', authUser.id);
    
    try {
      // First, set a basic user object immediately to prevent redirect
      const basicUser = {
        id: authUser.id,
        email: authUser.email || '',
        first_name: authUser.user_metadata?.first_name,
        last_name: authUser.user_metadata?.last_name,
        role: authUser.user_metadata?.role,
      };
      
      console.log('AuthContext: Setting basic user and clearing loading...');
      setUser(basicUser);
      setLoading(false); // Clear loading immediately after setting user
      
      console.log('AuthContext: Basic user set, loading cleared:', basicUser);
      
      // Then try to fetch additional profile data in background
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching additional profile data:', error);
        return; // Exit early but user is already set
      }

      // Update with profile data if available
      if (data) {
        const fullUserProfile = {
          id: authUser.id,
          email: authUser.email || '',
          first_name: data.first_name || authUser.user_metadata?.first_name,
          last_name: data.last_name || authUser.user_metadata?.last_name,
          role: data.role || authUser.user_metadata?.role,
        };

        console.log('AuthContext: Updating with full profile data:', fullUserProfile);
        setUser(fullUserProfile);
      }
      
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      
      // Still set user even if profile fetch fails
      const fallbackUser = {
        id: authUser.id,
        email: authUser.email || '',
        first_name: authUser.user_metadata?.first_name,
        last_name: authUser.user_metadata?.last_name,
        role: authUser.user_metadata?.role,
      };
      
      console.log('AuthContext: Setting fallback user and clearing loading:', fallbackUser);
      setUser(fallbackUser);
      setLoading(false);
    }
    
    console.log('AuthContext: fetchUserProfile completed');
  };

  const signUp = async (
    email: string,
    password: string,
    metadata: {
      first_name: string;
      last_name: string;
      username: string;
      role: string;
    }
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      throw error;
    }

    // Create user profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            username: metadata.username,
            email,
            first_name: metadata.first_name,
            last_name: metadata.last_name,
            role: metadata.role,
          },
        ]);

      if (profileError) {
        console.error('Error creating user profile:', profileError);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    // Start loading and perform sign-in
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      throw error;
    }

    // If we got the session/user immediately, set them to avoid UI race conditions
    if (data?.user) {
      setSession(data.session);
      await fetchUserProfile(data.user);
    } else {
      // Fallback: Wait until session is available
      await waitForSession(3000);
    }
  };

  // Helper: wait for a Supabase session or timeout
  const waitForSession = async (timeoutMs = 3000): Promise<void> => {
    const start = Date.now();
    return new Promise((resolve) => {
      const check = async () => {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          resolve(undefined);
          return;
        }
        if (Date.now() - start > timeoutMs) {
          resolve(undefined);
          return;
        }
        setTimeout(check, 100);
      };
      check();
    });
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};