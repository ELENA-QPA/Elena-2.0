import {
  Team,
  TeamMember,
  GetTeamSuccessResponse,
  UpdateMemberSuccessResponse,
  RemoveMemberSuccessResponse,
  SearchUsersSuccessResponse,
  InviteUserSuccessResponse
} from '../interfaces/equipo.interface';

// Mapear miembro del equipo de API a modelo
export function mapTeamMemberApiToModel(api: any): TeamMember {
  return {
    id: api.id,
    email: api.email,
    fullName: api.fullName,
    role: api.role,
    isActive: api.isActive
  };
}

// Mapear equipo de API a modelo
export function mapTeamApiToModel(api: any): Team {
  return {
    id: api.id,
    name: api.name,
    members: api.members?.map(mapTeamMemberApiToModel) || [],
    totalMembers: api.totalMembers
  };
}

// Mapear respuesta de obtener equipo
export function mapGetTeamResponse(api: any): GetTeamSuccessResponse {
  return {
    team: mapTeamApiToModel(api.team)
  };
}

// Mapear respuesta de actualizar miembro
export function mapUpdateMemberResponse(api: any): UpdateMemberSuccessResponse {
  return {
    message: api.message,
    member: mapTeamMemberApiToModel(api.member)
  };
}

// Mapear respuesta de remover miembro
export function mapRemoveMemberResponse(api: any): RemoveMemberSuccessResponse {
  return {
    message: api.message,
    removedMember: {
      email: api.removedMember.email,
      fullName: api.removedMember.fullName
    }
  };
}

// Mapear respuesta de buscar usuarios
export function mapSearchUsersResponse(api: any): SearchUsersSuccessResponse {
  return {
    results: api.results?.map(mapTeamMemberApiToModel) || [],
    query: api.query,
    total: api.total
  };
}

// Mapear respuesta de invitar usuario
export function mapInviteUserResponse(api: any): InviteUserSuccessResponse {
  return {
    message: api.message,
    user: api.user
  };
}
