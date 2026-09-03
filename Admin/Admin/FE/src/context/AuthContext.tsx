// src/context/AuthContext.tsx
import React, { createContext, useState, useContext,type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  name: any;
  role: 'ADMIN' | 'HR' | 'EMPLOYEE';
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // In AuthContext.tsx, update the login function:
const login = (userData: User, token: string) => {
  setUser(userData);
  localStorage.setItem('token', token); // Store token
  if (userData.role === 'EMPLOYEE') navigate('/employee/dashboard');
  else navigate('/admin/dashboard');
};

// And update the logout function:
const logout = () => {
  setUser(null);
  localStorage.removeItem('token'); // Remove token
  navigate('/login', { replace: true });
};

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
