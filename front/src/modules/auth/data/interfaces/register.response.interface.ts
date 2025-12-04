export interface RegisterResponse {
  message: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    isActive: boolean;
    roles?: string[];
  };
  token: string;
}
