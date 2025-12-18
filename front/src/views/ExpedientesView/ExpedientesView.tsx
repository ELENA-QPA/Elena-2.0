"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit,
  Loader2,
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useCaso } from "@/modules/informacion-caso/hooks/useCaso";
import ExpedienteTableRow from "@/components/expedientes/ExpedienteTableRow";
import { getCookie } from "cookies-next";
import { CookiesKeysEnum } from "@/utilities/enums";
import { Caso } from "@/modules/informacion-caso/data/interfaces/caso.interface";
import { toast } from "sonner";

interface ExpedientesViewProps {
  initialCasos?: Caso[];
  initialTotal?: number;
  initialError?: string | null;
}

export default function ExpedientesView({
  initialCasos = [],
  initialTotal = 0,
  initialError = null,
}: ExpedientesViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [authStatus, setAuthStatus] = useState<
    "checking" | "authenticated" | "unauthenticated"
  >("checking");
  const [userRole, setUserRole] = useState<string | null>(null);
  const { casos, loading, error, getAllCasos, deleteCaso } = useCaso();

  // Estados para sincronización con Monolegal
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<any>(null);

  // Estados para filtros y paginación
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [estadoFilter, setEstadoFilter] = useState<string>("all");
  const [clientTypeFilter, setClientTypeFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>("all");
  const [processTypeFilter, setProcessTypeFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [internalCodeFilter, setInternalCodeFilter] = useState("");

  // Estados para departamentos y ciudades de divipola.json
  const [departments, setDepartments] = useState<any[]>([]);
  const [allCities, setAllCities] = useState<any[]>([]);
  const [availableCities, setAvailableCities] = useState<any[]>([]);

  // Estados para despachos judiciales
  const [despachoJudicialData, setDespachoJudicialData] = useState<any>(null);
  const [availableDespachos, setAvailableDespachos] = useState<string[]>([]);
  const [hasDespachoOptions, setHasDespachoOptions] = useState<boolean>(false);

  // Paginación híbrida: carga progresiva del servidor, paginación local
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(initialTotal ?? 0);

  // Debug: Log para verificar inicialización
  console.log("[EXPEDIENTES][Initialization Debug]:", {
    initialTotal,
    totalRecords,
    initialCasosLength: initialCasos?.length || 0,
  });

  // Debug: Log para verificar filtros activos
  console.log("[EXPEDIENTES][Active Filters Debug]:", {
    departmentFilter,
    cityFilter,
    estadoFilter,
    clientTypeFilter,
    processTypeFilter,
    jurisdictionFilter,
    locationFilter,
    typeFilter,
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allLoadedCasos, setAllLoadedCasos] = useState<Caso[]>(initialCasos); // Todos los casos cargados
  const [hasMoreToLoad, setHasMoreToLoad] = useState(true);

  // Estados para manejo de errores
  const [localError, setLocalError] = useState<string | null>(initialError);

  // Cargar datos de divipola.json y despacho_judicial.json
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar divipola.json
        const divipolaResponse = await fetch("/divipola.json");
        const divipolaData = await divipolaResponse.json();
        setDepartments(divipolaData.departamentos);

        // Cargar todas las ciudades de todos los departamentos
        const allCitiesData = divipolaData.departamentos.flatMap((dept: any) =>
          dept.municipios.map((municipio: any) => ({
            ...municipio,
            departamento: dept.nombre,
          }))
        );
        setAllCities(allCitiesData);
        // Inicialmente no cargar ciudades hasta que se necesiten
        setAvailableCities([]);

        // Cargar despacho_judicial.json
        const despachoResponse = await fetch("/despacho_judicial.json");
        const despachoData = await despachoResponse.json();
        setDespachoJudicialData(despachoData);
        console.log("[EXPEDIENTES][Despacho Data Loaded]:", despachoData);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, []);

  // Función para normalizar nombres (eliminar acentos, espacios extra, etc.)
  const normalizeString = (str: string) => {
    if (!str) return "";

    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
      .replace(/\s+/g, " ") // Normalizar espacios
      .replace(/[^\w\s]/g, "") // Eliminar caracteres especiales
      .trim();
  };

  // Función para comparar nombres con variaciones comunes
  const compareNames = useCallback((name1: string, name2: string) => {
    const norm1 = normalizeString(name1);
    const norm2 = normalizeString(name2);

    // Comparación exacta normalizada
    if (norm1 === norm2) return true;

    // Mapeo de variaciones comunes de ciudades colombianas
    const cityVariations: { [key: string]: string[] } = {
      bogota: [
        "bogota d.c.",
        "bogota dc",
        "distrito capital",
        "santa fe de bogota",
      ],
      medellin: ["medellin antioquia"],
      cali: ["santiago de cali"],
      barranquilla: ["barranquilla atlantico"],
      cartagena: ["cartagena de indias", "cartagena bolivar"],
      bucaramanga: ["bucaramanga santander"],
      pereira: ["pereira risaralda"],
      "santa marta": ["santa marta magdalena"],
      ibague: ["ibague tolima"],
      valledupar: ["valledupar cesar"],
      villavicencio: ["villavicencio meta"],
      manizales: ["manizales caldas"],
      past: ["past nariño"],
      neiva: ["neiva huila"],
      monteria: ["monteria cordoba"],
      armenia: ["armenia quindio"],
      popayan: ["popayan cauca"],
      tunja: ["tunja boyaca"],
      florencia: ["florencia caqueta"],
      riohacha: ["riohacha la guajira"],
      quibdo: ["quibdo choco"],
      mocoa: ["mocoa putumayo"],
      leticia: ["leticia amazonas"],
      inirida: ["inirida guainia"],
      "san jose del guaviare": ["san jose del guaviare guaviare"],
      mit: ["mit vaupes"],
      "puerto carreño": ["puerto carreño vichada"],
    };

    // Verificar si alguna de las variaciones coincide
    const variations1 = cityVariations[norm1] || [];
    const variations2 = cityVariations[norm2] || [];

    // Verificar si norm1 está en las variaciones de norm2
    if (variations2.includes(norm1)) return true;

    // Verificar si norm2 está en las variaciones de norm1
    if (variations1.includes(norm2)) return true;

    // Verificar si alguna variación de norm1 coincide con alguna variación de norm2
    return variations1.some((v1) => variations2.includes(v1));
  }, []);

  // Memoizar ciudades filtradas por departamento
  const filteredCities = useMemo(() => {
    if (allCities.length === 0) return [];

    // Si no hay departamento seleccionado, no mostrar ciudades
    if (departmentFilter === "all") {
      return [];
    }

    // Filtrar ciudades del departamento seleccionado
    const cities = allCities.filter(
      (city) => city.departamento === departmentFilter
    );

    return cities;
  }, [allCities, departmentFilter]);

  // Efecto para resetear filtro de ciudad cuando cambie el departamento
  useEffect(() => {
    setCityFilter("all");
    setJurisdictionFilter("all"); // También resetear despacho
  }, [departmentFilter]);

  // Efecto para actualizar despachos disponibles cuando cambie la ciudad
  useEffect(() => {
    if (!despachoJudicialData || cityFilter === "all") {
      setAvailableDespachos([]);
      setHasDespachoOptions(false);
      setJurisdictionFilter("all");
      return;
    }

    // Buscar despachos para la ciudad seleccionada
    const despachoJudicial = despachoJudicialData["Despacho judicial"];
    if (despachoJudicial && despachoJudicial.length > 0) {
      const cityDespachos = despachoJudicial[0][cityFilter];

      console.log("[EXPEDIENTES][Despacho Update]:", {
        cityFilter,
        cityDespachos,
        hasDespachos: !!cityDespachos,
      });

      if (
        cityDespachos &&
        Array.isArray(cityDespachos) &&
        cityDespachos.length > 0
      ) {
        setAvailableDespachos(cityDespachos);
        setHasDespachoOptions(true);
      } else {
        setAvailableDespachos([]);
        setHasDespachoOptions(false);
      }
    } else {
      setAvailableDespachos([]);
      setHasDespachoOptions(false);
    }

    // Resetear el filtro de jurisdicción al cambiar de ciudad
    setJurisdictionFilter("all");
  }, [cityFilter, despachoJudicialData]);

  const checkAuth = () => {
    const token = getCookie(CookiesKeysEnum.token);
    const user = getCookie("user");

    console.log("[EXPEDIENTES][Auth Check]:", {
      hasToken: !!token,
      hasUser: !!user,
      tokenPreview: token ? `${token.toString().substring(0, 20)}...` : "null",
      userPreview: user ? `${user.toString().substring(0, 50)}...` : "null",
      // Verificar si las cookies son HttpOnly
      tokenType: typeof token,
      userType: typeof user,
    });

    // Intentar obtener roles del localStorage primero (más confiable)
    try {
      const roles = localStorage.getItem("roles");
      console.log("[EXPEDIENTES][LocalStorage Roles Raw]:", roles);

      if (roles) {
        const parsedRoles = JSON.parse(roles);
        console.log("[EXPEDIENTES][LocalStorage Parsed Roles]:", parsedRoles);

        // Verificar diferentes variantes del rol de admin
        const isAdmin = Array.isArray(parsedRoles)
          ? parsedRoles.includes("admin") ||
            parsedRoles.includes("administrator") ||
            parsedRoles.includes("Administrador") ||
            parsedRoles.includes("Admin") ||
            parsedRoles.includes("ADMIN")
          : parsedRoles === "admin" ||
            parsedRoles === "administrator" ||
            parsedRoles === "Administrador" ||
            parsedRoles === "Admin" ||
            parsedRoles === "ADMIN";

        setUserRole(isAdmin ? "admin" : "user");
        console.log("[EXPEDIENTES][LocalStorage User Role]:", {
          roles: parsedRoles,
          isAdmin,
          userRole: isAdmin ? "admin" : "user",
          roleType: typeof parsedRoles,
          isArray: Array.isArray(parsedRoles),
          firstRole: Array.isArray(parsedRoles) ? parsedRoles[0] : parsedRoles,
        });
        return; // Salir si se obtuvo del localStorage
      }
    } catch (roleError) {
      console.error("[EXPEDIENTES][LocalStorage Role Parse Error]:", roleError);
    }

    // Fallback: intentar obtener datos del localStorage de user
    try {
      const localUserData = localStorage.getItem("user");
      if (localUserData) {
        const userData = JSON.parse(localUserData);
        const roles = userData.rol || userData.roles || [];
        console.log("[EXPEDIENTES][LocalStorage User Roles Raw]:", roles);

        // Verificar diferentes variantes del rol de admin
        const isAdmin = Array.isArray(roles)
          ? roles.includes("admin") ||
            roles.includes("administrator") ||
            roles.includes("Administrador") ||
            roles.includes("Admin") ||
            roles.includes("ADMIN")
          : roles === "admin" ||
            roles === "administrator" ||
            roles === "Administrador" ||
            roles === "Admin" ||
            roles === "ADMIN";

        // Solo actualizar si no teníamos rol de cookies o si este es admin
        if (!user || isAdmin) {
          setUserRole(isAdmin ? "admin" : "user");
        }

        console.log("[EXPEDIENTES][LocalStorage User Role]:", {
          roles,
          isAdmin,
          userRole: isAdmin ? "admin" : "user",
          roleType: typeof roles,
          isArray: Array.isArray(roles),
          willUpdate: !user || isAdmin,
        });
      } else if (!user) {
        setUserRole("user"); // Default role only if no cookies
      }
    } catch (e) {
      console.warn("[EXPEDIENTES][localStorage Parse Error]:", e);
      if (!user) {
        setUserRole("user"); // Default role only if no cookies
      }
    }

    // Para cookies HttpOnly, getCookie puede devolver undefined en el cliente
    // pero el navegador las enviará automáticamente con withCredentials: true
    if (!token && !user) {
      console.error(
        "[EXPEDIENTES][Auth Error]: No hay cookies de autenticación"
      );
      setAuthStatus("unauthenticated");
      return false;
    }

    console.log(
      "[EXPEDIENTES][Auth Success]: Cookies de autenticación encontradas"
    );
    setAuthStatus("authenticated");
    return true;
  };

  // Función para cargar más datos del servidor (en lotes de 20)
  const loadMoreFromServer = useCallback(
    async (batchSize: number = 20) => {
      if (isLoadingMore || !hasMoreToLoad) return;

      setIsLoadingMore(true);
      try {
        const currentOffset = allLoadedCasos.length;
        console.log("[EXPEDIENTES][Load More Server]:", {
          currentOffset,
          batchSize,
        });

        const response = await getAllCasos(batchSize, currentOffset);

        if ("records" in response) {
          const newCasos = response.records;
          console.log("[EXPEDIENTES][Load More Success]:", {
            newCount: newCasos.length,
            total: response.total,
          });

          if (newCasos.length === 0) {
            setHasMoreToLoad(false);
            toast.info("No hay más expedientes para cargar");
          } else {
            // Agregar nuevos casos evitando duplicados
            const existingIds = new Set(allLoadedCasos.map((caso) => caso._id));
            const uniqueNewCasos = newCasos.filter(
              (caso) => !existingIds.has(caso._id)
            );

            if (uniqueNewCasos.length > 0) {
              setAllLoadedCasos((prev) => {
                const newTotal = [...prev, ...uniqueNewCasos];
                console.log("[EXPEDIENTES][Data Update]:", {
                  previousCount: prev.length,
                  newCount: newTotal.length,
                  addedCount: uniqueNewCasos.length,
                });
                return newTotal;
              });
              // toast.success(`${uniqueNewCasos.length} expedientes adicionales cargados`);
            }

            // Si cargamos menos del batchSize solicitado, no hay más datos
            if (newCasos.length < batchSize) {
              setHasMoreToLoad(false);
              console.log(
                "[EXPEDIENTES][End Detected]: Último lote incompleto, fin de datos"
              );
            }
          }

          // Actualizar el total dinámicamente (puede cambiar si se agregaron nuevos expedientes)
          const newTotal = response.total || 0;
          if (newTotal !== totalRecords) {
            console.log("[EXPEDIENTES][Total Updated]:", {
              previousTotal: totalRecords,
              newTotal: newTotal,
              difference: newTotal - totalRecords,
            });

            // Si el total aumentó, significa que hay nuevos expedientes
            if (newTotal > totalRecords) {
              setHasMoreToLoad(true); // Asegurar que podemos cargar más
            }
          }

          // Solo actualizar totalRecords si es mayor que el actual o si es la primera carga
          if (newTotal > totalRecords || totalRecords === 0) {
            setTotalRecords(newTotal);
          }
        } else {
          console.error("[EXPEDIENTES][Load More Error]:", response);
          const errorMsg = Array.isArray(response.message)
            ? response.message.join(", ")
            : response.message;
          toast.error(`Error al cargar más expedientes: ${errorMsg}`);
        }
      } catch (error) {
        console.error("[EXPEDIENTES][Load More Error]:", error);
        toast.error("Error al cargar más expedientes");
      } finally {
        setIsLoadingMore(false);
      }
    },
    [getAllCasos, allLoadedCasos, isLoadingMore, hasMoreToLoad, totalRecords]
  );

  const handleRetry = useCallback(() => {
    console.log("[EXPEDIENTES][Retry]: Intentando cargar datos nuevamente");
    setAuthStatus("checking");
    setLocalError(null);
    setTimeout(() => {
      if (checkAuth()) {
        loadMoreFromServer();
      }
    }, 100);
  }, [loadMoreFromServer]);

  // Función optimizada para manejar eliminación de casos
  const handleDeleteCaso = useCallback(
    async (id: string) => {
      console.log("Eliminando expediente:", id);
      const result = await deleteCaso(id);

      if ("message" in result && !("statusCode" in result)) {
        toast.success("Expediente eliminado exitosamente");
        // Actualizar estado local removiendo el caso eliminado
        setAllLoadedCasos((prev) => prev.filter((c) => c._id !== id));
      } else {
        const errorMsg = Array.isArray((result as any).message)
          ? (result as any).message.join(", ")
          : (result as any).message || "Error al eliminar el expediente";
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [deleteCaso]
  );

  // Función para sincronizar con Monolegal
  const handleSyncMonolegal = useCallback(async () => {
    setIsSyncing(true);
    setSyncResults(null);

    try {
      const token = getCookie(CookiesKeysEnum.token);

      if (!token) {
        toast.error("No se encontró token de autenticación");
        setIsSyncing(false);
        return;
      }

      console.log("[SYNC][Monolegal] Iniciando sincronización...");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/monolegal/sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        console.log("[SYNC][Monolegal] Sincronización exitosa:", data);
        setSyncResults(data);

        toast.success(
          `Sincronización completada: ${data.summary.created} creados, ${data.summary.updated} actualizados`
        );
        
        setTimeout(() => {
          loadMoreFromServer();
        }, 2000);
      } else {
        console.error("[SYNC][Monolegal] Error:", data);
        toast.error(data.message || "Error al sincronizar con Monolegal");
      }
    } catch (error: any) {
      console.error("[SYNC][Monolegal] Error:", error);
      toast.error("Error al sincronizar con Monolegal: " + error.message);
    } finally {
      setIsSyncing(false);
    }
  }, [loadMoreFromServer]);

  useEffect(() => {    
    checkAuth();
    
    if (initialCasos.length > 0 && allLoadedCasos.length === 0) {
      console.log("[EXPEDIENTES][Server Data]: Usando datos del servidor", {
        count: initialCasos.length,
        initialTotal,
        hasMoreData: initialTotal > initialCasos.length,
      });
      setAllLoadedCasos(initialCasos);
      setAuthStatus("authenticated");
      
      if (initialTotal && initialTotal > initialCasos.length) {
        setHasMoreToLoad(true);
      } else {
        setHasMoreToLoad(false);
      }
      return;
    }
    
    if (initialError) {
      console.log(
        "[EXPEDIENTES][Server Error]: Error del servidor",
        initialError
      );
      setLocalError(initialError);
      setAuthStatus("authenticated");
      return;
    }
    
    console.log("[EXPEDIENTES][Loading Data]: Iniciando carga de expedientes");
    loadMoreFromServer(); 
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // useEffect separado para manejar cambios en los datos después de cargas
  useEffect(() => {
    if (casos && casos.length > 0 && allLoadedCasos.length === 0) {
      console.log("[EXPEDIENTES][Hook Data]: Usando datos del hook", {
        count: casos.length,
      });
      setAllLoadedCasos(casos);
    }
  }, [casos, allLoadedCasos.length]);

  useEffect(() => {
    if (error) {
      setLocalError(error);
    }
  }, [error]);

  // Sincronizar totalRecords con initialTotal cuando cambie
  useEffect(() => {
    if (initialTotal !== undefined && initialTotal !== totalRecords) {
      console.log("[EXPEDIENTES][Total Sync]:", {
        previousTotal: totalRecords,
        newTotal: initialTotal,
      });
      setTotalRecords(initialTotal);
    }
  }, [initialTotal, totalRecords]);

  // Filtrar casos por búsqueda y filtros (memoizado)
  const filteredCasos = useMemo(() => {
    let filtered = allLoadedCasos;

    // Filtro por texto de búsqueda
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((caso) => {
        // Buscar en campos principales
        const searchableFields = [
          caso.internalCode,
          caso.proceduralParts?.[0]?.name,
          caso.estado,
          caso.clientType,
          caso.department,
          caso.city,
          caso.office,
          caso.processType,
          caso.jurisdiction,
        ]
          .filter(Boolean)
          .map((field) => field?.toString().toLowerCase() || "");

        return searchableFields.some((field) => field.includes(searchLower));
      });
    }

    // Filtro por código interno
    if (internalCodeFilter.trim()) {
      const codeLower = internalCodeFilter.toLowerCase().trim();
      filtered = filtered.filter((caso) =>
        caso.internalCode?.toLowerCase().includes(codeLower)
      );
    }

    // Filtro por estado
    if (estadoFilter !== "all") {
      console.log("[EXPEDIENTES][Estado Filter]:", {
        estadoFilter,
        beforeCount: filtered.length,
        sampleEstados: filtered
          .slice(0, 5)
          .map((c) => ({ id: c._id, estado: c.estado })),
      });
      filtered = filtered.filter((caso) => caso.estado === estadoFilter);
      console.log("[EXPEDIENTES][Estado Filter Result]:", {
        afterCount: filtered.length,
        filteredSample: filtered
          .slice(0, 3)
          .map((c) => ({ id: c._id, estado: c.estado })),
      });
    }

    // Filtro por tipo de cliente
    if (clientTypeFilter !== "all") {
      console.log("[EXPEDIENTES][ClientType Filter]:", {
        clientTypeFilter,
        beforeCount: filtered.length,
        sampleClientTypes: filtered
          .slice(0, 5)
          .map((c) => ({ id: c._id, clientType: c.clientType })),
      });
      filtered = filtered.filter(
        (caso) => caso.clientType === clientTypeFilter
      );
      console.log("[EXPEDIENTES][ClientType Filter Result]:", {
        afterCount: filtered.length,
        filteredSample: filtered
          .slice(0, 3)
          .map((c) => ({ id: c._id, clientType: c.clientType })),
      });
    }

    // Filtro por departamento
    if (departmentFilter !== "all") {
      console.log("[EXPEDIENTES][Department Filter]:", {
        departmentFilter,
        beforeCount: filtered.length,
        sampleDepartments: filtered
          .slice(0, 5)
          .map((c) => ({ id: c._id, department: c.department })),
        allUniqueDepartments: [
          ...new Set(filtered.map((c) => c.department)),
        ].slice(0, 10),
      });
      filtered = filtered.filter((caso) => {
        const matches = compareNames(caso.department || "", departmentFilter);
        if (matches) {
          console.log("[EXPEDIENTES][Department Match]:", {
            casoDepartment: caso.department,
            filterDepartment: departmentFilter,
            normalizedCaso: normalizeString(caso.department || ""),
            normalizedFilter: normalizeString(departmentFilter),
          });
        }
        return matches;
      });
      console.log("[EXPEDIENTES][Department Filter Result]:", {
        afterCount: filtered.length,
        filteredSample: filtered
          .slice(0, 3)
          .map((c) => ({ id: c._id, department: c.department })),
      });
    }

    // Filtro por jurisdicción
    if (jurisdictionFilter !== "all" && jurisdictionFilter.trim()) {
      console.log("[EXPEDIENTES][Jurisdiction Filter]:", {
        jurisdictionFilter,
        beforeCount: filtered.length,
        sampleJurisdictions: filtered
          .slice(0, 5)
          .map((c) => ({ id: c._id, jurisdiction: c.jurisdiction })),
      });

      // Filtrar por jurisdicción (no por office/despacho)
      filtered = filtered.filter(
        (caso) => caso.jurisdiction === jurisdictionFilter
      );

      console.log("[EXPEDIENTES][Jurisdiction Filter Result]:", {
        afterCount: filtered.length,
        filteredSample: filtered
          .slice(0, 3)
          .map((c) => ({ id: c._id, jurisdiction: c.jurisdiction })),
      });
    }

    // Filtro por tipo de proceso
    if (processTypeFilter !== "all") {
      console.log("[EXPEDIENTES][ProcessType Filter]:", {
        processTypeFilter,
        beforeCount: filtered.length,
        sampleProcessTypes: filtered
          .slice(0, 5)
          .map((c) => ({ id: c._id, processType: c.processType })),
      });
      filtered = filtered.filter(
        (caso) => caso.processType === processTypeFilter
      );
      console.log("[EXPEDIENTES][ProcessType Filter Result]:", {
        afterCount: filtered.length,
        filteredSample: filtered
          .slice(0, 3)
          .map((c) => ({ id: c._id, processType: c.processType })),
      });
    }

    // Filtro por ciudad
    if (cityFilter !== "all") {
      console.log("[EXPEDIENTES][City Filter]:", {
        cityFilter,
        beforeCount: filtered.length,
        sampleCities: filtered
          .slice(0, 5)
          .map((c) => ({ id: c._id, city: c.city })),
        allUniqueCities: [...new Set(filtered.map((c) => c.city))].slice(0, 10),
      });
      filtered = filtered.filter((caso) => {
        const matches = compareNames(caso.city || "", cityFilter);
        if (matches) {
          console.log("[EXPEDIENTES][City Match]:", {
            casoCity: caso.city,
            filterCity: cityFilter,
            normalizedCaso: normalizeString(caso.city || ""),
            normalizedFilter: normalizeString(cityFilter),
          });
        }
        return matches;
      });
      console.log("[EXPEDIENTES][City Filter Result]:", {
        afterCount: filtered.length,
        filteredSample: filtered
          .slice(0, 3)
          .map((c) => ({ id: c._id, city: c.city })),
      });
    }

    // Filtro por ubicación
    if (locationFilter !== "all") {
      console.log("[EXPEDIENTES][Location Filter]:", {
        locationFilter,
        beforeCount: filtered.length,
        sampleLocations: filtered
          .slice(0, 5)
          .map((c) => ({ id: c._id, location: c.location })),
      });
      filtered = filtered.filter((caso) => caso.location === locationFilter);
      console.log("[EXPEDIENTES][Location Filter Result]:", {
        afterCount: filtered.length,
        filteredSample: filtered
          .slice(0, 3)
          .map((c) => ({ id: c._id, location: c.location })),
      });
    }

    // Filtro por tipo
    if (typeFilter !== "all") {
      console.log("[EXPEDIENTES][Type Filter]:", {
        typeFilter,
        beforeCount: filtered.length,
        sampleTypes: filtered
          .slice(0, 5)
          .map((c) => ({ id: c._id, type: c.type })),
      });
      filtered = filtered.filter((caso) => caso.type === typeFilter);
      console.log("[EXPEDIENTES][Type Filter Result]:", {
        afterCount: filtered.length,
        filteredSample: filtered
          .slice(0, 3)
          .map((c) => ({ id: c._id, type: c.type })),
      });
    }

    // Filtro por fechas
    if (dateFrom) {
      console.log("[EXPEDIENTES][Date Filter Debug - From]:", {
        dateFrom,
        dateFromType: typeof dateFrom,
        sampleDates: filtered.slice(0, 3).map((c) => ({
          id: c._id,
          updatedAt: c.updatedAt,
          createdAt: c.createdAt,
          updatedAtType: typeof c.updatedAt,
          createdAtType: typeof c.createdAt,
        })),
      });
      filtered = filtered.filter((caso) => {
        const casoDate = new Date(caso.updatedAt || caso.createdAt || "");
        const fromDate = new Date(dateFrom);
        const isValid =
          !isNaN(casoDate.getTime()) && !isNaN(fromDate.getTime());
        console.log("[EXPEDIENTES][Date Filter - From]:", {
          casoId: caso._id,
          casoDate: casoDate.toISOString(),
          fromDate: fromDate.toISOString(),
          isValid,
          result: isValid ? casoDate >= fromDate : false,
        });
        return isValid ? casoDate >= fromDate : false;
      });
    }

    if (dateTo) {
      console.log("[EXPEDIENTES][Date Filter Debug - To]:", {
        dateTo,
        dateToType: typeof dateTo,
        sampleDates: filtered.slice(0, 3).map((c) => ({
          id: c._id,
          updatedAt: c.updatedAt,
          createdAt: c.createdAt,
        })),
      });
      filtered = filtered.filter((caso) => {
        const casoDate = new Date(caso.updatedAt || caso.createdAt || "");
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999); // Incluir todo el día
        const isValid = !isNaN(casoDate.getTime()) && !isNaN(toDate.getTime());
        console.log("[EXPEDIENTES][Date Filter - To]:", {
          casoId: caso._id,
          casoDate: casoDate.toISOString(),
          toDate: toDate.toISOString(),
          isValid,
          result: isValid ? casoDate <= toDate : false,
        });
        return isValid ? casoDate <= toDate : false;
      });
    }

    // Ordenar por fecha de última actualización (updatedAt) descendente
    filtered.sort((a, b) => {
      const fechaA = new Date(a.updatedAt || a.createdAt || 0);
      const fechaB = new Date(b.updatedAt || b.createdAt || 0);
      return fechaB.getTime() - fechaA.getTime(); // Más reciente primero
    });

    return filtered;
  }, [
    allLoadedCasos,
    searchTerm,
    internalCodeFilter,
    estadoFilter,
    clientTypeFilter,
    departmentFilter,
    jurisdictionFilter,
    processTypeFilter,
    cityFilter,
    locationFilter,
    typeFilter,
    dateFrom,
    dateTo,
    compareNames,
    hasDespachoOptions,
  ]);

  // Paginación local de los datos filtrados
  const totalLoadedPages = Math.ceil(filteredCasos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageCasos = filteredCasos.slice(startIndex, endIndex);

  // Debug: Log para verificar datos de la tabla
  console.log("[EXPEDIENTES][Table Data Debug]:", {
    allLoadedCasosLength: allLoadedCasos.length,
    filteredCasosLength: filteredCasos.length,
    searchTerm,
    filters: {
      estadoFilter,
      clientTypeFilter,
      departmentFilter,
      jurisdictionFilter,
      processTypeFilter,
      cityFilter,
      locationFilter,
      typeFilter,
      internalCodeFilter,
      dateFrom,
      dateTo,
    },
    currentPage,
    itemsPerPage,
    startIndex,
    endIndex,
    currentPageCasosLength: currentPageCasos.length,
    currentPageCasos: currentPageCasos.map((c) => ({
      id: c._id,
      name: c.internalCode,
    })),
    filteredCasosSample: filteredCasos
      .slice(0, 5)
      .map((c) => ({ id: c._id, name: c.internalCode })),
  });

  // Efecto para detectar automáticamente el final de los datos
  useEffect(() => {
    if (allLoadedCasos.length > 0 && !hasMoreToLoad) {
      const isCurrentPageIncomplete =
        currentPageCasos.length < itemsPerPage && currentPageCasos.length > 0;

      if (isCurrentPageIncomplete) {
        console.log(
          "[EXPEDIENTES][End Detected]: Página actual incompleta, fin de paginación",
          {
            currentPage,
            pageElements: currentPageCasos.length,
            expectedElements: itemsPerPage,
            totalLoaded: allLoadedCasos.length,
          }
        );
      }
    }
  }, [
    allLoadedCasos,
    currentPage,
    hasMoreToLoad,
    currentPageCasos.length,
    itemsPerPage,
  ]);

  // Calcular páginas totales estimadas basado en datos dinámicos del servidor
  // Si tenemos totalRecords del servidor, usarlo; si no, usar las páginas cargadas
  const estimatedTotalPages =
    totalRecords > 0
      ? Math.ceil(totalRecords / itemsPerPage)
      : Math.max(totalLoadedPages, 1);

  // Detectar dinámicamente si hemos llegado al final
  const isLastPageIncomplete =
    allLoadedCasos.length > 0 &&
    allLoadedCasos.length % itemsPerPage !== 0 &&
    !hasMoreToLoad;

  // Calcular dinámicamente el número real de páginas disponibles
  // SIEMPRE mostrar todas las páginas necesarias basándose en el count total
  const actualTotalPages = estimatedTotalPages; // Usar siempre el total real del servidor

  // Páginas que podemos mostrar en la UI (todas las necesarias)
  const maxVisiblePages = actualTotalPages;

  // Debug: Log para verificar valores
  console.log("[EXPEDIENTES][Pagination Debug]:", {
    totalRecords,
    itemsPerPage,
    estimatedTotalPages,
    totalLoadedPages,
    allLoadedCasosLength: allLoadedCasos.length,
    initialTotal,
    hasMoreToLoad,
    actualTotalPages,
    maxVisiblePages,
  });

  // Información dinámica para el usuario
  const progressInfo = useMemo(() => {
    // Si tenemos más casos cargados que el total reportado, usar el número real
    const actualTotal = Math.max(totalRecords, allLoadedCasos.length);

    // Calcular el porcentaje de forma segura
    const safePercentage =
      actualTotal > 0
        ? Math.min(Math.round((allLoadedCasos.length / actualTotal) * 100), 100)
        : 0;

    if (hasMoreToLoad) {
      return {
        status: "loading",
        message: `${actualTotal} totales disponibles`,
        loadedPercentage: safePercentage,
      };
    } else {
      return {
        status: "complete",
        message: "todos cargados",
        loadedPercentage: 100,
      };
    }
  }, [hasMoreToLoad, totalRecords, allLoadedCasos.length]);

  // Manejar cambio de página con carga automática si es necesario
  const handlePageChange = useCallback(
    async (page: number) => {
      if (page === currentPage) return;

      // Calcular cuántos casos necesitamos para esta página
      const requiredCasos = page * itemsPerPage;

      // Si necesitamos más datos del servidor, cargarlos
      if (
        requiredCasos > allLoadedCasos.length &&
        hasMoreToLoad &&
        !isLoadingMore
      ) {
        console.log(
          "[EXPEDIENTES][Auto Load]: Cargando más datos para página",
          page,
          {
            requiredCasos,
            currentLoaded: allLoadedCasos.length,
            itemsPerPage,
          }
        );

        // Calcular cuántos casos necesitamos cargar
        const neededCasos = requiredCasos - allLoadedCasos.length;
        // Cargar en lotes de itemsPerPage, pero mínimo 20 para eficiencia
        const batchSize = Math.max(itemsPerPage, 20);

        await loadMoreFromServer(batchSize);
      }

      setCurrentPage(page);
    },
    [
      currentPage,
      itemsPerPage,
      allLoadedCasos.length,
      hasMoreToLoad,
      isLoadingMore,
      loadMoreFromServer,
    ]
  );

  // Manejar cambio de items por página
  const handleItemsPerPageChange = useCallback(
    async (newItemsPerPage: number) => {
      console.log("[EXPEDIENTES][Items Per Page Change]:", {
        from: itemsPerPage,
        to: newItemsPerPage,
        currentLoaded: allLoadedCasos.length,
      });

      setItemsPerPage(newItemsPerPage);
      setCurrentPage(1); // Volver a la primera página

      // Si necesitamos más datos para la nueva configuración, cargarlos
      if (
        newItemsPerPage > allLoadedCasos.length &&
        hasMoreToLoad &&
        !isLoadingMore
      ) {
        const batchSize = Math.max(newItemsPerPage, 20);
        await loadMoreFromServer(batchSize);
      }
    },
    [
      itemsPerPage,
      allLoadedCasos.length,
      hasMoreToLoad,
      isLoadingMore,
      loadMoreFromServer,
    ]
  );

  // Obtener valores únicos para los filtros (memoizado)
  const uniqueValues = useMemo(
    () => ({
      estados: Array.from(new Set(allLoadedCasos.map((caso) => caso.estado))),
      clientTypes: Array.from(
        new Set(allLoadedCasos.map((caso) => caso.clientType))
      ),
      departments: Array.from(
        new Set(allLoadedCasos.map((caso) => caso.department))
      ),
      jurisdictions: Array.from(
        new Set(allLoadedCasos.map((caso) => caso.office))
      ),
      processTypes: Array.from(
        new Set(allLoadedCasos.map((caso) => caso.processType))
      ),
      cities: Array.from(new Set(allLoadedCasos.map((caso) => caso.city))),
      locations: Array.from(
        new Set(allLoadedCasos.map((caso) => caso.location))
      ),
      types: Array.from(new Set(allLoadedCasos.map((caso) => caso.type))),
    }),
    [allLoadedCasos]
  );

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
    setEstadoFilter("all");
    setClientTypeFilter("all");
    setDepartmentFilter("all");
    setJurisdictionFilter("all");
    setProcessTypeFilter("all");
    setCityFilter("all");
    setLocationFilter("all");
    setTypeFilter("all");
    setInternalCodeFilter("");
    // También resetear estado de despachos
    setAvailableDespachos([]);
    setHasDespachoOptions(false);
    setCurrentPage(1);
  }, []);

  // Volver a la página 1 cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    internalCodeFilter,
    estadoFilter,
    clientTypeFilter,
    departmentFilter,
    jurisdictionFilter,
    processTypeFilter,
    cityFilter,
    locationFilter,
    typeFilter,
    dateFrom,
    dateTo,
  ]);

  if (authStatus === "checking") {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4" />
            <p className="text-gray-600">Verificando autenticación...</p>
          </div>
        </div>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            <div className="space-y-4">
              <div>
                <p className="font-semibold">No estás autenticado</p>
                <p>Para acceder a los expedientes, necesitas iniciar sesión.</p>
                {/* <p className="text-sm text-gray-600 mt-2">
                  Nota: Las cookies de autenticación están configuradas como HttpOnly para mayor seguridad.
                </p> */}
              </div>
              <div className="flex gap-2">
                <Link href="/login">
                  <Button className="bg-pink-600 hover:bg-pink-700 text-white">
                    Ir al login
                  </Button>
                </Link>
                <Button variant="outline" onClick={handleRetry}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reintentar
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando expedientes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (localError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            <div className="space-y-4">
              <div>
                <p className="font-semibold">
                  Error al cargar expedientes: {localError}
                </p>
                {localError.includes("Unauthorized") && (
                  <div className="mt-2 text-sm">
                    <p>Posibles causas:</p>
                    <ul className="list-disc list-inside mt-1">
                      <li>Tu sesión ha expirado</li>
                      <li>Problema con la autenticación</li>
                      <li>El servidor no reconoce el token</li>
                    </ul>
                    {/* <p className="mt-2 text-gray-600">
                      Las cookies HttpOnly se envían automáticamente al servidor.
                    </p> */}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Link href="/login">
                  <Button className="bg-pink-600 hover:bg-pink-700 text-white">
                    Ir al login
                  </Button>
                </Link>
                <Button variant="outline" onClick={handleRetry}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reintentar
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 min-w-0 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold truncate">
            Gestión de Expedientes
          </h1>
          <p className="text-gray-600 mt-1 text-xs sm:text-sm">
            Administra y consulta expedientes judiciales
            {totalRecords > 0 && (
              <span className="ml-1">
                <span className="text-gray-700">
                  ({totalRecords} registros totales)
                </span>
                {allLoadedCasos.length < totalRecords && (
                  <span className="ml-1 text-blue-600 text-xs">
                    • Cargando datos...{" "}
                    {Math.round((allLoadedCasos.length / totalRecords) * 100)}%
                  </span>
                )}
              </span>
            )}
            {userRole && (
              <span className="ml-1 sm:ml-2 text-xs sm:text-sm">
                • Rol:{" "}
                <span
                  className={`font-medium ${
                    userRole === "admin" ? "text-green-600" : "text-blue-600"
                  }`}
                >
                  {userRole === "admin" ? "Admin" : "Usuario"}
                </span>
              </span>
            )}
          </p>
        </div>
        {/* <Link
          href="/dashboard/informacion-caso?mode=create"
          className="flex-shrink-0"
        >
          <Button className="bg-pink-600 hover:bg-pink-700 text-white rounded-lg w-full sm:w-auto text-xs sm:text-sm">
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Nuevo Expediente</span>
            <span className="xs:hidden">Nuevo</span>
          </Button>
        </Link> */}
        <div className="flex gap-2 flex-shrink-0">
          {/* Botón Sincronizar Monolegal */}
          <Button
            onClick={handleSyncMonolegal}
            disabled={isSyncing}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm"
            title="Sincronizar con Monolegal"
          >
            <RefreshCw
              className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${
                isSyncing ? "animate-spin" : ""
              }`}
            />
            <span className="hidden sm:inline">
              {isSyncing ? "Sincronizando..." : "Sincronizar"}
            </span>
            <span className="sm:hidden">Sync</span>
          </Button>

          {/* Botón Nuevo Expediente */}
          <Link href="/dashboard/informacion-caso?mode=create">
            <Button className="bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs sm:text-sm">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Nuevo Expediente</span>
              <span className="xs:hidden">Nuevo</span>
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
              <Input
                placeholder="Buscar expedientes..."
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
              {(dateFrom ||
                dateTo ||
                estadoFilter !== "all" ||
                clientTypeFilter !== "all" ||
                departmentFilter !== "all") && (
                <span className="ml-1 sm:ml-2 text-xs px-1 py-0 bg-red-100 text-red-800 rounded">
                  {
                    [
                      dateFrom,
                      dateTo,
                      estadoFilter !== "all" ? "1" : "",
                      clientTypeFilter !== "all" ? "1" : "",
                      departmentFilter !== "all" ? "1" : "",
                    ].filter(Boolean).length
                  }
                </span>
              )}
            </Button>
          </div>

          <Collapsible open={showFilters} onOpenChange={setShowFilters}>
            <CollapsibleContent className="space-y-4 mt-4 p-2 sm:p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-4">
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Código Interno
                  </label>
                  <Input
                    value={internalCodeFilter}
                    onChange={(e) => setInternalCodeFilter(e.target.value)}
                    placeholder="Código interno"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Fecha desde
                  </label>
                  <DatePicker
                    selected={dateFrom}
                    onSelect={(date) => setDateFrom(date || "")}
                    placeholder="Desde"
                  />
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Fecha hasta
                  </label>
                  <DatePicker
                    selected={dateTo}
                    onSelect={(date) => setDateTo(date || "")}
                    placeholder="Hasta"
                  />
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Estado
                  </label>
                  <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      {uniqueValues.estados
                        .filter((estado) => estado && estado.trim() !== "")
                        .map((estado) => (
                          <SelectItem key={estado} value={estado}>
                            {estado}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Tipo de Cliente
                  </label>
                  <Select
                    value={clientTypeFilter}
                    onValueChange={setClientTypeFilter}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      {uniqueValues.clientTypes
                        .filter((type) => type && type.trim() !== "")
                        .map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Tipo de Proceso */}
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Tipo de Proceso
                  </label>
                  <Select
                    value={processTypeFilter}
                    onValueChange={setProcessTypeFilter}
                  >
                    <SelectTrigger className="w-full border-gray-300 text-sm">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        Todos los tipos de proceso
                      </SelectItem>
                      {uniqueValues.processTypes
                        .filter(
                          (processType) =>
                            processType && processType.trim() !== ""
                        )
                        .map((processType) => (
                          <SelectItem key={processType} value={processType}>
                            {processType}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Departamento */}
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Departamento
                  </label>
                  <Select
                    value={departmentFilter}
                    onValueChange={setDepartmentFilter}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        Todos los departamentos
                      </SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.codigo} value={dept.nombre}>
                          {dept.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Ciudad */}
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Ciudad
                  </label>
                  <Select
                    value={cityFilter}
                    onValueChange={setCityFilter}
                    disabled={departmentFilter === "all"}
                  >
                    <SelectTrigger className="w-full border-gray-300 text-sm">
                      <SelectValue
                        placeholder={
                          departmentFilter === "all"
                            ? "Selecciona un departamento"
                            : "Todas"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="all">Todas las ciudades</SelectItem>
                      {filteredCities.map((city, index) => (
                        <SelectItem
                          key={`${city.codigo}-${city.departamento}-${index}`}
                          value={city.nombre}
                        >
                          {city.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Ubicación Expediente */}
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Ubicación
                  </label>
                  <Select
                    value={locationFilter}
                    onValueChange={setLocationFilter}
                  >
                    <SelectTrigger className="w-full border-gray-300 text-sm">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las ubicaciones</SelectItem>
                      <SelectItem value="SIUGJ">SIUGJ</SelectItem>
                      <SelectItem value="BUSQUEDA DE CONSULTA NACIONAL">
                        BUSQUEDA DE CONSULTA NACIONAL
                      </SelectItem>
                      <SelectItem value="SAMAI">SAMAI</SelectItem>
                      <SelectItem value="SIC">SIC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Despacho */}
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Despacho
                    {cityFilter !== "all" && (
                      <span className="text-xs text-gray-500 ml-1">
                        (
                        {hasDespachoOptions
                          ? availableDespachos.length
                          : "búsqueda libre"}{" "}
                        opciones)
                      </span>
                    )}
                  </label>

                  {hasDespachoOptions && cityFilter !== "all" ? (
                    // Select cuando hay despachos específicos para la ciudad
                    <Select
                      value={jurisdictionFilter}
                      onValueChange={setJurisdictionFilter}
                      disabled={cityFilter === "all"}
                    >
                      <SelectTrigger className="w-full border-gray-300 text-sm">
                        <SelectValue
                          placeholder={
                            cityFilter === "all"
                              ? "Selecciona una ciudad primero"
                              : "Todos los despachos"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <SelectItem value="all">Todos los despachos</SelectItem>
                        {availableDespachos.map((despacho, index) => (
                          <SelectItem
                            key={`${despacho}-${index}`}
                            value={despacho}
                          >
                            {despacho}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    // Input para búsqueda libre cuando no hay despachos específicos
                    <Input
                      value={
                        jurisdictionFilter === "all" ? "" : jurisdictionFilter
                      }
                      onChange={(e) =>
                        setJurisdictionFilter(e.target.value || "all")
                      }
                      placeholder={
                        cityFilter === "all"
                          ? "Selecciona una ciudad primero"
                          : "Buscar despacho..."
                      }
                      disabled={cityFilter === "all"}
                      className="text-sm"
                    />
                  )}
                </div>

                {/* Filtro por Tipo (Activo/Inactivo) */}
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Tipo
                  </label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full border-gray-300 text-sm">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      {uniqueValues.types
                        .filter((type) => type && type.trim() !== "")
                        .map((type) => (
                          <SelectItem key={type!} value={type!}>
                            {type}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 pt-2 border-t">
                <div className="text-xs sm:text-sm text-gray-600">
                  Página {currentPage} • {filteredCasos.length} de{" "}
                  {allLoadedCasos.length} expedientes
                  {filteredCasos.length !== allLoadedCasos.length && (
                    <span className="ml-1 text-pink-600">(filtrados)</span>
                  )}
                  {hasMoreToLoad && (
                    <span
                      className="ml-2 text-blue-600 cursor-pointer"
                      onClick={() => loadMoreFromServer()}
                    >
                      (Cargar más)
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
          {/* Vista de escritorio - Tabla completa */}
          <div className="hidden lg:block rounded-md border bg-white">
            <Table className="bg-white">
              <TableHeader className="bg-pink-600">
                <TableRow className="bg-pink-600 hover:bg-pink-600">
                  <TableHead className="text-white font-semibold">#</TableHead>
                  <TableHead className="text-white font-semibold">
                    Nombre Completo
                  </TableHead>
                  <TableHead className="text-white font-semibold">
                    Radicado
                  </TableHead>
                  <TableHead className="text-white font-semibold">
                    Ubicación Expediente
                  </TableHead>
                  <TableHead className="text-white font-semibold">
                    Despacho
                  </TableHead>
                  <TableHead className="text-white font-semibold">
                    Ciudad
                  </TableHead>
                  <TableHead className="text-white font-semibold">
                    Tipo de Cliente
                  </TableHead>
                  <TableHead className="text-white font-semibold">
                    Activo
                  </TableHead>
                  <TableHead className="text-white font-semibold">
                    Estado
                  </TableHead>
                  <TableHead className="text-white font-semibold">
                    Actualizado
                  </TableHead>
                  <TableHead className="text-right text-white font-semibold">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white">
                {currentPageCasos.length > 0 ? (
                  currentPageCasos.map((caso) => (
                    <ExpedienteTableRow
                      key={caso._id}
                      caso={caso}
                      userRole={userRole}
                      onDelete={handleDeleteCaso}
                    />
                  ))
                ) : isLoadingMore ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <Loader2 className="animate-spin h-6 w-6 mr-2" />
                        <span>Cargando expedientes...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="text-center py-8 text-gray-500"
                    >
                      No hay expedientes registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Vista móvil - Cards */}
          <div className="lg:hidden space-y-3">
            {currentPageCasos.length > 0 ? (
              currentPageCasos.map((caso) => (
                <div
                  key={caso._id}
                  className="bg-white border rounded-lg p-3 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate text-sm">
                        {caso.proceduralParts[0]?.name || "Sin nombre"}
                      </h3>
                      <p className="text-xs text-gray-600">
                        #{caso.internalCode}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Link
                        href={`/dashboard/informacion-caso?mode=view&id=${caso._id}`}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </Link>
                      {userRole === "admin" && (
                        <>
                          <Link
                            href={`/dashboard/informacion-caso?mode=edit&id=${caso._id}`}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleDeleteCaso(caso._id!)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Radicado:</span>
                      <p className="font-medium truncate">
                        {caso.settled || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Ciudad:</span>
                      <p className="font-medium truncate">
                        {caso.city || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Cliente:</span>
                      <p className="font-medium truncate">{caso.clientType}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Estado:</span>
                      <span
                        className={`px-1 py-0.5 rounded-full text-xs font-medium ${
                          caso.estado === "ADMITE"
                            ? "bg-blue-100 text-blue-800"
                            : caso.estado === "FINALIZADO"
                            ? "bg-green-100 text-green-800"
                            : caso.estado === "EN PROCESO"
                            ? "bg-yellow-100 text-yellow-800"
                            : caso.estado === "SUSPENDIDO"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {caso.estado || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t">
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span className="truncate">
                        Actualizado:{" "}
                        {caso.createdAt
                          ? new Date(caso.createdAt).toLocaleDateString("es-ES")
                          : "N/A"}
                      </span>
                      <span
                        className={`px-1 py-0.5 rounded-full text-xs font-medium ${
                          caso.type === "ACTIVO"
                            ? "bg-green-100 text-green-800"
                            : caso.type === "INACTIVO"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {caso.type || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : isLoadingMore ? (
              <div className="text-center py-8">
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-6 w-6 mr-2" />
                  <span>Cargando expedientes...</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay expedientes registrados
              </div>
            )}
          </div>

          {/* Paginación */}
          {allLoadedCasos.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 mt-4 p-2 sm:p-4 border-t overflow-x-auto">
              <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                  Mostrando {startIndex + 1} -{" "}
                  {Math.min(endIndex, allLoadedCasos.length)} de {totalRecords}{" "}
                  expedientes
                  {/* <span className={`ml-1 ${progressInfo.status === 'complete' ? 'text-green-600' : 'text-blue-600'}`}>
                    ({allLoadedCasos.length} cargados de {totalRecords} totales disponibles)
                  </span>
                  {progressInfo.status === 'loading' && (
                    <span className="ml-1 sm:ml-2 text-xs text-gray-500">
                      {progressInfo.loadedPercentage}% cargado
                    </span>
                  )} */}
                </span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) =>
                    handleItemsPerPageChange(parseInt(value))
                  }
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

              <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="text-xs sm:text-sm flex-shrink-0"
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Anterior</span>
                  <span className="xs:hidden">Ant</span>
                </Button>

                <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                  {(() => {
                    const pages = [];
                    const totalPages = maxVisiblePages;

                    console.log("[EXPEDIENTES][Render Pages Debug]:", {
                      totalPages,
                      maxVisiblePages,
                      totalRecords,
                      itemsPerPage,
                    });

                    if (totalPages <= 10) {
                      // Si hay 10 páginas o menos, mostrar todas
                      for (let i = 1; i <= totalPages; i++) {
                        const pageHasData = i <= totalLoadedPages;
                        const isCurrentPage = currentPage === i;

                        pages.push(
                          <Button
                            key={i}
                            variant={isCurrentPage ? "default" : "outline"}
                            size="sm"
                            className={`w-6 h-6 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm ${
                              !pageHasData
                                ? "text-blue-600 border-blue-300"
                                : ""
                            }`}
                            onClick={() => handlePageChange(i)}
                            disabled={isLoadingMore && !pageHasData}
                          >
                            {isLoadingMore &&
                            !pageHasData &&
                            i === currentPage + 1 ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              i
                            )}
                          </Button>
                        );
                      }
                    } else {
                      // Si hay más de 10 páginas, usar lógica de navegación inteligente
                      const renderPage = (pageNum: number) => {
                        const pageHasData = pageNum <= totalLoadedPages;
                        const isCurrentPage = currentPage === pageNum;

                        return (
                          <Button
                            key={pageNum}
                            variant={isCurrentPage ? "default" : "outline"}
                            size="sm"
                            className={`w-6 h-6 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm ${
                              !pageHasData
                                ? "text-blue-600 border-blue-300"
                                : ""
                            }`}
                            onClick={() => handlePageChange(pageNum)}
                            disabled={isLoadingMore && !pageHasData}
                          >
                            {isLoadingMore &&
                            !pageHasData &&
                            pageNum === currentPage + 1 ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              pageNum
                            )}
                          </Button>
                        );
                      };

                      // Siempre mostrar página 1
                      pages.push(renderPage(1));

                      // Lógica para páginas intermedias
                      if (currentPage <= 4) {
                        // Inicio: 1 2 3 4 5 ... último
                        for (let i = 2; i <= Math.min(5, totalPages - 1); i++) {
                          pages.push(renderPage(i));
                        }
                        if (totalPages > 5) {
                          pages.push(
                            <span key="dots1" className="px-2">
                              ...
                            </span>
                          );
                        }
                      } else if (currentPage >= totalPages - 3) {
                        // Final: 1 ... (total-4) (total-3) (total-2) (total-1) total
                        if (totalPages > 5) {
                          pages.push(
                            <span key="dots1" className="px-2">
                              ...
                            </span>
                          );
                        }
                        for (
                          let i = Math.max(2, totalPages - 4);
                          i <= totalPages - 1;
                          i++
                        ) {
                          pages.push(renderPage(i));
                        }
                      } else {
                        // Medio: 1 ... (current-1) current (current+1) ... último
                        pages.push(
                          <span key="dots1" className="px-2">
                            ...
                          </span>
                        );
                        for (
                          let i = currentPage - 1;
                          i <= currentPage + 1;
                          i++
                        ) {
                          pages.push(renderPage(i));
                        }
                        pages.push(
                          <span key="dots2" className="px-2">
                            ...
                          </span>
                        );
                      }

                      // Siempre mostrar última página (si es diferente de la primera)
                      if (totalPages > 1) {
                        pages.push(renderPage(totalPages));
                      }
                    }

                    return pages;
                  })()}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= maxVisiblePages}
                  className="text-xs sm:text-sm flex-shrink-0"
                >
                  <span className="hidden xs:inline">Siguiente</span>
                  <span className="xs:hidden">Sig</span>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
  {
    /* Modal de resultados de sincronización */
  }
  {
    syncResults && (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Resultados de Sincronización</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-700">
                {syncResults.summary.total}
              </div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {syncResults.summary.created}
              </div>
              <div className="text-sm text-green-600">Creados</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {syncResults.summary.updated}
              </div>
              <div className="text-sm text-blue-600">Actualizados</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {syncResults.summary.skipped}
              </div>
              <div className="text-sm text-yellow-600">Omitidos</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {syncResults.summary.errors}
              </div>
              <div className="text-sm text-red-600">Errores</div>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setSyncResults(null)}
            className="w-full"
          >
            Cerrar
          </Button>
        </CardContent>
      </Card>
    );
  }
}
