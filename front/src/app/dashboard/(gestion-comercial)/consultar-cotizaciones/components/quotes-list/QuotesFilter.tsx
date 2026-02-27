'use client';

import { Button, CardHeader, Input } from '@/components';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, Search, X } from 'lucide-react';
import { QUOTE_STATUS_LABELS } from '../../../_shared/types/quotes.constants';
import { QUOTE_STATUSES } from '../../../_shared/types/quotes.types';
import type { useFilterQuotes } from '../../_hooks/useFilterQuotes';

interface QuotesFilterProps {
  filters: ReturnType<typeof useFilterQuotes>;
  totalCount: number;
}

export function QuotesFilter({ filters, totalCount }: QuotesFilterProps) {
  const {
    searchTerm,
    setSearchTerm,
    showFilters,
    setShowFilters,
    statusFilter,
    setStatusFilter,
    companyFilter,
    setCompanyFilter,
    contactFilter,
    setContactFilter,
    dateFromFilter,
    setDateFromFilter,
    dateToFilter,
    setDateToFilter,
    clearFilters,
    activeFiltersCount,
    filteredQuotes,
  } = filters;

  const filteredCount = filteredQuotes.length;
  const hasActiveFilters = activeFiltersCount > 0 || searchTerm.trim() !== '';

  return (
    <CardHeader className='p-3 sm:p-4 md:p-6'>
      <div className='flex flex-col sm:flex-row gap-2 sm:gap-4'>
        <div className='relative flex-1 min-w-0'>
          <Search className='absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4' />
          <Input
            placeholder='Buscar por ID, empresa, contacto, email...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='pl-8 sm:pl-10 rounded-lg text-xs sm:text-sm'
          />
        </div>

        <Button
          variant='outline'
          className='rounded-lg text-xs sm:text-sm flex-shrink-0'
          onClick={() => setShowFilters(prev => !prev)}
        >
          <Filter className='h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2' />
          Filtros
          {activeFiltersCount > 0 && (
            <span className='ml-1 sm:ml-2 text-xs px-1 py-0 bg-red-100 text-red-800 rounded'>
              {activeFiltersCount}
            </span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant='ghost'
            size='sm'
            onClick={clearFilters}
            className='shrink-0 text-muted-foreground'
            title='Limpiar filtros'
          >
            <X className='h-4 w-4' />
          </Button>
        )}
      </div>

      {showFilters && (
        <div className='space-y-4 mt-4 p-2 sm:p-4 border rounded-lg bg-gray-50'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-4'>
            <div className='space-y-1 sm:space-y-2'>
              <label className='text-xs sm:text-sm font-medium text-gray-700'>
                Estado
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='text-sm'>
                  <SelectValue placeholder='Todos' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todos los estados</SelectItem>
                  {QUOTE_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>
                      {QUOTE_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1 sm:space-y-2'>
              <label className='text-xs sm:text-sm font-medium text-gray-700'>
                Empresa
              </label>
              <Input
                value={companyFilter}
                onChange={e => setCompanyFilter(e.target.value)}
                placeholder='Filtrar por empresa'
                className='text-sm'
              />
            </div>

            <div className='space-y-1 sm:space-y-2'>
              <label className='text-xs sm:text-sm font-medium text-gray-700'>
                Contacto
              </label>
              <Input
                value={contactFilter}
                onChange={e => setContactFilter(e.target.value)}
                placeholder='Filtrar por contacto'
                className='text-sm'
              />
            </div>

            <div className='space-y-1 sm:space-y-2'>
              <label className='text-xs sm:text-sm font-medium text-gray-700'>
                Fecha creación desde
              </label>
              <Input
                type='date'
                value={dateFromFilter}
                onChange={e => setDateFromFilter(e.target.value)}
                className='text-sm'
              />
            </div>

            <div className='space-y-1 sm:space-y-2'>
              <label className='text-xs sm:text-sm font-medium text-gray-700'>
                Fecha creación hasta
              </label>
              <Input
                type='date'
                value={dateToFilter}
                onChange={e => setDateToFilter(e.target.value)}
                className='text-sm'
              />
            </div>
          </div>

          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 pt-2 border-t'>
            <p className='text-xs sm:text-sm text-gray-600'>
              {filteredCount} de {totalCount} cotizaciones
              {filteredCount !== totalCount && (
                <span className='ml-1 text-elena-pink-600'>(filtradas)</span>
              )}
            </p>
            <Button
              variant='outline'
              size='sm'
              onClick={clearFilters}
              className='w-full sm:w-auto text-xs sm:text-sm'
            >
              Limpiar filtros
            </Button>
          </div>
        </div>
      )}
    </CardHeader>
  );
}
