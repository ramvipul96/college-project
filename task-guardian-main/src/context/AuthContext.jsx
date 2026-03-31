import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, saveToken, clearToken, isLoggedIn } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn()) {
      authAPI.me().then(d => setUser(d.user)).catch(() => clearToken()).finally(() => setLoading(false));
    } else { setLoading(false); }
  }, []);

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    saveToken(data.token); setUser(data.user); return data.user;
  };
  const register = async (name, email, password) => {
    const data = await authAPI.register(name, email, password);
    saveToken(data.token); setUser(data.user); return data.user;
  };
  const logout = () => { clearToken(); setUser(null); };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
