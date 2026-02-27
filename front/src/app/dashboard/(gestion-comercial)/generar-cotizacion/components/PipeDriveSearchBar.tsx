import { Input } from '@/components';
import { Building2, Loader2, SearchX, User, UserRoundSearch } from 'lucide-react';
import { useRef } from 'react';
import { usePipeDriveSearch } from '../_hooks/usePipeDriveSearch';
import type { IPipeDriveSearchResult } from '../types/pipedrive.types';

interface PipeDriveSearchBarProps {
  onSelectResult?: (result: IPipeDriveSearchResult) => void;
}

export function PipeDriveSearchBar({ onSelectResult }: PipeDriveSearchBarProps) {
  const { searchTerm, setSearchTerm, results, isLoading, isOpen, setIsOpen, clearSearch } =
    usePipeDriveSearch();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelect = (result: IPipeDriveSearchResult) => {
    onSelectResult?.(result);
    clearSearch();
  };

  return (
    <div
      ref={containerRef}
      className='relative mt-4 w-[300px] md:w-[400px]'
      onBlur={e => {
        if (!containerRef.current?.contains(e.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <div className='flex items-center w-full border border-elena-pink-400 rounded-lg transition-colors focus-within:border-elena-pink-500 focus-within:bg-elena-pink-50'>
        <Input
          type='search'
          className='!rounded-r-none !border-0 !shadow-none focus-visible:!ring-0 !bg-transparent text-elena-pink-600 placeholder:text-elena-pink-400'
          placeholder='Buscar Empresa/Persona en PipeDrive'
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.trim().length > 1 && setIsOpen(true)}
        />
        <div className='bg-elena-pink-500 h-9 px-4 rounded-r-lg flex items-center transition-colors'>
          {isLoading ? (
            <Loader2 className='text-primary-foreground w-5 h-5 animate-spin' />
          ) : (
            <UserRoundSearch className='text-primary-foreground w-5 h-5' />
          )}
        </div>
      </div>

      {isOpen && (
        <div className='absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto'>
          {results.length > 0 ? (
            results.map(result => (
              <button
                key={`${result.type}-${result.id}`}
                type='button'
                className='w-full px-3 py-2 text-left hover:bg-elena-pink-50 flex items-center gap-3 transition-colors border-b border-gray-100 last:border-b-0'
                onClick={() => handleSelect(result)}
              >
                {result.type === 'organization' ? (
                  <Building2 className='w-4 h-4 text-elena-pink-500 shrink-0' />
                ) : (
                  <User className='w-4 h-4 text-elena-pink-500 shrink-0' />
                )}
                <div className='min-w-0'>
                  <p className='text-sm font-medium text-gray-900 truncate'>
                    {result.name}
                  </p>
                  <p className='text-xs text-gray-500 truncate'>
                    {result.type === 'person'
                      ? `${result.organization ?? ''} ${result.email ? `· ${result.email}` : ''}`
                      : 'Organización'}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <div className='px-3 py-4 text-center'>
              <SearchX className='w-6 h-6 text-gray-300 mx-auto mb-2' />
              <p className='text-sm text-gray-500'>No se encontraron resultados</p>
              <p className='text-xs text-gray-400 mt-1'>Intenta con otro término de búsqueda</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
