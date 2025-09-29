import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  userStatus: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserRole = async () => {
    if (!session?.user) {
      setUserRole(null);
      setUserStatus(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, status')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
        setUserStatus(null);
      } else {
        setUserRole(data?.role || null);
        setUserStatus(data?.status || null);
      }
    } catch (error) {
      console.error('Error in refreshUserRole:', error);
      setUserRole(null);
      setUserStatus(null);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Refresh user role when session changes
        if (session?.user) {
          setTimeout(() => {
            refreshUserRole();
          }, 100);
        } else {
          setUserRole(null);
          setUserStatus(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      refreshUserRole();
    }
  }, [session]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: metadata || {},
      },
    });
    return { error };
  };

  const signOut = async () => {
    // Clear user state first to prevent redirects
    setUser(null);
    setSession(null);
    setUserRole(null);
    setUserStatus(null);
    
    // Clear demo role from localStorage
    try { 
      localStorage.removeItem('demo_role'); 
    } catch (error) {
      console.log('Error removing demo_role:', error);
    }
    
// Then sign out from Supabase (non-blocking redirect safety)
try {
  await supabase.auth.signOut();
} catch (e) {
  console.warn('Supabase signOut error (ignored):', e);
} finally {
  // Force route change even in demo mode or if guards fail
  try { window.location.replace('/'); } catch {}
}
  };
  const value = {
    user,
    session,
    userRole,
    userStatus,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};