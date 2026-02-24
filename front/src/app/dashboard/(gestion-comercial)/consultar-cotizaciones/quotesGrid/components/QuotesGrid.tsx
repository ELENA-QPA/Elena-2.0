"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit,
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  type IQuoteWithMeta,
  type QuoteStatus,
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_COLORS,
} from "../../types/quotes.types";
import { QUOTE_STATUSES } from "../../../generar-cotizacion/types/quotes.types";
import { currencyUSD } from "../../../generar-cotizacion/lib/formatters";

// ─── Props ───────────────────────────────────────────────────────────────────

interface QuotesGridProps {
  quotes: IQuoteWithMeta[];
  isLoading: boolean;
  error: Error | null;
  onSelectQuote: (quote: IQuoteWithMeta) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function QuotesGrid({
  quotes,
  isLoading,
  error,
  onSelectQuote,
}: QuotesGridProps) {
  // ── State ────────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState("");
  const [contactFilter, setContactFilter] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Ordenamiento
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSort = useCallback(
    (column: string) => {
      if (sortColumn === column) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortColumn(column);
        setSortDirection("asc");
      }
    },
    [sortColumn],
  );

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setStatusFilter("all");
    setCompanyFilter("");
    setContactFilter("");
    setCurrentPage(1);
  }, []);

  // ── Filtrado y ordenamiento ──────────────────────────────────────────────

  const filteredQuotes = useMemo(() => {
  const safeQuotes = Array.isArray(quotes) ? quotes : [];
  let filtered = [...safeQuotes];

    // Búsqueda general
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (q) =>
          q.quoteId.toLowerCase().includes(search) ||
          q.companyName.toLowerCase().includes(search) ||
          q.contactName.toLowerCase().includes(search) ||
          q.email.toLowerCase().includes(search) ||
          q.industry?.toLowerCase().includes(search),
      );
    }

    // Filtro por estado
    if (statusFilter !== "all") {
      filtered = filtered.filter((q) => q.quoteStatus === statusFilter);
    }

    // Filtro por empresa
    if (companyFilter.trim()) {
      const cf = companyFilter.toLowerCase().trim();
      filtered = filtered.filter((q) =>
        q.companyName.toLowerCase().includes(cf),
      );
    }

    // Filtro por contacto
    if (contactFilter.trim()) {
      const ct = contactFilter.toLowerCase().trim();
      filtered = filtered.filter((q) =>
        q.contactName.toLowerCase().includes(ct),
      );
    }

    // Ordenamiento
    if (sortColumn) {
      filtered.sort((a, b) => {
        let valA: any;
        let valB: any;

        switch (sortColumn) {
          case "quoteId":
            valA = a.quoteId.toLowerCase();
            valB = b.quoteId.toLowerCase();
            break;
          case "companyName":
            valA = a.companyName.toLowerCase();
            valB = b.companyName.toLowerCase();
            break;
          case "contactName":
            valA = a.contactName.toLowerCase();
            valB = b.contactName.toLowerCase();
            break;
          case "quoteStatus":
            valA = a.quoteStatus;
            valB = b.quoteStatus;
            break;
          case "totalQuoteUSD":
            valA = a.totalQuoteUSD ?? 0;
            valB = b.totalQuoteUSD ?? 0;
            break;
          case "createdAt":
            valA = new Date(a.createdAt).getTime();
            valB = new Date(b.createdAt).getTime();
            break;
          case "updatedAt":
            valA = new Date(a.updatedAt).getTime();
            valB = new Date(b.updatedAt).getTime();
            break;
          default:
            return 0;
        }

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
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
    sortColumn,
    sortDirection,
  ]);

  // ── Paginación ───────────────────────────────────────────────────────────

  const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageQuotes = filteredQuotes.slice(startIndex, endIndex);

  // Resetear página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, companyFilter, contactFilter]);

  // ── Render helpers ───────────────────────────────────────────────────────

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  };

  const StatusBadge = ({ status }: { status: QuoteStatus }) => {
    const colors = QUOTE_STATUS_COLORS[status];
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
        {QUOTE_STATUS_LABELS[status]}
      </span>
    );
  };

  // ── Loading state ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="animate-spin h-12 w-12 text-elena-pink-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando cotizaciones...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-500 font-medium">
            Error al cargar cotizaciones
          </p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────

  return (
    <div className="p-2 sm:p-4 md:p-6 min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold truncate">
            Gestión de Cotizaciones
          </h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Administra y consulta las cotizaciones generadas
            {quotes.length > 0 && (
              <span className="ml-1 text-gray-700">
                ({quotes.length} registros)
              </span>
            )}
          </p>
        </div>
        <Link
          href="/dashboard/generar-cotizacion"
          className="flex-shrink-0"
        >
          <Button className="bg-elena-pink-600 hover:bg-elena-pink-700 text-white rounded-lg text-xs sm:text-sm">
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Nueva Cotización
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          {/* Barra de búsqueda y filtros */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
              <Input
                placeholder="Buscar por ID, empresa, contacto, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:pl-10 rounded-lg text-xs sm:text-sm"
              />
            </div>
            <Button
              variant="outline"
              className="rounded-lg text-xs sm:text-sm flex-shrink-0"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Filtros
              {(statusFilter !== "all" ||
                companyFilter.trim() ||
                contactFilter.trim()) && (
                <span className="ml-1 sm:ml-2 text-xs px-1 py-0 bg-red-100 text-red-800 rounded">
                  {
                    [
                      statusFilter !== "all" ? "1" : "",
                      companyFilter.trim(),
                      contactFilter.trim(),
                    ].filter(Boolean).length
                  }
                </span>
              )}
            </Button>
          </div>

          {/* Panel de filtros colapsable */}
          <Collapsible open={showFilters} onOpenChange={setShowFilters}>
            <CollapsibleContent className="space-y-4 mt-4 p-2 sm:p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Estado
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      {QUOTE_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {QUOTE_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Empresa
                  </label>
                  <Input
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    placeholder="Filtrar por empresa"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Contacto
                  </label>
                  <Input
                    value={contactFilter}
                    onChange={(e) => setContactFilter(e.target.value)}
                    placeholder="Filtrar por contacto"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 pt-2 border-t">
                <div className="text-xs sm:text-sm text-gray-600">
                  {filteredQuotes.length} de {quotes.length} cotizaciones
                  {filteredQuotes.length !== quotes.length && (
                    <span className="ml-1 text-elena-pink-600">
                      (filtradas)
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  Limpiar filtros
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>

        <CardContent className="bg-white p-3 sm:p-4 md:p-6">
          {/* ── Tabla Desktop ─────────────────────────────────────────── */}
          <div className="hidden lg:block rounded-md border bg-white">
            <Table className="bg-white">
              <TableHeader className="bg-elena-pink-600">
                <TableRow className="bg-elena-pink-600 hover:bg-elena-pink-600">
                  <TableHead
                    className="text-white font-semibold cursor-pointer hover:bg-elena-pink-700"
                    onClick={() => handleSort("quoteId")}
                  >
                    <div className="flex items-center gap-1">
                      ID <SortIcon column="quoteId" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-white font-semibold cursor-pointer hover:bg-elena-pink-700"
                    onClick={() => handleSort("companyName")}
                  >
                    <div className="flex items-center gap-1">
                      Empresa <SortIcon column="companyName" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-white font-semibold cursor-pointer hover:bg-elena-pink-700"
                    onClick={() => handleSort("contactName")}
                  >
                    <div className="flex items-center gap-1">
                      Contacto <SortIcon column="contactName" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-white font-semibold cursor-pointer hover:bg-elena-pink-700"
                    onClick={() => handleSort("quoteStatus")}
                  >
                    <div className="flex items-center gap-1">
                      Estado <SortIcon column="quoteStatus" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-white font-semibold cursor-pointer hover:bg-elena-pink-700"
                    onClick={() => handleSort("totalQuoteUSD")}
                  >
                    <div className="flex items-center gap-1">
                      Total USD <SortIcon column="totalQuoteUSD" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-white font-semibold cursor-pointer hover:bg-elena-pink-700"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center gap-1">
                      Creada <SortIcon column="createdAt" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-white font-semibold cursor-pointer hover:bg-elena-pink-700"
                    onClick={() => handleSort("updatedAt")}
                  >
                    <div className="flex items-center gap-1">
                      Actualizada <SortIcon column="updatedAt" />
                    </div>
                  </TableHead>
                  <TableHead className="text-center text-white font-semibold">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="bg-white">
                {currentPageQuotes.length > 0 ? (
                  currentPageQuotes.map((quote) => (
                    <TableRow
                      key={quote._id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => onSelectQuote(quote)}
                    >
                      <TableCell className="font-mono text-xs text-elena-pink-600 font-medium">
                        {quote.quoteId}
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {quote.companyName}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>
                          <p className="truncate">{quote.contactName}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {quote.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={quote.quoteStatus} />
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {quote.totalQuoteUSD
                          ? currencyUSD(quote.totalQuoteUSD)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(quote.createdAt).toLocaleDateString("es-CO", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(quote.updatedAt).toLocaleDateString("es-CO", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <div
                          className="flex items-center justify-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:text-elena-pink-600"
                            onClick={() => onSelectQuote(quote)}
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {quote.quoteStatus === "draft" && (
                            <Link
                              href={`/dashboard/generar-cotizacion?edit=${quote._id}`}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:text-blue-600"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No hay cotizaciones registradas</p>
                      <Link
                        href="/dashboard/generar-cotizacion"
                        className="text-elena-pink-600 hover:underline text-sm mt-1 inline-block"
                      >
                        Crear primera cotización
                      </Link>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── Cards Mobile ──────────────────────────────────────────── */}
          <div className="lg:hidden space-y-3">
            {currentPageQuotes.length > 0 ? (
              currentPageQuotes.map((quote) => (
                <div
                  key={quote._id}
                  className="bg-white border rounded-lg p-3 shadow-sm cursor-pointer hover:border-elena-pink-300 transition-colors"
                  onClick={() => onSelectQuote(quote)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-elena-pink-600 font-medium">
                          {quote.quoteId}
                        </span>
                        <StatusBadge status={quote.quoteStatus} />
                      </div>
                      <h3 className="font-semibold text-gray-900 truncate text-sm mt-1">
                        {quote.companyName}
                      </h3>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectQuote(quote);
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Contacto:</span>
                      <p className="font-medium truncate">
                        {quote.contactName}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Total:</span>
                      <p className="font-medium">
                        {quote.totalQuoteUSD
                          ? currencyUSD(quote.totalQuoteUSD)
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t flex justify-between items-center text-xs text-gray-500">
                    <span>
                      Creada:{" "}
                      {new Date(quote.createdAt).toLocaleDateString("es-CO")}
                    </span>
                    <span>
                      Actualizada:{" "}
                      {new Date(quote.updatedAt).toLocaleDateString("es-CO")}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No hay cotizaciones registradas</p>
              </div>
            )}
          </div>

          {/* ── Paginación ────────────────────────────────────────────── */}
          {filteredQuotes.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 mt-4 p-2 sm:p-4 border-t">
              <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                  Mostrando {startIndex + 1} -{" "}
                  {Math.min(endIndex, filteredQuotes.length)} de{" "}
                  {filteredQuotes.length}
                </span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(val) => {
                    setItemsPerPage(parseInt(val));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-16 sm:w-20 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs sm:text-sm text-gray-600">
                  por página
                </span>
              </div>

              <div className="flex items-center gap-0.5 sm:gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="text-xs sm:text-sm"
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  Anterior
                </Button>

                <div className="flex items-center gap-0.5 sm:gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum: number;

                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = currentPage - 3 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        className="w-6 h-6 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage >= totalPages}
                  className="text-xs sm:text-sm"
                >
                  Siguiente
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
