import { useState, useEffect } from 'react';

interface Department {
  codigo: string;
  abreviatura: string;
  nombre: string;
  municipios: Array<{
    codigo: string;
    nombre: string;
  }>;
}

interface City {
  codigo: string;
  nombre: string;
  departamento: string;
}

interface DespachoData {
  [key: string]: string[];
}

interface LocationData {
  departments: Department[];
  allCities: City[];
  despachoJudicialData: DespachoData;
  loading: boolean;
  error: string | null;
}

export function useLocationData(): LocationData {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allCities, setAllCities] = useState<City[]>([]);
  const [despachoJudicialData, setDespachoJudicialData] = useState<DespachoData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Verificar caché para divipola
        const cachedDepartments = sessionStorage.getItem('divipola_departments');
        const cachedCities = sessionStorage.getItem('divipola_cities');
        const cachedDespachos = sessionStorage.getItem('despacho_judicial_data');

        if (cachedDepartments && cachedCities && cachedDespachos) {
          console.log('📊 [LOCATION_DATA] Usando datos en caché');
          setDepartments(JSON.parse(cachedDepartments));
          setAllCities(JSON.parse(cachedCities));
          setDespachoJudicialData(JSON.parse(cachedDespachos));
          setLoading(false);
          return;
        }

        // Cargar datos de divipola
        console.log('📊 [LOCATION_DATA] Cargando datos de divipola...');
        const divipolaResponse = await fetch('/divipola.json');
        if (!divipolaResponse.ok) {
          throw new Error('Error al cargar datos de divipola');
        }
        const divipolaData = await divipolaResponse.json();

        // Cargar datos de despacho judicial
        console.log('📋 [LOCATION_DATA] Cargando datos de despacho judicial...');
        const despachoResponse = await fetch('/despacho_judicial.json');
        if (!despachoResponse.ok) {
          throw new Error('Error al cargar datos de despacho judicial');
        }
        const despachoData = await despachoResponse.json();

        // Procesar datos de divipola
        const departmentsData = divipolaData.departamentos || [];
        const allCitiesData = departmentsData.flatMap((dept: Department) =>
          dept.municipios.map((municipio) => ({
            ...municipio,
            departamento: dept.nombre
          }))
        );

        // Actualizar estado
        setDepartments(departmentsData);
        setAllCities(allCitiesData);
        setDespachoJudicialData(despachoData);

        // Guardar en caché
        sessionStorage.setItem('divipola_departments', JSON.stringify(departmentsData));
        sessionStorage.setItem('divipola_cities', JSON.stringify(allCitiesData));
        sessionStorage.setItem('despacho_judicial_data', JSON.stringify(despachoData));

        console.log('✅ [LOCATION_DATA] Datos cargados exitosamente');
        console.log('📊 [LOCATION_DATA] Departamentos:', departmentsData.length);
        console.log('🏙️ [LOCATION_DATA] Ciudades:', allCitiesData.length);

      } catch (err) {
        console.error('❌ [LOCATION_DATA] Error:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return {
    departments,
    allCities,
    despachoJudicialData,
    loading,
    error
  };
}
