import { useMutation, useQuery } from '@tanstack/react-query';
import { getPipeDriveDetail, getPipeDriveSearch } from './pipedrive.service';

export const usePipeDriveSearchQuery = (searchTerm: string) => {
  return useQuery({
    queryKey: ['pipedrive-search', searchTerm],
    queryFn: () => getPipeDriveSearch(searchTerm),
    enabled: searchTerm.trim().length > 1,
  });
};

export const usePipeDriveDetail = () => {
  return useMutation({
    mutationFn: ({ id, type }: { id: number; type: 'organization' | 'person' }) =>
      getPipeDriveDetail(id, type),
  });
};
