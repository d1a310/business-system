import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";


const AuthContext = createContext(null);


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setLoading(false);
      return;
    }


    api
      .get("/auth/me")
      .then((response) => {
        setUser(response.data);
        localStorage.setItem(
          "user",
          JSON.stringify(response.data)
        );
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);


  const login = async (email, password) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const token = response.data.access_token;

    localStorage.setItem("access_token", token);

    const userResponse = await api.get("/auth/me");

    setUser(userResponse.data);

    localStorage.setItem(
      "user",
      JSON.stringify(userResponse.data)
    );

    return userResponse.data;
  };


  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    setUser(null);
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth, AuthProvider içerisinde kullanılmalıdır."
    );
  }

  return context;
}