import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { http } from "../api/http";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("pulsedesk_token"));
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    const loadMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await http.get("/auth/me");
        setUser(data.user);
      } catch {
        localStorage.removeItem("pulsedesk_token");
        localStorage.removeItem("pulsedesk_refresh_token");
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    loadMe();
  }, [token]);

  const login = async (payload) => {
    const { data } = await http.post("/auth/login", payload);
    localStorage.setItem("pulsedesk_token", data.token);
    localStorage.setItem("pulsedesk_refresh_token", data.refreshToken);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const signup = async (payload) => {
    const { data } = await http.post("/auth/signup", payload);
    localStorage.setItem("pulsedesk_token", data.token);
    localStorage.setItem("pulsedesk_refresh_token", data.refreshToken);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("pulsedesk_token");
    localStorage.removeItem("pulsedesk_refresh_token");
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      signup,
      logout,
      isStaff: ["superadmin", "admin", "manager", "agent"].includes(user?.role)
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
