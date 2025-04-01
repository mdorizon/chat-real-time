import React, { createContext, useContext, useState, useEffect } from "react";
import { authService, User, AuthFormData } from "../services/authService";

interface AuthContextType {
  user: User | null;
  signIn: (data: AuthFormData) => Promise<void>;
  signUp: (data: AuthFormData) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = authService.getToken();
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error("Error fetching user data:", error);
          authService.removeToken();
        }
      }
    };

    initializeAuth();
  }, []);

  const signIn = async (data: AuthFormData) => {
    const response = await authService.signIn(data);
    setUser(response.user);
  };

  const signUp = async (data: AuthFormData) => {
    const response = await authService.signUp(data);
    setUser(response.user);
  };

  const signOut = () => {
    authService.removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
