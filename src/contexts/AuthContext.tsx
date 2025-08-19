import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as loginAPI, getProfilePicture, getUserProfile } from '../api/backend';

export type UserRole = 'admin' | 'exco_user' | 'finance_mmk' | 'finance_officer' | 'super_admin';

export interface User {
  id: string;
  fullName?: string;
  full_name?: string;
  email: string;
  phoneNumber?: string;
  phone_number?: string;
  role: UserRole;
  isActive?: boolean;
  is_active?: boolean | number; // Backend returns number (0/1), frontend uses boolean
  profilePhoto?: string;
  createdAt?: string;
  created_at?: string;
  last_login?: string;
  failed_login_attempts?: number;
  account_locked_at?: string;
  lockout_reason?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
  isLoading: boolean;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Real login function using API
  const login = async (email: string, password: string): Promise<any> => {
    setIsLoading(true);
    
    try {
      const response = await loginAPI(email, password);
      
      if (response.success && response.user) {
        // Convert backend user format to frontend format
        let userData: User = {
          id: response.user.id.toString(),
          fullName: response.user.full_name,
          full_name: response.user.full_name,
          email: response.user.email,
          phoneNumber: response.user.phone_number,
          phone_number: response.user.phone_number,
          role: response.user.role as UserRole,
          isActive: response.user.is_active === 1,
          is_active: response.user.is_active === 1,
          createdAt: response.user.created_at,
          created_at: response.user.created_at,
          last_login: response.user.last_login,
          failed_login_attempts: response.user.failed_login_attempts,
          account_locked_at: response.user.account_locked_at,
          lockout_reason: response.user.lockout_reason,
          profilePhoto: '', // Will be fetched separately
        };
        
        // Fetch profile picture before setting user and returning
        try {
          const profileResponse = await getProfilePicture(userData.id);
          if (profileResponse.success && profileResponse.profile_picture) {
            userData = { ...userData, profilePhoto: profileResponse.profile_picture };
          }
        } catch (error) {
          console.error('Failed to fetch profile picture:', error);
        }
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        setIsLoading(false);
        return response;
      } else {
        console.error('Login failed:', response.message);
        setIsLoading(false);
        return response;
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return { success: false, message: 'An unexpected error occurred.' };
    }
    
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      // Fetch the latest user profile from backend
      if (userData.id) {
        getUserProfile(userData.id).then(profileRes => {
          if (profileRes.success && profileRes.user) {
            const updatedUser = {
              ...userData,
              fullName: profileRes.user.full_name,
              full_name: profileRes.user.full_name,
              email: profileRes.user.email,
              phoneNumber: profileRes.user.phone_number,
              phone_number: profileRes.user.phone_number,
              role: profileRes.user.role,
              isActive: profileRes.user.is_active === 1,
              is_active: profileRes.user.is_active === 1,
              createdAt: profileRes.user.created_at,
              created_at: profileRes.user.created_at,
              last_login: profileRes.user.last_login,
              failed_login_attempts: profileRes.user.failed_login_attempts,
              account_locked_at: profileRes.user.account_locked_at,
              lockout_reason: profileRes.user.lockout_reason,
            };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            // Always fetch the latest profile picture from backend
            getProfilePicture(updatedUser.id).then(profileResponse => {
              if (profileResponse.success && profileResponse.profile_picture) {
                const updatedUserData = { ...updatedUser, profilePhoto: profileResponse.profile_picture };
                setUser(updatedUserData);
                localStorage.setItem('user', JSON.stringify(updatedUserData));
              }
            }).catch(error => {
              console.error('Failed to fetch profile picture on load:', error);
            });
          } else if (profileRes.message === 'Not authenticated') {
            // Session invalid, force logout
            setUser(null);
            localStorage.removeItem('user');
          } else {
            setUser(userData);
          }
        }).catch(error => {
          setUser(userData);
        });
      } else {
        setUser(userData);
      }
    }
    setIsLoading(false);
  }, []);

  const value = {
    user,
    login,
    logout,
    isLoading,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};