import { useEffect, useState } from 'react';
import { usePipeDriveSearchQuery } from '../_api/pipedrive.hooks';

export function usePipeDriveSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: results = [], isLoading, isFetched } = usePipeDriveSearchQuery(debouncedTerm);

  const hasSearched = isFetched && debouncedTerm.trim().length > 1;

  useEffect(() => {
    setIsOpen(hasSearched);
  }, [hasSearched, results]);

  const clearSearch = () => {
    setSearchTerm('');
    setDebouncedTerm('');
    setIsOpen(false);
  };

  return {
    searchTerm,
    setSearchTerm,
    results,
    isLoading,
    isOpen,
    setIsOpen,
    clearSearch,
  };
}
