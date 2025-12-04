import { useState } from "react";
import container from "@/lib/di/container";
import { AuthRepository } from "../repositories/auth.repository";
import { AuthResponse, ErrorResponse } from "../interfaces/auth.interface";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [user, setUser] = useState<AuthResponse | null>(null);

  const authRepo = container.get<AuthRepository>("AuthRepository");

  const register = async (data: any) => {
    setLoading(true);
    setError(null);
    const result = await authRepo.register(data);
    if ("error" in result) setError(result as ErrorResponse);
    else setUser(result as AuthResponse);
    setLoading(false);
  };

  // ...otros métodos (login, forgotPassword, etc.)

  return { loading, error, user, register /* ...otros métodos */ };
}
