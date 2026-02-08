import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  ensureLocalUser,
  ensureProfile,
  getLocalUser,
  setLocalUser,
  type LocalUser,
} from "@/lib/localData";
 
export interface User extends LocalUser {}

export interface Session {
  user: User;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}
 
 const AuthContext = createContext<AuthContextType | undefined>(undefined);
 
 export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const existing = getLocalUser();
    if (existing) {
      setUser(existing);
      setSession({ user: existing });
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, _password: string, displayName?: string) => {
    const baseUser = ensureLocalUser(email, displayName);
    const nextUser: User = {
      ...baseUser,
      email,
      user_metadata: {
        display_name: displayName || baseUser.user_metadata?.display_name || email.split("@")[0],
      },
    };

    setLocalUser(nextUser);
    ensureProfile(nextUser);
    setUser(nextUser);
    setSession({ user: nextUser });
    return { error: null };
  };

  const signIn = async (email: string, _password: string) => {
    const baseUser = ensureLocalUser(email);
    const nextUser: User = {
      ...baseUser,
      email,
      user_metadata: {
        display_name: baseUser.user_metadata?.display_name || email.split("@")[0],
      },
    };

    setLocalUser(nextUser);
    ensureProfile(nextUser);
    setUser(nextUser);
    setSession({ user: nextUser });
    return { error: null };
  };

  const signOut = async () => {
    setLocalUser(null);
    setUser(null);
    setSession(null);
  };
 
   return (
     <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
       {children}
     </AuthContext.Provider>
   );
 }
 
 export function useAuth() {
   const context = useContext(AuthContext);
   if (context === undefined) {
     throw new Error("useAuth must be used within an AuthProvider");
   }
   return context;
 }