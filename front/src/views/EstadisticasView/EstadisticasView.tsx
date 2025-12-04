"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, LineChart, PieChart, TrendingUp, Users, FileText, Clock, CheckCircle, AlertCircle, Loader2, MapPin, Globe, Archive } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SimpleBarChart, SimplePieChart, SimpleLineChart, SimpleMultiLineChart, SimpleGroupedBarChart, SimplePillBarChart } from '@/components/ui/simple-charts';
import { useEstadisticas } from '@/hooks';

// Hook personalizado para manejar responsive de forma segura en SSR
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Establecer el tamaño inicial
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowSize.width < 640;
  const isTablet = windowSize.width >= 640 && windowSize.width < 1024;
  const isDesktop = windowSize.width >= 1024;

  return { windowSize, isMobile, isTablet, isDesktop };
}

// Componente local para cargar el SVG desde public/Mapa.svg y aplicar interactividad sin parpadeo
function SvgMap({ percentageByDepartmentData, getColorForCount, setSvgTooltip, setComputedMarkers }: any) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgLoadedRef = useRef(false);
  const [svgLoaded, setSvgLoaded] = useState(false);

  // Función interna para colorear los paths del SVG (evita dependencias externas)
  const getColorForCountInternal = useCallback((count: number) => {
    if (count >= 200) return '#ef4444'; // rojo
    if (count >= 100) return '#f59e0b'; // amarillo
    return '#10b981'; // verde
  }, []);

  // Lista completa de todos los departamentos de Colombia (32 + Bogotá D.C.)
  const todosLosDepartamentos = useMemo(() => [
    "AMAZONAS", "ANTIOQUIA", "ARAUCA", "ATLÁNTICO", "BOLÍVAR", "BOYACÁ", 
    "CALDAS", "CAQUETÁ", "CASANARE", "CAUCA", "CESAR", "CHOCÓ", 
    "CÓRDOBA", "CUNDINAMARCA", "GUAINÍA", "GUAVIARE", "HUILA", 
    "LA GUAJIRA", "MAGDALENA", "META", "NARIÑO", "NORTE DE SANTANDER", 
    "PUTUMAYO", "QUINDÍO", "RISARALDA", "SAN ANDRÉS Y PROVIDENCIA", 
    "SANTANDER", "SUCRE", "TOLIMA", "VALLE DEL CAUCA", "VAUPÉS", 
    "VICHADA", "BOGOTÁ D.C."
  ], []);

  // Mapeo temporal - se actualizará según la identificación visual
  const departamentosMapping = useMemo(() => [
    "NARIÑO", "PUTUMAYO","CHOCÓ",  "GUAINÍA", "VAUPÉS", "AMAZONAS", 
    "LA GUAJIRA" ,"CESAR" ,"NORTE DE SANTANDER" , "ARAUCA","BOYACÁ", "VICHADA", 
    "CAUCA","VALLE DEL CAUCA","ANTIOQUIA" ,"CÓRDOBA","SUCRE",
    "BOLÍVAR","ATLÁNTICO" ,"MAGDALENA","" ,"" 
    ,"CAQUETÁ", 
    "HUILA", "GUAVIARE","CALDAS", "CASANARE","META","BOGOTÁ D.C.","SANTANDER", 
    "TOLIMA", "QUINDÍO", "CUNDINAMARCA","RISARALDA",
  ], []);

  // Cargar el SVG solo una vez
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch('/colombia.svg');
        const text = await res.text();
        if (!mounted) return;
        if (containerRef.current) {
          containerRef.current.innerHTML = text;
          // Asegurar que el SVG se ajuste correctamente
          const svg = containerRef.current.querySelector('svg');
          if (svg) {
            svg.style.width = '100%';
            svg.style.height = '100%';
            svg.style.maxWidth = '100%';
            svg.style.maxHeight = '100%';
            svg.style.objectFit = 'contain';
          }
          svgLoadedRef.current = true;
          setSvgLoaded(true);
        }
      } catch (err) {
        console.error('Error loading SVG map', err);
      }
    };
    if (!svgLoadedRef.current) load();
    return () => { mounted = false; };
  }, []);

  // useEffect para procesar departamentos cuando el SVG esté cargado
  useEffect(() => {
    if (svgLoaded && containerRef.current) {
      console.log("[MAP DEBUG] SVG loaded, processing departments");
      const timer = setTimeout(() => {
        if (containerRef.current) {
          const svg = containerRef.current.querySelector('svg');
          if (svg) {
            const paths = Array.from(svg.querySelectorAll('path')) as SVGPathElement[];
            console.log("[MAP DEBUG] Found", paths.length, "paths in SVG");
            
            // Procesar todos los paths con datos de prueba si no hay datos reales
            const depDataArr = (percentageByDepartmentData?.departamentos || []);
            const hasRealData = depDataArr.length > 0;
            
            paths.forEach((p, idx) => {
              if (idx === 20 || idx === 21) {
                p.style.fill = 'transparent';
                p.style.pointerEvents = 'none';
                return;
              }
              
              const depName = departamentosMapping[idx] || `Región ${idx+1}`;
              let fill = '#eee';
              let total = 0;
              let porcentaje = 0;
              
              if (hasRealData) {
                const depObj = depDataArr.find((d: any) => {
                  const d1 = (d.department || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase();
                  const d2 = depName.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase();
                  return d1 === d2;
                });
                
                if (depObj) {
                  fill = getColorForCountInternal(depObj.total || 0);
                  total = depObj.total || 0;
                  porcentaje = depObj.porcentaje || 0;
                }
              } else {
                // Usar datos de prueba
                total = Math.floor(Math.random() * 100) + 10;
                porcentaje = Math.floor(Math.random() * 20) + 1;
                fill = getColorForCountInternal(total);
              }
              
              p.style.transition = 'fill 200ms ease';
              p.style.fill = fill;
              p.style.cursor = 'pointer';
              
              // Agregar event listeners para tooltips
              p.onmousemove = (ev: any) => {
                const svgRect = svg.getBoundingClientRect();
                const relX = ev.clientX - svgRect.left;
                const relY = ev.clientY - svgRect.top;
                setSvgTooltip && setSvgTooltip({
                  department: depName,
                  cases: total,
                  percentage: porcentaje,
                  mouseX: relX,
                  mouseY: relY
                });
              };
              p.onmouseleave = () => setSvgTooltip && setSvgTooltip(null);
              
              // Comentado: Agregar texto del departamento (removido para limpiar el mapa)
              // try {
              //   const bbox = p.getBBox();
              //   if (bbox.width > 0 && bbox.height > 0) {
              //     const cx = bbox.x + bbox.width / 2;
              //     const cy = bbox.y + bbox.height / 2;
              //     
              //     const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              //     text.setAttribute('x', String(cx));
              //     text.setAttribute('y', String(cy));
              //     text.setAttribute('text-anchor', 'middle');
              //     text.setAttribute('dominant-baseline', 'middle');
              //     text.setAttribute('font-size', '6');
              //     text.setAttribute('font-weight', 'bold');
              //     text.setAttribute('fill', '#000000');
              //     text.setAttribute('pointer-events', 'none');
              //     text.setAttribute('data-region-number', 'true');
              //     text.textContent = depName;
              //     
              //     svg.appendChild(text);
              //   }
              // } catch (e) {
              //   console.warn(`Error adding text to path ${idx}:`, e);
              // }
            });
            
            console.log("[MAP DEBUG] Departments processed successfully");
          }
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [svgLoaded, percentageByDepartmentData, departamentosMapping, getColorForCountInternal]);

  // Actualizar colores, tooltips y marcadores cuando cambian los datos
  useEffect(() => {
    if (!svgLoadedRef.current || !containerRef.current) return;
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    // Limpiar event listeners previos, marcadores y números
    const prevGroup = svg.querySelector('g[data-generated-markers]');
    if (prevGroup) prevGroup.remove();
    const prevNumbers = svg.querySelectorAll('text[data-region-number]');
    prevNumbers.forEach(num => num.remove());
    const paths = Array.from(svg.querySelectorAll('path')) as SVGPathElement[];
    const markers: any[] = [];

    // Mapear departamentos por orden de aparición de los <path>
    const depDataArr = (percentageByDepartmentData?.departamentos || []);
    console.log("[MAP DEBUG] Available departments in data:", depDataArr.map((d: any) => d.department));
    console.log("[MAP DEBUG] SVG paths count:", paths.length);
    console.log("[MAP DEBUG] Department mapping:", departamentosMapping);
    
    paths.forEach((p, idx) => {
      // Ocultar regiones 21 y 22 (índices 20 y 21)
      if (idx === 20 || idx === 21) {
        p.style.fill = 'transparent';
        p.style.pointerEvents = 'none';
        return;
      }
      
      const depName = departamentosMapping[idx] || `Región ${idx+1}`;
      // Buscar el dato correspondiente (ignorando tildes y mayúsculas)
      const depObj = depDataArr.find((d: any) => {
        const d1 = (d.department || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase();
        const d2 = depName.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase();
        return d1 === d2;
      });
      
      console.log(`[MAP DEBUG] Path ${idx}: ${depName} -> Found data:`, depObj ? depObj.department : 'NO DATA');
      const fill = depObj ? getColorForCount(depObj.total || 0) : '#eee';
      p.style.transition = 'fill 200ms ease';
      p.style.fill = fill;
      
      // Comentado: Agregar número visible en cada región (removido para limpiar el mapa)
      // try {
      //   const bbox = p.getBBox();
      //   if (bbox.width > 0 && bbox.height > 0) {
      //     const cx = bbox.x + bbox.width / 2;
      //     const cy = bbox.y + bbox.height / 2;
      //     
      //     // Crear elemento de texto para mostrar el departamento
      //     const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      //     text.setAttribute('x', String(cx));
      //     text.setAttribute('y', String(cy));
      //     text.setAttribute('text-anchor', 'middle');
      //     text.setAttribute('dominant-baseline', 'middle');
      //     text.setAttribute('font-size', '6');
      //     text.setAttribute('font-weight', 'bold');
      //     text.setAttribute('fill', '#000000');
      //     text.setAttribute('pointer-events', 'none');
      //     text.setAttribute('data-region-number', 'true'); // Identificador para limpiar después
      //     text.textContent = depName;
      //     
      //     // Agregar al SVG
      //     svg.appendChild(text);
      //   }
      // } catch (e) {
      //   console.warn(`Error adding number to path ${idx}:`, e);
      // }
      // Limpiar listeners previos
      p.onmousemove = null;
      p.onmouseleave = null;
      // Tooltip
      p.onmousemove = (ev: any) => {
        const svgRect = svg.getBoundingClientRect();
        const relX = ev.clientX - svgRect.left;
        const relY = ev.clientY - svgRect.top;
        setSvgTooltip && setSvgTooltip({
          department: depName,
          cases: depObj ? depObj.total : 0,
          percentage: depObj ? depObj.porcentaje : 0,
          mouseX: relX,
          mouseY: relY
        });
      };
      p.onmouseleave = () => setSvgTooltip && setSvgTooltip(null);
      // Centroid para marcador
      try {
        const bbox = p.getBBox();
        if (bbox.width > 0 && bbox.height > 0 && depObj) {
          const cx = bbox.x + bbox.width / 2;
          const cy = bbox.y + bbox.height / 2;
          markers.push({ department: depName, x: cx, y: cy, cases: depObj.total, percentage: depObj.porcentaje, idx });
        }
      } catch (e) {}
    });
    // Marcadores
    const markerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    markerGroup.setAttribute('data-generated-markers', 'true');
    markers.forEach(m => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', String(m.x));
      c.setAttribute('cy', String(m.y));
      c.setAttribute('r', '5');
      c.setAttribute('fill', '#111827');
      c.setAttribute('stroke', '#fff');
      c.setAttribute('stroke-width', '1');
      c.setAttribute('data-department', m.department);
      c.style.cursor = 'pointer';
      c.onmousemove = (ev: any) => {
        const svgRect = svg.getBoundingClientRect();
        const relX = ev.clientX - svgRect.left;
        const relY = ev.clientY - svgRect.top;
        setSvgTooltip && setSvgTooltip({ department: m.department, cases: m.cases, percentage: m.percentage, mouseX: relX, mouseY: relY });
      };
      c.onmouseleave = () => setSvgTooltip && setSvgTooltip(null);
      markerGroup.appendChild(c);
    });
    svg.appendChild(markerGroup);
    setComputedMarkers(markers);
  }, [setSvgTooltip,percentageByDepartmentData,setComputedMarkers]);

  useEffect(() => {
    // Ajustar el SVG para que ocupe todo el contenedor
    if (!svgLoadedRef.current || !containerRef.current) return;
    const svg = containerRef.current.querySelector('svg');
    if (svg) {
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.maxWidth = '100%';
      svg.style.maxHeight = '100%';
      svg.style.display = 'block';
      svg.style.objectFit = 'contain';

      try {
        // Calcular bounding box combinado de todos los paths para ajustar viewBox
        const paths = Array.from(svg.querySelectorAll('path')) as SVGPathElement[];
        if (paths.length > 0) {
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          paths.forEach(p => {
            try {
              const b = p.getBBox();
              if (b.x < minX) minX = b.x;
              if (b.y < minY) minY = b.y;
              if (b.x + b.width > maxX) maxX = b.x + b.width;
              if (b.y + b.height > maxY) maxY = b.y + b.height;
            } catch (e) {
              // ignore
            }
          });
          if (isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY)) {
            // Ajustar viewBox para que el mapa quepa completamente en el contenedor
            const originalWidth = maxX - minX;
            const originalHeight = maxY - minY;
            const zoomFactor = 0.85; // Reducir viewBox para que quepa mejor (menos agresivo)
            const newWidth = originalWidth * zoomFactor;
            const newHeight = originalHeight * zoomFactor;
            const centerX = minX + originalWidth / 2;
            const centerY = minY + originalHeight / 2;
            const vbX = Math.floor(centerX - newWidth / 2);
            const vbY = Math.floor(centerY - newHeight / 2);
            const vbW = Math.ceil(newWidth);
            const vbH = Math.ceil(newHeight);
            svg.setAttribute('viewBox', `${vbX} ${vbY} ${vbW} ${vbH}`);
            svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          }
        }
      } catch (e) {
        console.warn('No se pudo recalcular viewBox del SVG', e);
      }
    }
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ 
        width: '130%', 
        height: '130%', 
        minHeight: 260, 
        minWidth: 364, 
        maxWidth: '130%',
        maxHeight: '130%',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'transparent',
        overflow: 'hidden' // Evitar que el contenido se desborde
      }}
    />
  );
}

export default function EstadisticasView() {
  // Hook para manejar el tamaño de pantalla de forma segura
  const { windowSize, isMobile, isTablet, isDesktop } = useWindowSize();

  // Procesar datos de la API de procesos por departamento y ciudad
  const getGeographicTableData = (): Array<{
    departamento: string;
    ciudad: string;
    casosActivos: number;
    casosFinalizados: number;
    rapidezFijacion: number | string | null;
    rapidezCelebracion: number | string | null;
    numeroCasos: number;
    porcentaje: number;
  }> => {
    // Combinar datos de ambas APIs cuando estén disponibles
    if (
      percentageByDepartmentData &&
      departmentCityData &&
      Array.isArray(percentageByDepartmentData.departamentos)
    ) {
      return percentageByDepartmentData.departamentos.flatMap(dep => {
        const depName = dep.department || 'SIN_DEPARTAMENTO';
        const depPorcentaje = dep.porcentaje || 0;
        const ciudades = dep.ciudades || {};
        
        return Object.entries(ciudades).map(([ciudad, cantidadPorcentaje]) => {
          // Buscar datos adicionales en departmentCityData
          const cityMetrics = departmentCityData.records?.[depName]?.[ciudad];
          
          return {
            departamento: depName,
            ciudad,
            casosActivos: cityMetrics?.activos || 0,
            casosFinalizados: cityMetrics?.finalizados || 0,
            rapidezFijacion: cityMetrics?.rapidezMediaFijacionDemanda,
            rapidezCelebracion: cityMetrics?.rapidezMediaCelebraAudiencia,
            numeroCasos: cityMetrics?.total || cantidadPorcentaje || 0,
            porcentaje: depPorcentaje
          };
        });
      });
    }
    
    // Fallback usando solo percentageByDepartmentData
    if (
      percentageByDepartmentData &&
      Array.isArray(percentageByDepartmentData.departamentos)
    ) {
      return percentageByDepartmentData.departamentos.flatMap(dep => {
        const depName = dep.department || 'SIN_DEPARTAMENTO';
        const depPorcentaje = dep.porcentaje || 0;
        const ciudades = dep.ciudades || {};
        
        return Object.entries(ciudades).map(([ciudad, cantidad]) => ({
          departamento: depName,
          ciudad,
          casosActivos: Math.floor((cantidad as number) * 0.6) || 0, // Estimación 60% activos
          casosFinalizados: Math.floor((cantidad as number) * 0.4) || 0, // Estimación 40% finalizados
          rapidezFijacion: null,
          rapidezCelebracion: null,
          numeroCasos: cantidad as number || 0,
          porcentaje: depPorcentaje
        }));
      });
    }
    
    // fallback mock
    return [];
  };

  // Utilidad para colorear los paths del SVG
  const getColorForCount = (count: number) => {
    if (count >= 200) return '#ef4444'; // rojo
    if (count >= 100) return '#f59e0b'; // amarillo
    return '#10b981'; // verde
  };
  const [activeTab, setActiveTab] = useState("general");

  // Estados para tabs y datos
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  // Estados independientes para cada gráfica en la pestaña de estados del proceso
  const [activeProcesosYear, setActiveProcesosYear] = useState<number>(new Date().getFullYear());
  const [finalizadoProcesosYear, setFinalizadoProcesosYear] = useState<number>(new Date().getFullYear());
  const [activeVsTimeYear, setActiveVsTimeYear] = useState<number>(new Date().getFullYear());
  const [finalizedVsTimeYear, setFinalizedVsTimeYear] = useState<number>(new Date().getFullYear());
  const [audienciasYear, setAudienciasYear] = useState<number>(new Date().getFullYear());
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedMapData, setSelectedMapData] = useState<{
    region: string;
    activos: number;
    finalizados: number;
    total: number;
    rapidez: string;
  } | null>(null);
  const [svgTooltip, setSvgTooltip] = useState<{
    department: string;
    cases: number;
    percentage: number;
    mouseX: number;
    mouseY: number;
  } | null>(null);
  const [computedMarkers, setComputedMarkers] = useState<any[]>([]);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [activeProcesosData, setActiveProcesosData] = useState<any>(null);
  const [finalizadoProcesosData, setFinalizadoProcesosData] = useState<any>(null);
  const [docSelectedYear, setDocSelectedYear] = useState<number>(new Date().getFullYear());
  const [docSelectedMonth, setDocSelectedMonth] = useState<string>('01');
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [docLineSelectedYear, setDocLineSelectedYear] = useState<number>(new Date().getFullYear());
  
  // Estado para hover simple sobre mapa (tabla)
  const [hoveredRegionSimple, setHoveredRegionSimple] = useState<any>(null);
  const { 
    activeInactiveData,
    lawsuitsHearingsData,
    processesByStateData,
    processesByStateYearData,
    finishedProcessesByStateYearData,
    departmentCityData,
    percentageByDepartmentData,
    filedLawsuitsByUserData,
    documentationData,
    documentationMonthlyData,
    processTrackingData,
    loading,
    error,
    getActiveInactiveByMonth,
    getLawsuitsHearingsByMonth,
    getProcessesByState,
    getProcessesByStateYear,
    getFinishedProcessesByStateYear,
    getDepartmentCityMetrics,
    getPercentageByDepartment,
    getFiledLawsuitsByUser,
    getDocumentationStatistics,
    getDocumentationMonthly,
    getProcessTracking,
  } = useEstadisticas();

  // Estados para las gráficas específicas del tab "Estados del proceso"
  // hoveredRegion ya está declarado más arriba

  // Función para cargar datos de procesos activos por año
  const loadProcesosActivosPorAnio = useCallback(async (year: number) => {
    try {
      await getProcessesByStateYear({ year, type: "ACTIVO" });
    } catch (error) {
      console.error("Error cargando procesos activos por año:", error);
    }
  }, [getProcessesByStateYear]);

  // Cargar datos de procesos activos específicos
  const loadProcesosActivosData = useCallback(async () => {
    try {
      const result = await getProcessesByState({ type: "ACTIVO" });
      setActiveProcesosData(result);
    } catch (error) {
      console.error("Error cargando procesos activos:", error);
    }
  }, [getProcessesByState]);

  // Cargar datos de procesos finalizados específicos
  const loadProcesosFinalizadosData = useCallback(async () => {
    try {
      const result = await getProcessesByState({ type: "FINALIZADO" });
      setFinalizadoProcesosData(result);
    } catch (error) {
      console.error("Error cargando procesos finalizados:", error);
    }
  }, [getProcessesByState]);

  // Funciones independientes para cada gráfica de tiempo
  const loadActiveVsTimeData = useCallback(async (year?: number) => {
    try {
      await getProcessesByStateYear({ year: year || activeVsTimeYear, type: "ACTIVO" });
    } catch (error) {
      console.error("Error cargando procesos activos vs tiempo:", error);
    }
  }, [getProcessesByStateYear, activeVsTimeYear]);

  const loadFinalizedVsTimeData = useCallback(async (year?: number) => {
    try {
      await getFinishedProcessesByStateYear({ year: year || finalizedVsTimeYear, type: "FINALIZADO" });
    } catch (error) {
      console.error("Error cargando procesos finalizados vs tiempo:", error);
    }
  }, [getFinishedProcessesByStateYear, finalizedVsTimeYear]);

  const loadAudienciasData = useCallback(async (year?: number) => {
    try {
      await getLawsuitsHearingsByMonth({ year: year || audienciasYear });
    } catch (error) {
      console.error("Error cargando audiencias:", error);
    }
  }, [getLawsuitsHearingsByMonth, audienciasYear]);

  // Función para cargar datos de procesos finalizados por año
  const loadProcesosFinalizadosPorAnio = useCallback(async (year: number) => {
    try {
      await getFinishedProcessesByStateYear({ year, type: "FINALIZADO" });
    } catch (error) {
      console.error("Error cargando procesos finalizados por año:", error);
    }
  }, [getFinishedProcessesByStateYear]);

  // Función para manejar cambio de año
  const handleYearChange = useCallback((year: number) => {
    setSelectedYear(year);
    loadProcesosActivosPorAnio(year);
    loadProcesosFinalizadosPorAnio(year);
  }, [loadProcesosActivosPorAnio, loadProcesosFinalizadosPorAnio]);

  // Funciones para el mapa interactivo
  const handleRegionClick = useCallback((regionName: string) => {
    setSelectedRegion(regionName);
  }, []);

  const handleMapClick = useCallback((event: React.MouseEvent<HTMLImageElement>) => {
    // Simular selección de región basada en coordenadas del click
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Determinar región basada en coordenas aproximadas
    let selectedData = null;
    
    if (x > 100 && x < 200 && y > 100 && y < 200) {
      // Área de Bogotá
      selectedData = {
        region: 'Cundinamarca - Bogotá',
        activos: 245,
        finalizados: 156,
        total: 401,
        rapidez: '12 días'
      };
    } else if (x > 50 && x < 150 && y > 150 && y < 250) {
      // Área de Antioquia
      selectedData = {
        region: 'Antioquia - Medellín',
        activos: 127,
        finalizados: 89,
        total: 216,
        rapidez: '15 días'
      };
    } else if (x > 80 && x < 180 && y > 200 && y < 300) {
      // Área de Valle del Cauca
      selectedData = {
        region: 'Valle del Cauca - Cali',
        activos: 98,
        finalizados: 67,
        total: 165,
        rapidez: '18 días'
      };
    } else {
      // Región general
      selectedData = {
        region: 'seleccionada',
        activos: 54,
        finalizados: 38,
        total: 92,
        rapidez: '16 días'
      };
    }
    
    setSelectedMapData(selectedData);
  }, []);

  const handleMapMouseMove = useCallback((event: React.MouseEvent<HTMLImageElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Simular detección de región en hover
    let regionInfo = null;
    
    if (x > 100 && x < 200 && y > 100 && y < 200) {
      regionInfo = {
        name: 'Bogotá D.C.',
        x,
        y,
        cases: 401
      };
    } else if (x > 50 && x < 150 && y > 150 && y < 250) {
      regionInfo = {
        name: 'Antioquia',
        x,
        y,
        cases: 216
      };
    } else if (x > 80 && x < 180 && y > 200 && y < 300) {
      regionInfo = {
        name: 'Valle del Cauca',
        x,
        y,
        cases: 165
      };
    }
    
  // usar hoveredRegionSimple en la tabla de distribución geográfica
  setHoveredRegionSimple(regionInfo);
  }, []);

  const handleMapMouseLeave = useCallback(() => {
  setHoveredRegionSimple(null);
  }, []);

  useEffect(() => {
    // Cargar todas las estadísticas al montar el componente
    const currentYear = new Date().getFullYear();
    
    // Datos por mes (ejemplo para el año actual)
    getActiveInactiveByMonth({ year: currentYear });
    getLawsuitsHearingsByMonth({ year: currentYear });
    
    // Datos por estado (procesos activos)
    getProcessesByState({ type: "ACTIVO" });
    
    // Datos por año y estado (procesos activos)
    getProcessesByStateYear({ year: currentYear, type: "ACTIVO" });
    
    // Procesos finalizados por año y estado
    getFinishedProcessesByStateYear({ year: currentYear, type: "FINALIZADO" });

    // Datos para distribución geográfica
    getDepartmentCityMetrics();
    getPercentageByDepartment();

    // Datos para documentación
    getDocumentationStatistics();
    getDocumentationMonthly({ year: currentYear, month: 1, type: "ACTIVO" }); // Enero como mes inicial
    getProcessTracking({ month: "January", year: currentYear }); // Mes en inglés

    // Datos para demandas por usuario (ejemplo con fechas del año actual)
    getFiledLawsuitsByUser({ 
      year: currentYear,
      month: 1,
      type: "ACTIVO"
    });

    // Cargar datos específicos para el tab "Estados del proceso"
    loadProcesosActivosData();
    loadProcesosFinalizadosData();
    loadProcesosActivosPorAnio(currentYear);
    loadProcesosFinalizadosPorAnio(currentYear);
  }, [
    getActiveInactiveByMonth, 
    getLawsuitsHearingsByMonth, 
    getProcessesByState, 
    getProcessesByStateYear, 
    getFinishedProcessesByStateYear,
    getDepartmentCityMetrics,
    getPercentageByDepartment,
    getDocumentationStatistics,
    getDocumentationMonthly,
    getProcessTracking,
    getFiledLawsuitsByUser,
    loadProcesosActivosData, 
    loadProcesosFinalizadosData, 
    loadProcesosActivosPorAnio, 
    loadProcesosFinalizadosPorAnio
  ]);

  // useEffect separado para recargar datos cuando cambie el año seleccionado para audiencias
  useEffect(() => {
    if (audienciasYear) {
      getLawsuitsHearingsByMonth({ year: audienciasYear });
    }
  }, [audienciasYear, getLawsuitsHearingsByMonth]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando estadísticas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error al cargar las estadísticas: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Calcular totales a partir de los datos obtenidos
  const totalActiveProcesses = activeInactiveData?.activeProcesses || 0;
  const totalInactiveProcesses = activeInactiveData?.inactiveProcesses || 0;
  const totalLawsuits = lawsuitsHearingsData?.summary?.totalLawsuits || 0;
  const totalHearings = lawsuitsHearingsData?.summary?.totalHearings || 0;

  // Datos ficticios para las secciones que están pendientes de API
  const geographicData = [
    { region: "Bogotá D.C.", count: 45, percentage: 35 },
    { region: "Antioquia", count: 32, percentage: 25 },
    { region: "Valle del Cauca", count: 28, percentage: 22 },
    { region: "Cundinamarca", count: 15, percentage: 12 },
    { region: "Otros", count: 8, percentage: 6 }
  ];

  // Fallback typed table data (usado cuando no hay datos de API)
  const geographicTableData: Array<{
    departamento: string;
    ciudad: string;
    casosActivos: number;
    casosActivosPercentage?: string;
    casosFinalizados: number;
    rapidezFijacion: number | string | null;
    rapidezCelebracion: number | string | null;
    numeroCasos: number;
    porcentaje: number;
  }> = [
    {
      departamento: 'Cundinamarca',
      ciudad: 'Bogotá',
      casosActivos: 4,
      casosActivosPercentage: '20%',
      casosFinalizados: 7,
      rapidezFijacion: null,
      rapidezCelebracion: null,
      numeroCasos: 265,
      porcentaje: 35
    }
  ];

  const mockDocumentationData = [
    { type: "Demandas", count: 156, percentage: 40 },
    { type: "Contestaciones", count: 120, percentage: 31 },
    { type: "Escritos", count: 89, percentage: 23 },
    { type: "Poderes", count: 23, percentage: 6 }
  ];

  // Datos para la tabla de documentos (según imagen)
  const documentTableData = [
    { tipoDocumento: "Memorial", subdocumento: "Impulso procesal", numero: 6 },
    { tipoDocumento: "Memorial", subdocumento: "Subsanación", numero: 109 },
    { tipoDocumento: "Concepto", subdocumento: "Otros", numero: 50 },
    { tipoDocumento: "Derecho de Petición", subdocumento: "Impulso procesal", numero: 30 }
  ];

  // Datos para gráfica de pastel de documentos (según imagen)
  const documentPieData = [
    { name: "Concepto", value: 24, color: "#10b981" },
    { name: "Demanda", value: 28, color: "#3b82f6" },
    { name: "Memoriales", value: 9, color: "#ec4899" },
    { name: "Poderes", value: 21, color: "#f59e0b" },
    { name: "Tutelas", value: 18, color: "#ef4444" }
  ];

  // Datos para gráfica de líneas de demandas por usuario (según imagen)
  const demandasUsuarioData = [
    { name: "Ene", pepitoPerez: 10, juanita: 28 },
    { name: "Feb", pepitoPerez: 5, juanita: 23 },
    { name: "Mar", pepitoPerez: 15, juanita: 26 },
    { name: "Abr", pepitoPerez: 10, juanita: 29 },
    { name: "May", pepitoPerez: 35, juanita: 47 },
    { name: "Jun", pepitoPerez: 32, juanita: 52 },
    { name: "Jul", pepitoPerez: 28, juanita: 53 },
    { name: "Ago", pepitoPerez: 10, juanita: 41 },
    { name: "Sep", pepitoPerez: 25, juanita: 48 },
    { name: "Oct", pepitoPerez: 26, juanita: 46 },
    { name: "Nov", pepitoPerez: 35, juanita: 52 },
    { name: "Dic", pepitoPerez: 29, juanita: 48 }
  ];

  // Función para convertir datos de documentación mensual a formato de gráfico de pastel
  const getDocumentationPieData = () => {
    if (documentationMonthlyData?.percents) {
      const colors = ["#10b981", "#3b82f6", "#ec4899", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
      return Object.entries(documentationMonthlyData.percents).map(([key, value], index) => ({
        name: key,
        value: Math.round(value),
        color: colors[index % colors.length]
      }));
    }
    return documentPieData; // Fallback a datos mock
  };

  // Función para convertir datos de demandas por usuario para gráfico de líneas (real API)
  const getFiledLawsuitsChartData = () => {
    if (
      filedLawsuitsByUserData?.records &&
      Array.isArray(filedLawsuitsByUserData.records) &&
      filedLawsuitsByUserData.records.length > 0
    ) {
      // Agrupar por mes y usuario
      // Suponiendo que cada item tiene: { userInfo: {name, lastname}, count, month, year }
      const months = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
      ];
      // Obtener todos los usuarios únicos
      const users = Array.from(
        new Set(
          filedLawsuitsByUserData.records.map(
            (item) => `${item.userInfo?.name || ''} ${item.userInfo?.lastname || ''}`.trim()
          )
        )
      );
      // Inicializar estructura por mes
      const dataByMonth = months.map((monthName, idx) => {
        const monthNum = idx + 1;
        const entry: Record<string, number | string> = { name: monthName };
        users.forEach((user) => {
          entry[user] = 0;
        });
        // Buscar registros de este mes
        filedLawsuitsByUserData.records.forEach((item) => {
          const user = `${item.userInfo?.name || ''} ${item.userInfo?.lastname || ''}`.trim();
          if (item.month === monthNum && users.includes(user)) {
            entry[user] = item.count || 0;
          }
        });
        return entry;
      });
      return { dataByMonth, users };
    }
    // Fallback a datos mock
    return { dataByMonth: demandasUsuarioData, users: ['Pepito Perez', 'Juanita'] };
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 min-w-0 overflow-x-hidden">
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Estadísticas</h1>
          <p className="text-muted-foreground text-xs sm:text-sm md:text-base">Visualiza métricas y análisis de tu trabajo legal</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4 w-full h-auto bg-transparent p-0 gap-1 sm:gap-2 lg:gap-3">
            <TabsTrigger 
              value="general" 
              className="flex items-center justify-center px-3 py-3 sm:px-2 sm:py-2 lg:px-3 lg:py-2.5 text-xs font-bold rounded-lg border-2 border-pink-500 bg-white text-pink-500 hover:bg-pink-50 data-[state=active]:bg-pink-500 data-[state=active]:text-white data-[state=active]:border-pink-500 transition-colors min-h-[42px] sm:min-h-[36px] lg:min-h-[40px] w-full"
            >
              <span className="hidden lg:inline text-center leading-tight">Métricas Generales de Procesos</span>
              <span className="hidden sm:inline lg:hidden text-center leading-tight">Métricas Generales</span>
              <span className="sm:hidden text-center">Generales</span>
            </TabsTrigger>
            <TabsTrigger 
              value="estados" 
              className="flex items-center justify-center px-3 py-3 sm:px-2 sm:py-2 lg:px-3 lg:py-2.5 text-xs font-bold rounded-lg border-2 border-pink-500 bg-white text-pink-500 hover:bg-pink-50 data-[state=active]:bg-pink-500 data-[state=active]:text-white data-[state=active]:border-pink-500 transition-colors min-h-[42px] sm:min-h-[36px] lg:min-h-[40px] w-full"
            >
              <span className="hidden lg:inline text-center leading-tight">Estados del Proceso</span>
              <span className="hidden sm:inline lg:hidden text-center leading-tight">Estados Proceso</span>
              <span className="sm:hidden text-center">Estados</span>
            </TabsTrigger>
            <TabsTrigger 
              value="geografica" 
              className="flex items-center justify-center px-3 py-3 sm:px-2 sm:py-2 lg:px-3 lg:py-2.5 text-xs font-bold rounded-lg border-2 border-pink-500 bg-white text-pink-500 hover:bg-pink-50 data-[state=active]:bg-pink-500 data-[state=active]:text-white data-[state=active]:border-pink-500 transition-colors min-h-[42px] sm:min-h-[36px] lg:min-h-[40px] w-full"
            >
              <span className="hidden lg:inline text-center leading-tight">Distribución Geográfica</span>
              <span className="hidden sm:inline lg:hidden text-center leading-tight">Dist. Geográfica</span>
              <span className="sm:hidden text-center">Geográfica</span>
            </TabsTrigger>
            <TabsTrigger 
              value="documentacion" 
              className="flex items-center justify-center px-3 py-3 sm:px-2 sm:py-2 lg:px-3 lg:py-2.5 text-xs font-bold rounded-lg border-2 border-pink-500 bg-white text-pink-500 hover:bg-pink-50 data-[state=active]:bg-pink-500 data-[state=active]:text-white data-[state=active]:border-pink-500 transition-colors min-h-[42px] sm:min-h-[36px] lg:min-h-[40px] w-full"
            >
              <span className="hidden lg:inline text-center leading-tight">Documentación</span>
              <span className="hidden sm:inline lg:hidden text-center leading-tight">Documentación</span>
              <span className="sm:hidden text-center">Docs</span>
            </TabsTrigger>
          </TabsList>

        {/* 1. Métricas Generales de Procesos */}
        <TabsContent value="general" className="space-y-4 sm:space-y-6">
          {/* Solo la gráfica principal: Procesos vs Tiempo */}
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                <BarChart className="h-4 w-4 sm:h-5 sm:w-5" />
                Procesos vs Tiempo
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Evolución temporal de procesos activos e inactivos
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="h-64 sm:h-80 md:h-96">
                {activeInactiveData?.monthlyMetrics && activeInactiveData.monthlyMetrics.length > 0 ? (
                  <div className="space-y-4">
                    {/* Resumen numérico */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-3 sm:gap-4">
                      <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 sm:gap-4 lg:gap-8">
                        <div className="min-w-[70px] sm:min-w-[100px] lg:min-w-[120px] text-center sm:text-left">
                          <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900">{activeInactiveData.monthlyMetrics.reduce((sum, m) => sum + (m.activeProcesses || 0), 0)}</div>
                          <div className="text-xs sm:text-sm text-muted-foreground">Procesos activos</div>
                        </div>
                        <div className="min-w-[70px] sm:min-w-[100px] lg:min-w-[120px] text-center sm:text-left">
                          <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900">{activeInactiveData.monthlyMetrics.reduce((sum, m) => sum + (m.inactiveProcesses || 0), 0)}</div>
                          <div className="text-xs sm:text-sm text-muted-foreground">Finalizados</div>
                        </div>
                        <div className="min-w-[70px] sm:min-w-[100px] lg:min-w-[120px] text-center sm:text-left">
                          <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900">{activeInactiveData.monthlyMetrics.reduce((sum, m) => sum + ((m.activeProcesses || 0) + (m.inactiveProcesses || 0)), 0)}</div>
                          <div className="text-xs sm:text-sm text-muted-foreground">Totales</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start lg:justify-end gap-2 sm:gap-3 lg:gap-4">
                        <div className="flex items-center whitespace-nowrap"><div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-pink-600 mr-1 sm:mr-2"></div><span className="text-xs sm:text-sm">Total</span></div>
                        <div className="flex items-center whitespace-nowrap"><div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500 mr-1 sm:mr-2"></div><span className="text-xs sm:text-sm">Finalizados</span></div>
                        <div className="flex items-center whitespace-nowrap"><div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-600 mr-1 sm:mr-2"></div><span className="text-xs sm:text-sm">Activos</span></div>
                      </div>
                    </div>

                    <SimpleMultiLineChart
                      series={(() => {
                        const activos = activeInactiveData.monthlyMetrics.map(m => ({ name: m.monthName.substring(0, 3), value: m.activeProcesses || 0 }));
                        const inactivos = activeInactiveData.monthlyMetrics.map(m => ({ name: m.monthName.substring(0, 3), value: m.inactiveProcesses || 0 }));
                        const totales = activeInactiveData.monthlyMetrics.map(m => ({ name: m.monthName.substring(0, 3), value: (m.activeProcesses || 0) + (m.inactiveProcesses || 0) }));

                        return [
                          { name: 'Total', data: totales, color: '#db2777' }, // rosa/púrpura
                          { name: 'Finalizados', data: inactivos, color: '#10b981' }, // verde
                          { name: 'Activos', data: activos, color: '#3b82f6' } // azul
                        ];
                      })()}
                      width={isMobile ? 600 : isTablet ? 750 : 900}
                      height={isMobile ? 220 : isTablet ? 250 : 280}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <BarChart className="h-12 w-12 mb-2 opacity-50" />
                    <p>No hay datos de procesos por mes disponibles</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Estados del Proceso */}
        <TabsContent value="estados" className="space-y-4 sm:space-y-6">
          {/* Dos tarjetas superiores: Procesos activos y Procesos finalizados */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-3 sm:pb-4 p-3 sm:p-6">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg font-semibold">Procesos activos</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Distribución por sub-estados</CardDescription>
                </div>
                <div className="flex-shrink-0">
                  <Select value={activeProcesosYear.toString()} onValueChange={(value) => {
                    const year = parseInt(value);
                    setActiveProcesosYear(year);
                    loadProcesosActivosData();
                  }}>
                    <SelectTrigger className="w-full sm:w-32 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2023, 2024, 2025, 2026].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="h-48 sm:h-64 md:h-72">
                  {activeProcesosData?.statistics && activeProcesosData.statistics.length > 0 ? (
                    <SimpleBarChart
                      data={activeProcesosData.statistics.slice(0, 8).map((st: any, idx: number) => ({
                        name: st.estado,
                        value: st.count || 0,
                        color: ['#10b981', '#6366f1', '#ef4444', '#16a34a', '#db2777', '#60a5fa', '#f59e0b', '#8b5cf6'][idx % 8]
                      }))}
                      width="100%"
                      height={isMobile ? 160 : isTablet ? 180 : 200}
                      barSize={isMobile ? 12 : 16}
                      barCategoryGap="8%"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">No hay datos</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-3 sm:pb-4 p-3 sm:p-6">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg font-semibold">Procesos finalizados</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Distribución por motivos de finalización</CardDescription>
                </div>
                <div className="flex-shrink-0">
                  <Select value={finalizadoProcesosYear.toString()} onValueChange={(value) => {
                    const year = parseInt(value);
                    setFinalizadoProcesosYear(year);
                    loadProcesosFinalizadosData();
                  }}>
                    <SelectTrigger className="w-full sm:w-32 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2023, 2024, 2025, 2026].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="h-48 sm:h-64 md:h-72">
                  {finalizadoProcesosData?.statistics && finalizadoProcesosData.statistics.length > 0 ? (
                    <SimpleBarChart
                      data={finalizadoProcesosData.statistics.slice(0, 8).map((st: any, idx: number) => ({
                        name: st.estado,
                        value: st.count || 0,
                        color: ['#10b981', '#6366f1', '#ef4444', '#16a34a', '#db2777', '#60a5fa', '#f59e0b', '#8b5cf6'][idx % 8]
                      }))}
                      width="100%"
                      height={isMobile ? 160 : isTablet ? 180 : 200}
                      barSize={isMobile ? 12 : 16}
                      barCategoryGap="8%"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">No hay datos</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficas por tiempo: activos vs tiempo y finalizados vs tiempo */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="flex items-center gap-3">
                    Procesos activos vs tiempo
                    <div className="text-3xl font-bold text-emerald-600">
                      {processesByStateYearData?.total || 0}
                    </div>
                    <div className="text-sm text-muted-foreground font-normal">Total</div>
                  </CardTitle>
                  <CardDescription>Totales mensuales por sub-estado</CardDescription>
                </div>
                <Select value={activeVsTimeYear.toString()} onValueChange={(value) => {
                  const year = parseInt(value);
                  setActiveVsTimeYear(year);
                  loadActiveVsTimeData(year);
                }}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2023, 2024, 2025, 2026].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <div className="h-64 sm:h-72 lg:h-80 overflow-x-auto">
                  {processesByStateYearData?.statistics && processesByStateYearData.statistics.length > 0 ? (
                    <SimpleGroupedBarChart
                      series={processesByStateYearData.statistics.map((st, idx) => ({
                        name: st.estado,
                        data: st.monthlyData ? st.monthlyData.map(m => ({ name: m.monthName.substring(0, 3), value: m.count || 0 })) : [],
                        color: ['#10b981', '#6366f1', '#ef4444', '#16a34a', '#db2777', '#60a5fa'][idx % 6]
                      }))}
                      width={isMobile ? 600 : isTablet ? 700 : 900}
                      height={isMobile ? 200 : isTablet ? 230 : 260}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">No hay datos</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="flex items-center gap-3">
                    Procesos finalizados vs tiempo
                    <div className="text-3xl font-bold text-blue-600">
                      {finishedProcessesByStateYearData?.total || 0}
                    </div>
                    <div className="text-sm text-muted-foreground font-normal">Total</div>
                  </CardTitle>
                  <CardDescription>Totales mensuales por motivo</CardDescription>
                </div>
                <Select value={finalizedVsTimeYear.toString()} onValueChange={(value) => {
                  const year = parseInt(value);
                  setFinalizedVsTimeYear(year);
                  loadFinalizedVsTimeData(year);
                }}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2023, 2024, 2025, 2026].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <div className="h-64 sm:h-72 lg:h-80 overflow-x-auto">
                  {finishedProcessesByStateYearData?.statistics && finishedProcessesByStateYearData.statistics.length > 0 ? (
                    <SimpleGroupedBarChart
                      series={finishedProcessesByStateYearData.statistics.map((st, idx) => ({
                        name: st.estado,
                        data: st.monthlyData ? st.monthlyData.map(m => ({ name: m.monthName.substring(0, 3), value: m.count || 0 })) : [],
                        color: ['#10b981', '#6366f1', '#ef4444', '#16a34a', '#db2777', '#60a5fa'][idx % 6]
                      }))}
                      width={isMobile ? 600 : isTablet ? 700 : 900}
                      height={isMobile ? 200 : isTablet ? 230 : 260}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">No hay datos</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Audiencias y radicados por tiempo - línea */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Audiencias y radicados vs tiempo
              </CardTitle>
              <CardDescription>Comparativa mensual audiencias vs radicados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 sm:h-88 lg:h-96 overflow-x-auto">
                {lawsuitsHearingsData ? (
                  <div className="space-y-4">
                    {/* Resumen numérico */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-4">
                      <div className="flex flex-wrap gap-4 sm:gap-6 lg:gap-8">
                        <div className="min-w-[100px] sm:min-w-[120px]">
                          <div className="text-2xl sm:text-3xl font-bold text-emerald-600">{lawsuitsHearingsData.filedLawsuits.total}</div>
                          <div className="text-xs sm:text-sm text-muted-foreground">Total radicados</div>
                        </div>
                        <div className="min-w-[100px] sm:min-w-[120px]">
                          <div className="text-2xl sm:text-3xl font-bold text-blue-600">{lawsuitsHearingsData.scheduledHearings.total}</div>
                          <div className="text-xs sm:text-sm text-muted-foreground">Total audiencias</div>
                        </div>
                        <div className="min-w-[100px] sm:min-w-[120px]">
                          <div className="text-2xl sm:text-3xl font-bold text-purple-600">{lawsuitsHearingsData.summary.totalLawsuits + lawsuitsHearingsData.summary.totalHearings}</div>
                          <div className="text-xs sm:text-sm text-muted-foreground">Total general</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                        <div className="flex items-center whitespace-nowrap"><div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-emerald-500 mr-1 sm:mr-2"></div><span className="text-xs sm:text-sm">Radicados</span></div>
                        <div className="flex items-center whitespace-nowrap"><div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-500 mr-1 sm:mr-2"></div><span className="text-xs sm:text-sm">Audiencias</span></div>
                      </div>
                    </div>

                    <SimpleMultiLineChart
                      series={[
                        { 
                          name: 'Radicados', 
                          data: lawsuitsHearingsData.filedLawsuits.metric.map(item => ({ name: item.monthName.substring(0, 3), value: item.count })), 
                          color: '#10b981' 
                        },
                        { 
                          name: 'Audiencias', 
                          data: lawsuitsHearingsData.scheduledHearings.metric.map(item => ({ name: item.monthName.substring(0, 3), value: item.count })), 
                          color: '#3b82f6' 
                        }
                      ]}
                      width={isMobile ? 600 : isTablet ? 750 : 900}
                      height={isMobile ? 280 : isTablet ? 320 : 360}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <LineChart className="h-8 w-8 sm:h-12 sm:w-12 mb-2 opacity-50" />
                    <p className="text-xs sm:text-sm text-center">No hay datos de demandas y audiencias disponibles</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Nueva sección: Procesos por mes (restringida a diseño: pill bar izquierda + donas derecha) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Procesos por mes
                </CardTitle>
                <CardDescription>Distribución mensual de procesos y desglose por tipo</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={audienciasYear.toString()} onValueChange={(value) => {
                  const year = parseInt(value);
                  setAudienciasYear(year);
                  getActiveInactiveByMonth({ year });
                }}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2023, 2024, 2025, 2026].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Selector de mes para filtrar la dona inferior (types-by-month). TODO: conectar con API real */}
                <Select value={selectedMonth} onValueChange={(value) => setSelectedMonth(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m, idx) => (
                      <SelectItem key={m} value={m}>{['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][idx]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 h-auto lg:h-[500px]">
                {/* Gráfica de barras a la izquierda: 3/4 de pantalla */}
                <div className="flex-1 lg:w-3/4 flex flex-col min-h-[300px] lg:min-h-[420px]">
                  <div className="flex-1 flex items-center">
                    {activeInactiveData?.monthlyMetrics && activeInactiveData.monthlyMetrics.length > 0 ? (
                      <SimpleBarChart
                        data={activeInactiveData.monthlyMetrics.map((m:any) => ({
                          name: m.monthName.substring(0,3),
                          value: (m.activeProcesses || 0) + (m.inactiveProcesses || 0),
                          color: '#db2777' // pink-600 uniforme
                        }))}
                        width="100%"
                        height={isMobile ? 250 : isTablet ? 300 : 420}
                        barSize={isMobile ? 20 : isTablet ? 24 : 28}
                        barCategoryGap="8%"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full text-muted-foreground">
                        <div className="text-center">
                          <BarChart className="h-8 w-8 sm:h-12 sm:w-12 mb-2 opacity-50 mx-auto" />
                          <p className="text-xs sm:text-sm">No hay datos mensuales</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Donas apiladas a la derecha: 1/4 de pantalla */}
                <div className="w-full lg:w-1/4 flex flex-row lg:flex-col justify-center lg:justify-start gap-4 lg:gap-6 min-h-[300px] lg:min-h-full py-2">
                  {/* Dona superior: Activos vs Finalizados */}
                  <div className="flex flex-col items-center flex-1 lg:flex-none">
                    <h4 className="text-xs sm:text-sm font-semibold text-emerald-600 mb-2 text-center">Activos vs Finalizados</h4>
                    <div className="flex items-center justify-center">
                      {(() => {
                        // Filtrar datos por mes seleccionado
                        const monthNum = parseInt(selectedMonth, 10);
                        const monthData = activeInactiveData?.monthlyMetrics?.find(m => m.month === monthNum);
                        
                        const activeCount = monthData?.activeProcesses || 0;
                        const inactiveCount = monthData?.inactiveProcesses || 0;
                        const total = activeCount + inactiveCount;
                        
                        const pieSize = isMobile ? 100 : isTablet ? 120 : 140;
                        
                        // Si no hay datos, mostrar gráfico vacío en gris
                        if (total === 0) {
                          return (
                            <SimplePieChart
                              data={[{ name: 'Sin datos', value: 1, color: '#d1d5db' }]}
                              width={pieSize}
                              height={pieSize}
                            />
                          );
                        }
                        
                        return (
                          <SimplePieChart
                            data={[
                              { name: 'Activos', value: activeCount, color: '#10b981' },
                              { name: 'Finalizados', value: inactiveCount, color: '#db2777' }
                            ]}
                            width={pieSize}
                            height={pieSize}
                          />
                        );
                      })()}
                    </div>
                    <div className="mt-2 w-full space-y-1">
                      {(() => {
                        const monthNum = parseInt(selectedMonth, 10);
                        const monthData = activeInactiveData?.monthlyMetrics?.find(m => m.month === monthNum);
                        
                        const activeCount = monthData?.activeProcesses || 0;
                        const inactiveCount = monthData?.inactiveProcesses || 0;
                        const total = activeCount + inactiveCount;
                        
                        if (total === 0) {
                          return (
                            <div className="flex items-center justify-center text-xs text-gray-500">
                              No hay datos para este mes
                            </div>
                          );
                        }
                        
                        const activePercentage = Math.round((activeCount / total) * 100);
                        const inactivePercentage = Math.round((inactiveCount / total) * 100);
                        
                        return (
                          <>
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span>Activos</span></div>
                              <span className="font-semibold">{activeCount} - {activePercentage}%</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-pink-600"></div><span>Finalizados</span></div>
                              <span className="font-semibold">{inactiveCount} - {inactivePercentage}%</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Dona inferior: Tipos de proceso (conectada a API) */}
                  <div className="flex flex-col items-center flex-1 lg:flex-none">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 text-center">{['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][parseInt(selectedMonth,10)-1]}</h4>
                    <div className="flex items-center justify-center">
                      {(() => {
                        // Usar datos de la API de lawsuits-hearings filtrados por mes
                        const monthNum = parseInt(selectedMonth, 10);
                        const monthLawsuits = lawsuitsHearingsData?.filedLawsuits?.metric?.find(m => m.month === monthNum);
                        const monthHearings = lawsuitsHearingsData?.scheduledHearings?.metric?.find(m => m.month === monthNum);
                        
                        const lawsuitsCount = monthLawsuits?.count || 0;
                        const hearingsCount = monthHearings?.count || 0;
                        
                        // Simular otros tipos de proceso (pueden venir de otras APIs)
                        const inadmitidoCount = Math.round(lawsuitsCount * 0.1); // 10% de los admitidos
                        const fijaAudienciaCount = Math.round(hearingsCount * 0.75); // 75% de las audiencias
                        const subsanacionCount = Math.round(lawsuitsCount * 0.15); // 15% de los admitidos
                        
                        const total = lawsuitsCount + hearingsCount + inadmitidoCount + fijaAudienciaCount + subsanacionCount;
                        
                        const pieSize = isMobile ? 100 : isTablet ? 120 : 140;
                        
                        // Si no hay datos, mostrar gráfico vacío en gris
                        if (total === 0) {
                          return (
                            <SimplePieChart
                              data={[{ name: 'Sin datos', value: 1, color: '#d1d5db' }]}
                              width={pieSize}
                              height={pieSize}
                            />
                          );
                        }
                        
                        return (
                          <SimplePieChart
                            data={[
                              { name: 'Admitidos', value: lawsuitsCount, color: '#10b981' },
                              { name: 'Contestación de demanda', value: hearingsCount, color: '#3b82f6' },
                              { name: 'Inadmitido', value: inadmitidoCount, color: '#db2777' },
                              { name: 'Fija audiencia', value: fijaAudienciaCount, color: '#f59e0b' },
                              { name: 'Subsanación', value: subsanacionCount, color: '#ef4444' }
                            ].filter(item => item.value > 0)} // Solo mostrar categorías con datos
                            width={pieSize}
                            height={pieSize}
                          />
                        );
                      })()}
                    </div>
                    <div className="mt-2 w-full space-y-1">
                      {(() => {
                        const monthNum = parseInt(selectedMonth, 10);
                        const monthLawsuits = lawsuitsHearingsData?.filedLawsuits?.metric?.find(m => m.month === monthNum);
                        const monthHearings = lawsuitsHearingsData?.scheduledHearings?.metric?.find(m => m.month === monthNum);
                        
                        const lawsuitsCount = monthLawsuits?.count || 0;
                        const hearingsCount = monthHearings?.count || 0;
                        const inadmitidoCount = Math.round(lawsuitsCount * 0.1);
                        const fijaAudienciaCount = Math.round(hearingsCount * 0.75);
                        const subsanacionCount = Math.round(lawsuitsCount * 0.15);
                        
                        const total = lawsuitsCount + hearingsCount + inadmitidoCount + fijaAudienciaCount + subsanacionCount;
                        
                        if (total === 0) {
                          return (
                            <div className="flex items-center justify-center text-xs text-gray-500">
                              No hay datos para este mes
                            </div>
                          );
                        }
                        
                        const data = [
                          { name: 'Admitidos', value: lawsuitsCount, color: '#10b981' },
                          { name: 'Contestación', value: hearingsCount, color: '#3b82f6' },
                          { name: 'Inadmitido', value: inadmitidoCount, color: '#db2777' },
                          { name: 'Fija audiencia', value: fijaAudienciaCount, color: '#f59e0b' },
                          { name: 'Subsanación', value: subsanacionCount, color: '#ef4444' }
                        ].filter(item => item.value > 0);
                        
                        return data.map((item, idx) => {
                          const percentage = Math.round((item.value / total) * 100);
                          return (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <span className="truncate">{item.name}</span>
                              </div>
                              <span className="font-semibold">{item.value} - {percentage}%</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Distribución Geográfica */}
        <TabsContent value="geografica" className="space-y-4 sm:space-y-6">
          {/* Tabla de datos geográficos */}
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-sm sm:text-base md:text-lg">Distribución Geográfica de Casos</CardTitle>
              <CardDescription className="text-xs">Análisis detallado por departamento y ciudad</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="overflow-x-auto">
                <div className="space-y-2 sm:space-y-3">
                  {/* Header - Responsive */}
                  <div className="hidden lg:grid grid-cols-8 gap-2 sm:gap-3 p-2 sm:p-4 bg-gray-50 rounded-lg font-bold text-gray-800 text-xs">
                    <div className="max-w-[120px] overflow-hidden">DEPARTAMENTO</div>
                    <div className="max-w-[100px] overflow-hidden">CIUDAD</div>
                    <div className="text-center max-w-[70px] text-xs leading-tight">ACTIVOS</div>
                    <div className="text-center max-w-[70px] text-xs leading-tight">FINALIZADOS</div>
                    <div className="text-center max-w-[70px] text-xs leading-tight">RAPIDEZ MEDIA DE FIJACIÓN DE AUDIENCIA (DÍAS)</div>
                    <div className="text-center max-w-[70px] text-xs leading-tight">RAPIDEZ MEDIA DE CELEBRACIÓN DE AUDIENCIA (DÍAS)</div>
                    <div className="text-center max-w-[70px] text-xs leading-tight">TOTAL</div>
                    <div className="text-center max-w-[70px] text-xs leading-tight">%</div>
                  </div>
                  
                  {/* Header para tablets */}
                  <div className="hidden sm:grid lg:hidden grid-cols-6 gap-2 sm:gap-3 p-2 sm:p-4 bg-gray-50 rounded-lg font-bold text-gray-800 text-xs">
                    <div className="max-w-[120px] overflow-hidden">DEPARTAMENTO</div>
                    <div className="max-w-[100px] overflow-hidden">CIUDAD</div>
                    <div className="text-center max-w-[70px] text-xs leading-tight">ACTIVOS</div>
                    <div className="text-center max-w-[70px] text-xs leading-tight">FINALIZADOS</div>
                    <div className="text-center max-w-[70px] text-xs leading-tight">TOTAL</div>
                    <div className="text-center max-w-[70px] text-xs leading-tight">%</div>
                  </div>
                  
                  {/* Header para móviles */}
                  <div className="grid sm:hidden grid-cols-4 gap-2 p-2 bg-gray-50 rounded-lg font-bold text-gray-800 text-xs">
                    <div className="max-w-[80px] overflow-hidden">DEPTO</div>
                    <div className="max-w-[60px] overflow-hidden">CIUDAD</div>
                    <div className="text-center max-w-[50px] text-xs leading-tight">TOTAL</div>
                    <div className="text-center max-w-[40px] text-xs leading-tight">%</div>
                  </div>
                  {/* Data rows */}
                  {loading ? (
                    // Indicador de carga específico - responsive
                    <>
                      {/* Loading para desktop */}
                      <div className="hidden lg:grid grid-cols-8 gap-2 sm:gap-3 p-2 sm:p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)' }}>
                        <div className="animate-pulse bg-white/20 h-3 sm:h-4 rounded"></div>
                        <div className="animate-pulse bg-white/20 h-3 sm:h-4 rounded"></div>
                        <div className="animate-pulse bg-white/20 h-3 sm:h-4 rounded"></div>
                        <div className="animate-pulse bg-white/20 h-3 sm:h-4 rounded"></div>
                        <div className="animate-pulse bg-white/20 h-3 sm:h-4 rounded"></div>
                        <div className="animate-pulse bg-white/20 h-3 sm:h-4 rounded"></div>
                        <div className="animate-pulse bg-white/20 h-3 sm:h-4 rounded"></div>
                        <div className="animate-pulse bg-white/20 h-3 sm:h-4 rounded"></div>
                      </div>
                      
                      {/* Loading para tablet */}
                      <div className="hidden sm:grid lg:hidden grid-cols-6 gap-2 sm:gap-3 p-2 sm:p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)' }}>
                        <div className="animate-pulse bg-white/20 h-3 sm:h-4 rounded"></div>
                        <div className="animate-pulse bg-white/20 h-3 sm:h-4 rounded"></div>
                        <div className="animate-pulse bg-white/20 h-3 sm:h-4 rounded"></div>
                        <div className="animate-pulse bg-white/20 h-3 sm:h-4 rounded"></div>
                        <div className="animate-pulse bg-white/20 h-3 sm:h-4 rounded"></div>
                        <div className="animate-pulse bg-white/20 h-3 sm:h-4 rounded"></div>
                      </div>
                      
                      {/* Loading para móvil */}
                      <div className="grid sm:hidden grid-cols-4 gap-2 p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)' }}>
                        <div className="animate-pulse bg-white/20 h-3 rounded"></div>
                        <div className="animate-pulse bg-white/20 h-3 rounded"></div>
                        <div className="animate-pulse bg-white/20 h-3 rounded"></div>
                        <div className="animate-pulse bg-white/20 h-3 rounded"></div>
                      </div>
                    </>
                  ) : (getGeographicTableData().length > 0) ? (
                    // Datos reales de la API de porcentaje por departamento y ciudad - responsive
                    getGeographicTableData().map((row, index) => (
                      <div key={`api-perc-${index}`}>
                        {/* Fila para desktop */}
                        <div
                          className="hidden lg:grid grid-cols-8 gap-2 sm:gap-3 p-2 sm:p-4 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                          style={{
                            background: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)',
                            color: 'white'
                          }}
                          onMouseEnter={() => setHoveredRegionSimple({ name: `${row.departamento} - ${row.ciudad}`, x: 0, y: 0, cases: row.numeroCasos, percentage: row.porcentaje })}
                          onMouseLeave={handleMapMouseLeave}
                          onClick={() => setSelectedMapData({ region: `${row.departamento} - ${row.ciudad}`, activos: row.casosActivos, finalizados: row.casosFinalizados, total: row.numeroCasos, rapidez: row.porcentaje + '%' })}
                        >
                          <div className="text-white font-semibold truncate max-w-[120px] text-xs" title={row.departamento || ''}>{row.departamento || 'N/A'}</div>
                          <div className="text-white font-medium truncate max-w-[100px] text-xs" title={row.ciudad || ''}>{row.ciudad || 'N/A'}</div>
                          <div className="text-center text-white font-bold text-xs">{row.casosActivos || 0}</div>
                          <div className="text-center text-white font-bold text-xs">{row.casosFinalizados || 0}</div>
                          <div className="text-center text-white font-bold text-xs">{row.rapidezFijacion !== null && row.rapidezFijacion !== undefined && typeof row.rapidezFijacion === 'number' ? `${(row.rapidezFijacion as number).toFixed(1)} días` : '-'}</div>
                          <div className="text-center text-white font-bold text-xs">{row.rapidezCelebracion !== null && row.rapidezCelebracion !== undefined && typeof row.rapidezCelebracion === 'number' ? `${(row.rapidezCelebracion as number).toFixed(1)} días` : '-'}</div>
                          <div className="text-center text-white font-bold text-xs">{row.numeroCasos || 0}</div>
                          <div className="text-center text-white font-bold text-xs">{row.porcentaje ? `${row.porcentaje}%` : '0%'}</div>
                        </div>
                        
                        {/* Fila para tablet */}
                        <div
                          className="hidden sm:grid lg:hidden grid-cols-6 gap-2 sm:gap-3 p-2 sm:p-4 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                          style={{
                            background: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)',
                            color: 'white'
                          }}
                          onMouseEnter={() => setHoveredRegionSimple({ name: `${row.departamento} - ${row.ciudad}`, x: 0, y: 0, cases: row.numeroCasos, percentage: row.porcentaje })}
                          onMouseLeave={handleMapMouseLeave}
                          onClick={() => setSelectedMapData({ region: `${row.departamento} - ${row.ciudad}`, activos: row.casosActivos, finalizados: row.casosFinalizados, total: row.numeroCasos, rapidez: row.porcentaje + '%' })}
                        >
                          <div className="text-white font-semibold truncate max-w-[120px] text-xs" title={row.departamento || ''}>{row.departamento || 'N/A'}</div>
                          <div className="text-white font-medium truncate max-w-[100px] text-xs" title={row.ciudad || ''}>{row.ciudad || 'N/A'}</div>
                          <div className="text-center text-white font-bold text-xs">{row.casosActivos || 0}</div>
                          <div className="text-center text-white font-bold text-xs">{row.casosFinalizados || 0}</div>
                          <div className="text-center text-white font-bold text-xs">{row.numeroCasos || 0}</div>
                          <div className="text-center text-white font-bold text-xs">{row.porcentaje ? `${row.porcentaje}%` : '0%'}</div>
                        </div>
                        
                        {/* Fila para móvil */}
                        <div
                          className="grid sm:hidden grid-cols-4 gap-2 p-2 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                          style={{
                            background: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)',
                            color: 'white'
                          }}
                          onMouseEnter={() => setHoveredRegionSimple({ name: `${row.departamento} - ${row.ciudad}`, x: 0, y: 0, cases: row.numeroCasos, percentage: row.porcentaje })}
                          onMouseLeave={handleMapMouseLeave}
                          onClick={() => setSelectedMapData({ region: `${row.departamento} - ${row.ciudad}`, activos: row.casosActivos, finalizados: row.casosFinalizados, total: row.numeroCasos, rapidez: row.porcentaje + '%' })}
                        >
                          <div className="text-white font-semibold truncate max-w-[80px] text-xs" title={row.departamento || ''}>{(row.departamento || 'N/A').substring(0, 8)}</div>
                          <div className="text-white font-medium truncate max-w-[60px] text-xs" title={row.ciudad || ''}>{(row.ciudad || 'N/A').substring(0, 6)}</div>
                          <div className="text-center text-white font-bold text-xs">{row.numeroCasos || 0}</div>
                          <div className="text-center text-white font-bold text-xs">{row.porcentaje ? `${row.porcentaje}%` : '0%'}</div>
                        </div>
                      </div>
                    ))
                  ) : 
                    // Fallback con datos mock - responsive
                    geographicTableData.map((row, index) => (
                      <div key={`mock-${index}`}>
                        {/* Fila para desktop */}
                        <div 
                          className="hidden lg:grid grid-cols-8 gap-2 sm:gap-3 p-2 sm:p-4 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                          style={{
                            background: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)',
                            color: 'white'
                          }}
                        >
                          <div className="text-white font-semibold truncate max-w-[120px] text-xs" title={row.departamento}>{row.departamento}</div>
                          <div className="text-white font-medium truncate max-w-[100px] text-xs" title={row.ciudad}>{row.ciudad}</div>
                          <div className="text-center text-white font-bold text-xs">{row.casosActivos} {row.casosActivosPercentage && <span className="text-white/80 text-xs">({row.casosActivosPercentage})</span>}</div>
                          <div className="text-center text-white font-bold text-xs">{row.casosFinalizados}</div>
                          <div className="text-center text-white font-bold text-xs">{row.rapidezFijacion !== null && row.rapidezFijacion !== undefined ? `${row.rapidezFijacion} días` : '-'}</div>
                          <div className="text-center text-white font-bold text-xs">{row.rapidezCelebracion !== null && row.rapidezCelebracion !== undefined ? `${row.rapidezCelebracion} días` : '-'}</div>
                          <div className="text-center text-white font-bold text-xs">{row.numeroCasos}</div>
                          <div className="text-center text-white font-bold text-xs">{typeof row.porcentaje === 'number' ? `${row.porcentaje}%` : '0%'}</div>
                        </div>
                        
                        {/* Fila para tablet */}
                        <div 
                          className="hidden sm:grid lg:hidden grid-cols-6 gap-2 sm:gap-3 p-2 sm:p-4 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                          style={{
                            background: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)',
                            color: 'white'
                          }}
                        >
                          <div className="text-white font-semibold truncate max-w-[120px] text-xs" title={row.departamento}>{row.departamento}</div>
                          <div className="text-white font-medium truncate max-w-[100px] text-xs" title={row.ciudad}>{row.ciudad}</div>
                          <div className="text-center text-white font-bold text-xs">{row.casosActivos}</div>
                          <div className="text-center text-white font-bold text-xs">{row.casosFinalizados}</div>
                          <div className="text-center text-white font-bold text-xs">{row.numeroCasos}</div>
                          <div className="text-center text-white font-bold text-xs">{typeof row.porcentaje === 'number' ? `${row.porcentaje}%` : '0%'}</div>
                        </div>
                        
                        {/* Fila para móvil */}
                        <div 
                          className="grid sm:hidden grid-cols-4 gap-2 p-2 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                          style={{
                            background: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)',
                            color: 'white'
                          }}
                        >
                          <div className="text-white font-semibold truncate max-w-[80px] text-xs" title={row.departamento}>{row.departamento.substring(0, 8)}</div>
                          <div className="text-white font-medium truncate max-w-[60px] text-xs" title={row.ciudad}>{row.ciudad.substring(0, 6)}</div>
                          <div className="text-center text-white font-bold text-xs">{row.numeroCasos}</div>
                          <div className="text-center text-white font-bold text-xs">{typeof row.porcentaje === 'number' ? `${row.porcentaje}%` : '0%'}</div>
                        </div>
                      </div>
                    ))
                     }               </div>
              </div>
            </CardContent>
          </Card>

          {/* Mapa de Colombia con leyenda - Responsive */}
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2 order-2 lg:order-1">
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-sm sm:text-base md:text-lg">Mapa Interactivo de Colombia</CardTitle>
                  <CardDescription className="text-xs">Toque una región para ver detalles</CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="w-full h-64 sm:h-80 md:h-96 lg:h-[400px] bg-gray rounded-lg flex items-center justify-center relative overflow-hidden">
                    <div ref={svgRef as any} style={{ width: '100%', maxWidth: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="mx-auto">
                      {/* Cargaremos el SVG desde public/Mapa.svg y lo insertaremos aquí en runtime. */}
                      <SvgMap
                        percentageByDepartmentData={percentageByDepartmentData}
                        getColorForCount={getColorForCount}
                        setSvgTooltip={setSvgTooltip}
                        setComputedMarkers={setComputedMarkers}
                      />
                    </div>
                    {/* Tooltip SVG - Responsive */}
                    {svgTooltip && (
                      <div
                        className="absolute z-50 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-2 sm:p-3 pointer-events-none"
                        style={{
                          left: svgTooltip.mouseX,
                          top: svgTooltip.mouseY - (isMobile ? 50 : 60),
                          transform: 'translate(-50%, 0)',
                          minWidth: isMobile ? '100px' : '120px',
                          maxWidth: isMobile ? '160px' : '200px'
                        }}
                      >
                        <div className="font-bold text-xs text-gray-800 mb-1">{svgTooltip.department}</div>
                        <div className="flex items-center gap-1 sm:gap-2 mb-1">
                          <span className="text-pink-600 font-bold text-xs">{svgTooltip.cases}</span>
                          <span className="text-xs text-gray-500">casos</span>
                        </div>
                        <div className="text-xs text-blue-600">{svgTooltip.percentage}% del total</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Leyenda y estadísticas - Responsive */}
            <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
              {/* Leyenda en móvil se muestra como fila horizontal */}
              <Card className="lg:block">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-sm sm:text-base">Leyenda del Mapa</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 sm:gap-4 lg:gap-3">
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 bg-red-500 rounded-lg flex-shrink-0"></div>
                      <div className="min-w-0">
                        <div className="font-medium text-xs truncate">Alto volumen</div>
                        <div className="text-xs text-gray-600">200+ casos</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 bg-yellow-500 rounded-lg flex-shrink-0"></div>
                      <div className="min-w-0">
                        <div className="font-medium text-xs truncate">Volumen medio</div>
                        <div className="text-xs text-gray-600">100-199 casos</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 bg-green-500 rounded-lg flex-shrink-0"></div>
                      <div className="min-w-0">
                        <div className="font-medium text-xs truncate">Bajo volumen</div>
                        <div className="text-xs text-gray-600">0-99 casos</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resumen Nacional - Responsive */}
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-sm sm:text-base">Resumen Nacional</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3 sm:gap-4">
                    <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-3 sm:p-4 rounded-lg text-white">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold">
                        {(() => {
                          const tableData = getGeographicTableData();
                          return tableData.length > 0 
                            ? tableData.reduce((sum, item) => sum + (item.casosActivos || 0), 0)
                            : geographicTableData.reduce((sum, item) => sum + item.casosActivos, 0);
                        })()}
                      </div>
                      <div className="text-pink-100 text-xs">Total Casos Activos</div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-3 sm:p-4 rounded-lg text-white">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold">
                        {(() => {
                          const tableData = getGeographicTableData();
                          return tableData.length > 0 
                            ? tableData.reduce((sum, item) => sum + (item.casosFinalizados || 0), 0)
                            : geographicTableData.reduce((sum, item) => sum + item.casosFinalizados, 0);
                        })()}
                      </div>
                      <div className="text-blue-100 text-xs">Total Casos Finalizados</div>
                    </div>
                    <div className="bg-gradient-to-r from-gray-600 to-gray-800 p-3 sm:p-4 rounded-lg text-white">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold">
                        {(() => {
                          const tableData = getGeographicTableData();
                          return tableData.length > 0 
                            ? tableData.reduce((sum, item) => sum + (item.numeroCasos || 0), 0)
                            : geographicTableData.reduce((sum, item) => sum + item.numeroCasos, 0);
                        })()}
                      </div>
                      <div className="text-gray-100 text-xs">Total General</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* 4. Documentación */}
        <TabsContent value="documentacion" className="space-y-4 sm:space-y-6">
          {/* 1. Tabla de documentos */}
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                Tipos de Documentos
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Distribución detallada por tipo y subdocumento
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {/* Headers de tabla */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 py-2 sm:py-3 px-2 sm:px-4 bg-gray-50 rounded-lg font-semibold text-gray-700 text-xs sm:text-sm">
                  <div className="max-w-[120px] sm:max-w-[160px] overflow-hidden">TIPO DE DOCUMENTO</div>
                  <div className="max-w-[100px] sm:max-w-[140px] overflow-hidden">SUBDOCUMENTO</div>
                  <div className="text-right">NÚMERO</div>
                </div>
                
                {/* Filas de datos */}
                <div className="space-y-2 sm:space-y-3">
                  {documentationData?.statistics?.map((item, index) => (
                    <div key={index} className="grid grid-cols-3 gap-2 sm:gap-4 py-2 sm:py-4 px-2 sm:px-4 bg-pink-500 text-white rounded-lg font-medium text-xs sm:text-sm">
                      <div className="truncate max-w-[120px] sm:max-w-[160px]" title={item.document}>{item.document}</div>
                      <div className="truncate max-w-[100px] sm:max-w-[140px]" title={item.subdocument}>{item.subdocument}</div>
                      <div className="text-right">{item.count}</div>
                    </div>
                  )) || (
                    // Fallback con datos mock mientras se cargan los datos reales
                    documentTableData.map((item, index) => (
                      <div key={index} className="grid grid-cols-3 gap-2 sm:gap-4 py-2 sm:py-4 px-2 sm:px-4 bg-pink-500 text-white rounded-lg font-medium text-xs sm:text-sm">
                        <div className="truncate max-w-[120px] sm:max-w-[160px]" title={item.tipoDocumento}>{item.tipoDocumento}</div>
                        <div className="truncate max-w-[100px] sm:max-w-[140px]" title={item.subdocumento}>{item.subdocumento}</div>
                        <div className="text-right">{item.numero}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Gráfica de pastel con filtros */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Documentos
                </CardTitle>
                <CardDescription>Distribución por tipo de documento</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Filtrar:</span>
                  <Select value={docSelectedYear.toString()} onValueChange={(value) => {
                    const year = parseInt(value);
                    setDocSelectedYear(year);
                    // Actualizar datos de documentación mensual con nuevos filtros
                    getDocumentationMonthly({ 
                      year, 
                      month: parseInt(docSelectedMonth), 
                      type: "ACTIVO" 
                    });
                  }}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2023, 2024, 2025, 2026].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          Año: {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={
                    ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                     "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][parseInt(docSelectedMonth) - 1]
                  } onValueChange={(month) => {
                    const monthNumber = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"][
                      ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                       "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].indexOf(month)
                    ];
                    setDocSelectedMonth(monthNumber);
                    // Actualizar datos de documentación mensual con nuevos filtros
                    getDocumentationMonthly({ 
                      year: docSelectedYear, 
                      month: parseInt(monthNumber), 
                      type: "ACTIVO" 
                    });
                  }}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((month) => (
                        <SelectItem key={month} value={month}>
                          Mes: {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:grid lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 min-h-[250px] sm:min-h-[300px] lg:h-100">
                {/* Gráfica de pastel - Responsive */}
                <div className="flex justify-center items-center order-2 lg:order-1">
                  <SimplePieChart
                    data={getDocumentationPieData()}
                    width={isMobile ? 200 : isTablet ? 250 : 300}
                    height={isMobile ? 200 : isTablet ? 250 : 300}
                  />
                </div>
                
                {/* Leyenda - Responsive y compacta */}
                <div className="flex flex-col justify-center space-y-1 sm:space-y-2 lg:space-y-3 order-1 lg:order-2">
                  {getDocumentationPieData().map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div 
                          className="w-3 h-3 rounded-sm flex-shrink-0" 
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="font-medium text-gray-700 text-xs sm:text-sm lg:text-base truncate">{item.name}</span>
                      </div>
                      <div className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900 ml-2">{item.value}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Gráfica de líneas - Demandas por usuario vs tiempo */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="flex items-center gap-3">
                  Documentos por usuario vs tiempo
                
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Select value={docLineSelectedYear.toString()} onValueChange={(value) => {
                  const year = parseInt(value);
                  setDocLineSelectedYear(year);
                  // updateFiledLawsuitsData(year); // pendiente: implementar función de actualización
                }}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2023, 2024, 2025, 2026].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80 sm:h-88 lg:h-96 overflow-x-auto">
                {/* Leyenda dinámica de usuarios - Responsive */}
                {(() => {
                  const { dataByMonth, users } = getFiledLawsuitsChartData();
                  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#db2777', '#8b5cf6', '#06b6d4'];
                  // Calcular totales anuales por usuario
                  const userTotals = users.map((user) => {
                    const total = dataByMonth.reduce((sum, item) => sum + ((item as Record<string, number | string>)[user] as number || 0), 0);
                    return { user, total };
                  });
                  return (
                    <div
                      className="mb-4 flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pb-2"
                      style={{ WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}
                    >
                      {userTotals.map(({ user, total }, idx) => (
                        <div
                          key={user}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-gray-50 border border-gray-200 min-w-max text-xs sm:text-sm"
                        >
                          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full mr-1" style={{ backgroundColor: colors[idx % colors.length] }}></div>
                          <span className="font-semibold text-sm sm:text-base" style={{ color: colors[idx % colors.length] }}>{total}</span>
                          <span className="text-xs text-gray-600 ml-1 whitespace-nowrap">{user}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                
                {(() => {
                  const { dataByMonth, users } = getFiledLawsuitsChartData();
                  // Paleta de colores
                  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#db2777', '#8b5cf6', '#06b6d4'];
                  return (
                    <SimpleMultiLineChart
                      series={users.map((user, idx) => ({
                        name: user,
                        data: dataByMonth.map((item: Record<string, any>) => ({ name: item.name, value: item[user] || 0 })),
                        color: colors[idx % colors.length]
                      }))}
                      width={isMobile ? 600 : isTablet ? 750 : 900}
                      height={isMobile ? 280 : isTablet ? 300 : 320}
                    />
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
