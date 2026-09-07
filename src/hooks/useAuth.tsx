import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getToken,
  decodeToken,
} from "@/services/api.js";

export interface Profile {
  id: string;
  nome: string;
  instituicao: string;
  email: string;
}

interface AuthContextValue {
  user: Profile | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nome: string, instituicao: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Compatibilidade com o código que checar session */
  session: { user: Profile } | null;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  session: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

function profileFromToken(token: string | null): Profile | null {
  if (!token) return null;
  const payload = decodeToken(token);
  if (!payload) return null;
  // Verifica expiração
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return {
    id: String(payload.id ?? ""),
    nome: String(payload.nome ?? ""),
    instituicao: String(payload.instituicao ?? ""),
    email: String(payload.email ?? ""),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carrega usuário do token salvo no localStorage
    const token = getToken();
    setUser(profileFromToken(token));
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    const profile = profileFromToken(data.token as string);
    setUser(profile);
  };

  const signUp = async (email: string, password: string, nome: string, instituicao: string) => {
    const data = await apiRegister(email, password, nome, instituicao);
    const profile = profileFromToken(data.token as string);
    setUser(profile);
  };

  const signOut = async () => {
    await apiLogout();
    setUser(null);
  };

  const value: AuthContextValue = {
    user,
    profile: user,
    loading,
    session: user ? { user } : null,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
