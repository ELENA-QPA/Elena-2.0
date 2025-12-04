"use client";

import { useRef, useEffect, useMemo } from 'react';

interface SvgMapProps {
  percentageByDepartmentData: any;
  getColorForCount: (count: number) => string;
  setSvgTooltip: (tooltip: any) => void;
  setComputedMarkers: (markers: any[]) => void;
}

export function SvgMap({ percentageByDepartmentData, getColorForCount, setSvgTooltip, setComputedMarkers }: SvgMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgLoadedRef = useRef(false);

  // Mapear nombres de departamentos de la API a identificadores únicos
  const depMap: Record<string, string> = useMemo(() => ({
    'BOGOTÁ D.C.': 'bogota',
    'BOGOTÁ, D.C.': 'bogota',
    'ANTIOQUIA': 'antioquia',
    'ATLÁNTICO': 'atlantico', 
    'VALLE DEL CAUCA': 'valledelcauca',
    'SANTANDER': 'santander'
  }), []);

  // Crear mapeo heurístico para paths sin id
  const heuristics: Record<string, string[]> = useMemo(() => ({
    bogota: ['318.361 291.451', 'M318.361 291.451C317.79'],
    antioquia: ['303.596 163.182', 'M150.949 28.1764C149.221'],
    atlantico: ['79.4696 185.706', 'M182.557 24.7864L188.479'],
    valledelcauca: ['261.01 355.523', 'M240.284 283.728H240.294'],
    santander: ['M165.264 41.3634 165.542', 'M171.24 31.3554 171.563']
  }), []);

  // Cargar SVG solo una vez
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (svgLoadedRef.current || !containerRef.current) return;
      try {
        const res = await fetch('/Mapa.svg');
        const text = await res.text();
        if (!mounted) return;
        containerRef.current.innerHTML = text;
        svgLoadedRef.current = true;
      } catch (err) {
        console.error('Error loading SVG map', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Procesar datos cuando cambien
  useEffect(() => {
  if (!svgLoadedRef.current || !containerRef.current) return;
    
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    // Limpiar marcadores previos
    const prevGroup = svg.querySelector('g[data-generated-markers]');
    if (prevGroup) prevGroup.remove();

    // Crear datos solo para departamentos válidos
    const validDepartments = (percentageByDepartmentData?.departamentos || [])
      .filter((dep: any) => dep.department && dep.department !== 'SIN_DEPARTAMENTO' && dep.department !== 'string')
      .reduce((acc: any, dep: any) => {
        const key = dep.department.toUpperCase();
        const id = depMap[key];
        if (id) {
          acc[id] = {
            color: getColorForCount(dep.total || 0),
            department: dep.department,
            total: dep.total || 0,
            porcentaje: dep.porcentaje || 0
          };
        }
        return acc;
      }, {} as Record<string, any>);

    // Procesar todos los paths
    const paths = Array.from(svg.querySelectorAll('path')) as SVGPathElement[];
    const markers: any[] = [];

    paths.forEach((p, idx) => {
      // Limpiar estilos y eventos previos
      const clonedPath = p.cloneNode(true) as SVGPathElement;
      p.parentNode?.replaceChild(clonedPath, p);
      
      clonedPath.setAttribute('data-path-index', String(idx));
      clonedPath.style.fill = '#f3f4f6'; // Color por defecto (gris claro)
      clonedPath.style.transition = 'fill 200ms ease';

      const id = clonedPath.getAttribute('id') || '';
      let depKey = '';
      let departmentData: any = null;

      // Buscar por id directo
      if (id && validDepartments[id]) {
        depKey = id;
        departmentData = validDepartments[id];
      } else {
        // Buscar por heurística
        const d = clonedPath.getAttribute('d') || '';
        Object.entries(heuristics).forEach(([hid, tokens]) => {
          if (!depKey && tokens.some(t => d.includes(t)) && validDepartments[hid]) {
            depKey = hid;
            departmentData = validDepartments[hid];
            clonedPath.setAttribute('data-dep-id', hid);
          }
        });
      }

      // Solo hacer interactivo si tiene datos válidos
      if (departmentData) {
        clonedPath.style.fill = departmentData.color;
        clonedPath.style.cursor = 'pointer';

        // Añadir eventos
        const mouseMoveHandler = (ev: MouseEvent) => {
          const svgRect = svg.getBoundingClientRect();
          const relX = ev.clientX - svgRect.left;
          const relY = ev.clientY - svgRect.top;
          setSvgTooltip({ 
            department: departmentData.department, 
            cases: departmentData.total, 
            percentage: departmentData.porcentaje, 
            mouseX: relX, 
            mouseY: relY 
          });
        };

        const mouseLeaveHandler = () => setSvgTooltip(null);

        clonedPath.addEventListener('mousemove', mouseMoveHandler);
        clonedPath.addEventListener('mouseleave', mouseLeaveHandler);

        // Calcular posición para marcador
        try {
          const bbox = clonedPath.getBBox();
          if (bbox.width > 0 && bbox.height > 0) {
            const cx = bbox.x + bbox.width / 2;
            const cy = bbox.y + bbox.height / 2;
            markers.push({ 
              department: departmentData.department, 
              x: cx, 
              y: cy, 
              cases: departmentData.total, 
              percentage: departmentData.porcentaje, 
              idx 
            });
          }
        } catch (e) {
          // getBBox puede fallar, ignorar
        }
      }
    });

    // Crear marcadores como círculos dentro del SVG
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
      c.style.cursor = 'pointer';
      
      const circleMouseMoveHandler = (ev: MouseEvent) => {
        const svgRect = svg.getBoundingClientRect();
        const relX = ev.clientX - svgRect.left;
        const relY = ev.clientY - svgRect.top;
        setSvgTooltip({ 
          department: m.department, 
          cases: m.cases, 
          percentage: m.percentage, 
          mouseX: relX, 
          mouseY: relY 
        });
      };
      
      const circleMouseLeaveHandler = () => setSvgTooltip(null);
      
      c.addEventListener('mousemove', circleMouseMoveHandler);
      c.addEventListener('mouseleave', circleMouseLeaveHandler);
      
      markerGroup.appendChild(c);
    });
    
    svg.appendChild(markerGroup);
    setComputedMarkers(markers);

  }, [percentageByDepartmentData, getColorForCount, setSvgTooltip, setComputedMarkers, depMap, heuristics]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}