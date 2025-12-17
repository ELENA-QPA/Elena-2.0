import { useState, useEffect } from "react";
import { getAuthData, AuthData } from "./checkAuth";

export const useAuth = () => {
  const [authData, setAuthData] = useState<AuthData>({
    user: null,
    token: "",
    role: ""
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const data = getAuthData();
    setAuthData(data);
    setIsLoading(false);
  }, []);

  return {
    ...authData,
    isLoading,
    isAuthenticated: !!authData.token
  };
};