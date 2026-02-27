'use client';

import { useCallback, useMemo, useState } from 'react';
import type { IQuoteWithMeta } from '../../_shared/types/quotes.types';

export function useFilterQuotes(quotes: IQuoteWithMeta[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState('');
  const [contactFilter, setContactFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = useCallback(
    (column: string) => {
      if (sortColumn === column) {
        setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortColumn(column);
        setSortDirection('asc');
      }
    },
    [sortColumn]
  );

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setCompanyFilter('');
    setContactFilter('');
    setDateFromFilter('');
    setDateToFilter('');
  }, []);

  const filteredQuotes = useMemo(() => {
    const safeQuotes = Array.isArray(quotes) ? quotes : [];
    let filtered = [...safeQuotes];

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        q =>
          q.quoteId?.toLowerCase().includes(search) ||
          q.companyName.toLowerCase().includes(search) ||
          q.contactName.toLowerCase().includes(search) ||
          q.email.toLowerCase().includes(search) ||
          q.industry?.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(q => q.quoteStatus === statusFilter);
    }

    if (companyFilter.trim()) {
      const cf = companyFilter.toLowerCase().trim();
      filtered = filtered.filter(q => q.companyName.toLowerCase().includes(cf));
    }

    if (contactFilter.trim()) {
      const ct = contactFilter.toLowerCase().trim();
      filtered = filtered.filter(q => q.contactName.toLowerCase().includes(ct));
    }

    if (dateFromFilter) {
      filtered = filtered.filter(q => {
        const created = new Date(q.createdAt).toLocaleDateString('en-CA');
        return created >= dateFromFilter;
      });
    }

    if (dateToFilter) {
      filtered = filtered.filter(q => {
        const created = new Date(q.createdAt).toLocaleDateString('en-CA');
        return created <= dateToFilter;
      });
    }

    if (sortColumn) {
      filtered.sort((a, b) => {
        let valA: any;
        let valB: any;

        switch (sortColumn) {
          case 'quoteId':
            valA = a.quoteId?.toLowerCase();
            valB = b.quoteId?.toLowerCase();
            break;
          case 'companyName':
            valA = a.companyName.toLowerCase();
            valB = b.companyName.toLowerCase();
            break;
          case 'contactName':
            valA = a.contactName.toLowerCase();
            valB = b.contactName.toLowerCase();
            break;
          case 'quoteStatus':
            valA = a.quoteStatus;
            valB = b.quoteStatus;
            break;
          case 'totalQuoteUSD':
            valA = a.totalQuoteUSD ?? 0;
            valB = b.totalQuoteUSD ?? 0;
            break;
          case 'createdAt':
            valA = new Date(a.createdAt).getTime();
            valB = new Date(b.createdAt).getTime();
            break;
          case 'updatedAt':
            valA = new Date(a.updatedAt).getTime();
            valB = new Date(b.updatedAt).getTime();
            break;
          default:
            return 0;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [
    quotes,
    searchTerm,
    statusFilter,
    companyFilter,
    contactFilter,
    dateFromFilter,
    dateToFilter,
    sortColumn,
    sortDirection,
  ]);

  const activeFiltersCount = [
    statusFilter !== 'all',
    companyFilter.trim() !== '',
    contactFilter.trim() !== '',
    dateFromFilter !== '',
    dateToFilter !== '',
  ].filter(Boolean).length;

  return {
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
    sortColumn,
    sortDirection,
    handleSort,
    filteredQuotes,
  };
}
