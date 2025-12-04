// Interfaces para el módulo de equipo

// Miembro del equipo
export interface TeamMember {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive?: boolean;
}

// Equipo completo
export interface Team {
  id: string;
  name: string;
  members: TeamMember[];
  totalMembers: number;
}

// Respuestas de la API
export interface GetTeamSuccessResponse {
  team: Team;
}

export interface UpdateMemberSuccessResponse {
  message: string;
  member: TeamMember;
}

export interface RemoveMemberSuccessResponse {
  message: string;
  removedMember: {
    email: string;
    fullName: string;
  };
}

export interface SearchUsersSuccessResponse {
  results: TeamMember[];
  query: string;
  total: number;
}

export interface InviteUserSuccessResponse {
  message: string;
  user?: any;
}

export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}

// Bodies para requests
export interface UpdateMemberBody {
  email: string;
  roles: string[];
  group_admin: string;
}

export interface RemoveMemberBody {
  email: string;
}

export interface InviteUserBody {
  name: string;
  lastname: string;
  email: string;
  phone: string;
  roles: string[];
}
