import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'admin@medtriage.ai': {
    password: 'admin123',
    user: {
      id: '1',
      email: 'admin@medtriage.ai',
      name: 'System Administrator',
      role: 'admin',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      department: 'IT Administration',
      createdAt: new Date('2024-01-01'),
      lastLoginAt: new Date(),
    },
  },
  'doctor@medtriage.ai': {
    password: 'doctor123',
    user: {
      id: '2',
      email: 'doctor@medtriage.ai',
      name: 'Dr. Sarah Chen',
      role: 'doctor',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      department: 'Emergency Medicine',
      licenseNumber: 'MD-78432',
      createdAt: new Date('2024-01-15'),
      lastLoginAt: new Date(),
    },
  },
  'demo@medtriage.ai': {
    password: 'demo123',
    user: {
      id: '3',
      email: 'demo@medtriage.ai',
      name: 'Dr. Michael Roberts',
      role: 'doctor',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael',
      department: 'Internal Medicine',
      licenseNumber: 'MD-91245',
      createdAt: new Date('2024-02-01'),
      lastLoginAt: new Date(),
    },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockUser = MOCK_USERS[email.toLowerCase()];
    
    if (!mockUser || mockUser.password !== password) {
      setIsLoading(false);
      throw new Error('Invalid email or password');
    }
    
    setUser(mockUser.user);
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const hasRole = useCallback((role: UserRole) => {
    return user?.role === role;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
      }}
    >
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
