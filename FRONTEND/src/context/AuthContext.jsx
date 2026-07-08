import { useState, useEffect } from "react";
import { AuthContext } from "./authState";
import { login as loginApi, getMe } from "../services/auth.api.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("cosmovision_token");
    if (token) {
      getMe()
        .then((currentUser) => {
          setUser(currentUser);
          if (currentUser) {
            localStorage.setItem("cosmovision_user", JSON.stringify(currentUser));
          }
        })
        .catch(() => {
          localStorage.removeItem("cosmovision_token");
          localStorage.removeItem("cosmovision_user");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { user, token } = await loginApi(email, password);
    localStorage.setItem("cosmovision_token", token);
    localStorage.setItem("cosmovision_user", JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("cosmovision_token");
    localStorage.removeItem("cosmovision_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
