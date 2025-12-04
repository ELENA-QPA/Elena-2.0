import { injectable } from 'inversify';
import {
  Team,
  UpdateMemberBody,
  InviteUserBody,
  GetTeamSuccessResponse,
  UpdateMemberSuccessResponse,
  RemoveMemberSuccessResponse,
  SearchUsersSuccessResponse,
  InviteUserSuccessResponse
} from '../interfaces/equipo.interface';

// Tipo local para la petición de búsqueda de usuarios (no estaba definido en interfaces)
type SearchUsersRequest = {
  query: string;
  email?: string;
  fullName?: string;
}
import {
  mapGetTeamResponse,
  mapUpdateMemberResponse,
  mapRemoveMemberResponse,
  mapSearchUsersResponse,
  mapInviteUserResponse
} from '../adapters/equipo.adapter';

@injectable()
export class EquipoRepository {
  private readonly baseUrl = '/api/auth';

  async getMyTeam(): Promise<GetTeamSuccessResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/my-group`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return mapGetTeamResponse(data);
    } catch (error) {
      throw new Error('Error al obtener información del equipo');
    }
  }

  async updateMember(memberId: string, updateData: UpdateMemberBody): Promise<UpdateMemberSuccessResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/my-group`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId,
          ...updateData
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return mapUpdateMemberResponse(data);
    } catch (error) {
      throw new Error('Error al actualizar miembro del equipo');
    }
  }

  async removeMember(memberId: string): Promise<RemoveMemberSuccessResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/my-group/member/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return mapRemoveMemberResponse(data);
    } catch (error) {
      throw new Error('Error al remover miembro del equipo');
    }
  }

  async searchUsers(searchData: SearchUsersRequest): Promise<SearchUsersSuccessResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('query', searchData.query);
      
      if (searchData.email) {
        queryParams.append('email', searchData.email);
      }
      
      if (searchData.fullName) {
        queryParams.append('fullName', searchData.fullName);
      }

      const response = await fetch(`${this.baseUrl}/users/search?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return mapSearchUsersResponse(data);
    } catch (error) {
      throw new Error('Error al buscar usuarios');
    }
  }

  async inviteUser(inviteData: InviteUserBody): Promise<InviteUserSuccessResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/invite-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteData),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return mapInviteUserResponse(data);
    } catch (error) {
      throw new Error('Error al invitar usuario al equipo');
    }
  }
}
