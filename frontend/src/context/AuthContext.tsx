import React, {
  createContext,
  useReducer,
  useContext,
  type ReactNode,
} from 'react';

export type UserRole = 'Global Admin' | 'Project User';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null; //For JWT token.
}

export type AuthAction =
  | { type: 'LOGIN'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_AVATAR'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean };

//Initial State:
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  token: null,
};

//Reducer:
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
      };
    case 'UPDATE_AVATAR':
      if (!state.user) return state;
      return {
        ...state,
        user: { ...state.user, avatar: action.payload },
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

//Context
//Adding the dispatch function with AuthState in AuthContextType
export interface AuthContextType extends AuthState {
  dispatch: React.Dispatch<AuthAction>;
}
//Creating context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

//Provider: That provide data to all UI components nested inside the wrapper.
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  return (
    <AuthContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

//Hook(Receiver): Prevent other components from using AuthContext that are not wrapped inside AuthProvider.
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
