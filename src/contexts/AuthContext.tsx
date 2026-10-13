import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

type Profile = Record<string, unknown> & { id?: string };

export async function getProfile(userId: string): Promise<Profile | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
  return data;
}
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithUsername: (username: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithUsername: (details: { name: string; username: string; email: string; password: string }) => Promise<{ error: Error | null; confirmationRequired: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    const profileData = await getProfile(user.id);
    setProfile(profileData);
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase
      .auth
      .getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          getProfile(session.user.id).then(setProfile);
        }
      })
      .catch(error => {
        const message = error instanceof Error ? error.message : 'Unknown auth error';
        toast.error(`获取用户信息失败: ${message}`);
      })
      .finally(() => {
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        getProfile(session.user.id).then(setProfile);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithUsername = async (username: string, password: string) => {
    try {
      if (!supabase) {
        return { error: new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.') };
      }

      const email = username.trim().toLowerCase();
      if (!email.includes('@')) {
        return { error: new Error('Sign in with the email address registered to your account.') };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      const profileData = await getProfile(data.user.id);
      if (!profileData) {
        await supabase.auth.signOut();
        throw new Error('Your account has no PetReg profile. Apply the Supabase auth profile trigger migration and contact an administrator.');
      }
      if (profileData.status !== 'active') {
        await supabase.auth.signOut();
        throw new Error('This account is suspended. Contact an administrator.');
      }
      setProfile(profileData);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUpWithUsername = async (details: { name: string; username: string; email: string; password: string }) => {
    try {
      if (!supabase) {
        return {
          error: new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'),
          confirmationRequired: false,
        };
      }

      const { data, error } = await supabase.auth.signUp({
        email: details.email.trim().toLowerCase(),
        password: details.password,
        options: {
          data: {
            name: details.name.trim(),
            username: details.username.trim().toLowerCase(),
          },
        },
      });

      if (error) throw error;
      if (data.session && data.user) {
        const profileData = await getProfile(data.user.id);
        if (!profileData) {
          await supabase.auth.signOut();
          throw new Error('Your account was created but its PetReg profile is missing. Apply the Supabase auth profile trigger migration.');
        }
        setProfile(profileData);
      }
      return { error: null, confirmationRequired: !data.session };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Account registration failed.'),
        confirmationRequired: false,
      };
    }
  };

  const signOut = async () => {
    if (!supabase) {
      setUser(null);
      setProfile(null);
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithUsername, signUpWithUsername, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
