import { useState } from 'react';
import container from '@/lib/di/container';
import { ProfileRepository } from '../data/repositories/profile.repository';
import { Profile, UpdateProfileBody } from '../data/interface/profile.interface';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const profileRepository = container.get(ProfileRepository);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await profileRepository.getMe();
      if (data) {
        setProfile(data);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (body: UpdateProfileBody) => {
    setLoading(true);
    try {
      await profileRepository.updateMe(body);
      await fetchProfile();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getUsersByRol = async (rol: string) => {
    setLoading(true);
    try {
      const data = await profileRepository.getUsersByRol(rol);
      return data.users;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, error, fetchProfile, updateProfile, getUsersByRol };
}
