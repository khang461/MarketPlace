import React, { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isStaff: () => boolean;
  isAdmin: () => boolean;
}

interface User {
  id: string;
  name?: string;
  email: string;
  fullName?: string;   // thêm
  avatar?: string;
  rating?: number;
  role?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Khởi tạo state từ localStorage ngay từ đầu
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("isAuthenticated") === "true";
  });
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
        return null;
      }
    }
    return null;
  });

  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    // Lưu vào localStorage
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("isAuthenticated", "true");
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    // Xóa khỏi localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
  };

  const isStaff = () => {
    return user?.role === 'staff' || user?.role === 'admin';
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      login, 
      logout, 
      isStaff, 
      isAdmin 
    }}>
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
