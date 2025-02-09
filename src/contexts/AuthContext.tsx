
import React, { createContext, useContext, useState } from "react";

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
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    // Mock login - replace with actual authentication
    const mockUser: User = {
      id: "1",
      name: "John Doe",
      email: email,
      role: "teacher",
      subject: "Mathematics",
    };
    setUser(mockUser);
  };

  const signup = async (userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    subject?: string;
  }) => {
    // Mock signup - replace with actual registration
    const newUser: User = {
      id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      role: userData.role,
      subject: userData.subject,
    };
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
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
