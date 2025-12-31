'use client';

import { useState } from 'react';
import { MonolegalRepository } from '../data/repositories/monolegal.repository';
import { SyncResponse } from '../data/interfaces/monolegal.interface';

const monolegalRepository = new MonolegalRepository();

export const useMonolegal = () => {
  const [isLoading, setIsLoading] = useState(false);

  const syncFromApi = async (): Promise<SyncResponse> => {
    setIsLoading(true);
    try {
      const response = await monolegalRepository.syncFromApi();
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const importFromExcel = async (file: File): Promise<SyncResponse> => {
    setIsLoading(true);
    try {
      const response = await monolegalRepository.importFromExcel(file);
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    syncFromApi,
    importFromExcel,
  };
};