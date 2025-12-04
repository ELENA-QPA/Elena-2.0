// Interfaces para mapear todas las respuestas de la API de autenticación

import { UpdateUserBody, User } from "./user.interface";



// Respuesta exitosa de registro
export interface RegisterSuccessResponse {
  message: string;
  user: User;
  token: string;
}

// Respuesta de error genérica
export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}

// Respuesta exitosa de login
export interface LoginSuccessResponse {
  message: string;
  user: UpdateUserBody;
  token: string;
}

// Respuesta exitosa de forgotPassword
export interface ForgotPasswordSuccessResponse {
  message: string;
  email: string;
}

// Respuesta exitosa de verifyCodeAndUpdatePassword
export interface VerifyCodeSuccessResponse {
  message: string;
  success: boolean;
}

// Respuesta exitosa de sendActivationCodeToEmail
export interface SendActivationCodeSuccessResponse {
  message: string;
  email: string;
}

// Respuesta exitosa de inviteUser
export interface InviteUserSuccessResponse {
  message: string;
  invitation: {
    email: string;
    role: string;
    invitedBy: string;
  };
}

// Respuesta exitosa de acceptInvitation
export interface AcceptInvitationSuccessResponse {
  _id: string;
  name: string;
  lastname: string;
  email: string;
  phone: string;
  isActive: boolean;
  roles: string[];
  entidad: string[];
  group_admin: string;
  createdAt: string;
}

// Respuesta exitosa de registerByActivationCode
export interface RegisterByActivationCodeSuccessResponse {
  message: string;
  user: User;
  token: string;
}

// Respuesta exitosa de registerByInvitation
export interface RegisterByInvitationSuccessResponse {
  message: string;
  user: User;
  token: string;
}

// Respuesta exitosa de getMe
export interface GetMeSuccessResponse {
  user: User;
}

// Respuesta exitosa de getUsersByRol
export interface GetUsersByRolSuccessResponse {
  users: User[];
  total: number;
}

// Respuesta exitosa de getMyGroup
export interface GetMyGroupSuccessResponse {
  team: {
    id: string;
    name: string;
    members: User[];
    totalMembers: number;
  };
}

// Respuesta exitosa de updateMyGroup
export interface UpdateMyGroupSuccessResponse {
  message: string;
  member: User;
}

// Respuesta exitosa de removeMember
export interface RemoveMemberSuccessResponse {
  message: string;
  removedMember: {
    email: string;
    fullName: string;
  };
}

// Respuesta exitosa de searchUserByTeam
export interface SearchUserByTeamSuccessResponse {
  results: User[];
  query: string;
  total: number;
}

// Union de todas las posibles respuestas exitosas
export type AuthSuccessResponse =
  | RegisterSuccessResponse
  | LoginSuccessResponse
  | ForgotPasswordSuccessResponse
  | VerifyCodeSuccessResponse
  | SendActivationCodeSuccessResponse
  | InviteUserSuccessResponse
  | AcceptInvitationSuccessResponse
  | RegisterByActivationCodeSuccessResponse
  | RegisterByInvitationSuccessResponse
  | GetMeSuccessResponse
  | GetUsersByRolSuccessResponse
  | GetMyGroupSuccessResponse
  | UpdateMyGroupSuccessResponse
  | RemoveMemberSuccessResponse
  | SearchUserByTeamSuccessResponse;

// Union de todas las posibles respuestas
export type AuthResponse = AuthSuccessResponse | ErrorResponse;
