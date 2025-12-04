import { useState } from 'react';
import container from '@/lib/di/container';
import { TeamRepository } from '../data/repositories/team.repository';
import { Team, UpdateTeamMemberBody, RemoveTeamMemberBody } from '../data/interface/team.interface';

export function useTeam() {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const teamRepository = container.get(TeamRepository);

  const fetchMyGroup = async () => {
    setLoading(true);
    try {
      const data = await teamRepository.getMyGroup();
      if (data) {
        setTeam(data);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateMember = async (body: UpdateTeamMemberBody) => {
    setLoading(true);
    try {
      await teamRepository.updateMyGroup(body);
      await fetchMyGroup();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (body: RemoveTeamMemberBody) => {
    setLoading(true);
    try {
      await teamRepository.removeMember(body);
      await fetchMyGroup();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const searchUser = async (query: string) => {
    setLoading(true);
    try {
      const data = await teamRepository.searchUserByTeam(query);
      return data.results;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { team, loading, error, fetchMyGroup, updateMember, removeMember, searchUser };
}
