import { useState, useEffect } from "react";
import { getAuthData, AuthData } from "./checkAuth";
import { jwtDecode, JwtPayload } from "jwt-decode";

interface CustomJwtPayload extends JwtPayload {
  id: string;
}

export const useAuth = () => {
  const [authData, setAuthData] = useState<AuthData>({
    user: null,
    token: "",
    role: "",
    id: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const data = getAuthData();

    let decodedToken = null;
    if (data.token) {
      try {
        const cleanToken = data.token.trim().replace(/^["']+|["']+$/g, "");
        decodedToken = jwtDecode<CustomJwtPayload>(cleanToken);
        const id = decodedToken.id;
        data.id = id;
      } catch (error) {}
    }

    console.log("[useAuth][DEBUG] Auth Data:", data);

    setAuthData(data);
    setIsLoading(false);
  }, []);

  return {
    ...authData,
    isLoading,
    isAuthenticated: !!authData.token,
  };
};
