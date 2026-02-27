'use client';

import { useEffect, useState } from 'react';

export function usePaginationQuotes<T>(items: T[]) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageItems = items.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [items]);

  return {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    currentPageItems,
  };
}
