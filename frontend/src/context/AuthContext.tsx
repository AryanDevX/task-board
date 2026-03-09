import React, { createContext, useReducer, useContext, type ReactNode } from 'react';

export type GlobalRole = 'Global Admin' | 'User';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: GlobalRole;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type AuthAction =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_AVATAR'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean };

//Initial State:
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

//Reducer:
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        isLoading: false,
      };
    case 'LOGOUT':
      return { ...state, isAuthenticated: false, user: null, isLoading: false };
    case 'UPDATE_AVATAR':
      return {
        ...state,
        user: state.user ? { ...state.user, avatar: action.payload } : null,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

//Context
export interface AuthContextType extends AuthState {
  dispatch: React.Dispatch<AuthAction>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

//Provider:
export const AuthProvide: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  return (
    <AuthContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

//Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
