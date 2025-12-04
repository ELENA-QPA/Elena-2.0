export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
export const ENDPOINTS = {
  auth: `${API_BASE_URL}/auth`,
  // ...otros endpoints
};

export interface IVerificationEmailResponse {
    message: string;
    accessToken: string;
}