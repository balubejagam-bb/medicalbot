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
    
    // Safety net: ensure loading doesn't hang forever (e.g., network hiccups)
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        console.log('AuthContext: Safety timeout reached, clearing loading');
        setLoading(false);
      }
    }, 4000);

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('AuthContext: Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        console.log('AuthContext: Initial session:', session ? 'Found' : 'None');
        
        if (isMounted) {
          setSession(session);
          if (session?.user) {
            await fetchUserProfile(session.user);
          } else {
            setUser(null);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
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
            setUser(null);
            setLoading(false);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (authUser: User) => {
    try {
      console.log('AuthContext: Fetching user profile for:', authUser.id);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
      }

      const userProfile = {
        id: authUser.id,
        email: authUser.email || '',
        first_name: data?.first_name || authUser.user_metadata?.first_name,
        last_name: data?.last_name || authUser.user_metadata?.last_name,
        role: data?.role || authUser.user_metadata?.role,
      };

      console.log('AuthContext: User profile set:', userProfile);
      setUser(userProfile);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      // Set user even if profile fetch fails, using auth metadata
      const fallbackUser = {
        id: authUser.id,
        email: authUser.email || '',
        first_name: authUser.user_metadata?.first_name,
        last_name: authUser.user_metadata?.last_name,
        role: authUser.user_metadata?.role,
      };
      console.log('AuthContext: Setting fallback user:', fallbackUser);
      setUser(fallbackUser);
    } finally {
      console.log('AuthContext: Clearing loading state');
      setLoading(false);
    }
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