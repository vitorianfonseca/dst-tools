import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = "http://localhost:3001";

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/api/auth/session`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          // Token expired or invalid
          localStorage.removeItem("auth_token");
          setUser(null);
        }
      } catch (err) {
        console.error("Error checking session:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          display_name: displayName || email.split("@")[0],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        const error = new Error(data.error || "Failed to sign up");
        setError(error.message);
        return { error };
      }

      const data = await response.json();
      localStorage.setItem("auth_token", data.token);
      setUser(data.user);
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Sign up failed");
      setError(error.message);
      console.error("Sign up error:", error.message);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        const error = new Error(data.error || "Failed to sign in");
        setError(error.message);
        return { error };
      }

      const data = await response.json();
      localStorage.setItem("auth_token", data.token);
      setUser(data.user);
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Sign in failed");
      setError(error.message);
      console.error("Sign in error:", error.message);
      return { error };
    }
  };

  const signOut = () => {
    localStorage.removeItem("auth_token");
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signUp, signIn, signOut }}>
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