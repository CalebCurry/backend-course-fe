import { createContext } from "react";

type AuthContextType = {
    isLoggedIn: boolean;
    logout: () => void;
    login: (username: string, password: string) => Promise<void>;
    tokenInfo: TokenInfo;
  };
  
  export const AuthContext = createContext<AuthContextType>({
    isLoggedIn: false,
    logout: () => {},
    login: async () => {},
    tokenInfo: null,
  });
  
  export type TokenInfo = {
    access: string;
    refresh: string;
  } | null;
  