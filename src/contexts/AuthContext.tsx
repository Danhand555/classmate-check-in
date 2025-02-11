
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type UserRole = "teacher" | "student";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  subject?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    subject?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Set up initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.name || "",
          email: session.user.email || "",
          role: session.user.user_metadata.role || "student",
          subject: session.user.user_metadata.subject,
        });
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.name || "",
          email: session.user.email || "",
          role: session.user.user_metadata.role || "student",
          subject: session.user.user_metadata.subject,
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      setUser({
        id: data.user.id,
        name: data.user.user_metadata.name || "",
        email: data.user.email || "",
        role: data.user.user_metadata.role || "student",
        subject: data.user.user_metadata.subject,
      });
    }
  };

  const signup = async (userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    subject?: string;
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          role: userData.role,
          subject: userData.subject,
        },
      },
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      setUser({
        id: data.user.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        subject: userData.subject,
      });
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
