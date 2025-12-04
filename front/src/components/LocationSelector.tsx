'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useLocationData } from '@/hooks/useLocationData';

interface LocationSelectorProps {
  selectedDepartment: string;
  selectedCity: string;
  selectedDespacho: string;
  onDepartmentChange: (department: string) => void;
  onCityChange: (city: string) => void;
  onDespachoChange: (despacho: string) => void;
  disabled?: boolean;
  showDespacho?: boolean;
}

export function LocationSelector({
  selectedDepartment,
  selectedCity,
  selectedDespacho,
  onDepartmentChange,
  onCityChange,
  onDespachoChange,
  disabled = false,
  showDespacho = true
}: LocationSelectorProps) {
  const { departments, allCities, despachoJudicialData, loading, error } = useLocationData();
  const [availableCities, setAvailableCities] = useState<any[]>([]);
  const [availableDespachos, setAvailableDespachos] = useState<string[]>([]);

  // Normalizar nombres de ciudades
  const normalizeCityName = (cityName: string): string => {
    const cityMap: { [key: string]: string } = {
      'Medellin': 'Medellín',
      'Bogota': 'Bogotá',
      'Barranquilla': 'Barranquilla',
      'Cali': 'Cali',
      'Cartagena': 'Cartagena',
      'Bucaramanga': 'Bucaramanga',
      'Pereira': 'Pereira',
      'Santa Marta': 'Santa Marta',
      'Ibagué': 'Ibagué',
      'Pasto': 'Pasto',
      'Manizales': 'Manizales',
      'Neiva': 'Neiva',
      'Villavicencio': 'Villavicencio',
      'Armenia': 'Armenia',
      'Valledupar': 'Valledupar',
      'Montería': 'Montería',
      'Sincelejo': 'Sincelejo',
      'Popayán': 'Popayán',
      'Tunja': 'Tunja',
      'Florencia': 'Florencia',
      'Riohacha': 'Riohacha',
      'Quibdó': 'Quibdó',
      'Arauca': 'Arauca',
      'Yopal': 'Yopal',
      'Mocoa': 'Mocoa',
      'San José del Guaviare': 'San José del Guaviare',
      'Leticia': 'Leticia',
      'Inírida': 'Inírida',
      'Puerto Carreño': 'Puerto Carreño',
      'Mitú': 'Mitú',
      'Girardot': 'Girardot',
      'Itagui': 'Itagüí'
    };
    return cityMap[cityName] || cityName;
  };

  // Actualizar ciudades disponibles cuando cambie el departamento
  useEffect(() => {
    if (selectedDepartment && departments.length > 0) {
      const selectedDept = departments.find(dept => dept.nombre === selectedDepartment);
      if (selectedDept) {
        setAvailableCities(selectedDept.municipios);
        // Limpiar ciudad si no pertenece al nuevo departamento
        const cityNames = selectedDept.municipios.map((municipio: any) => municipio.nombre);
        const normalizedCityNames = cityNames.map((name: string) => normalizeCityName(name));
        if (selectedCity && !normalizedCityNames.some((cityName: string) => 
          normalizeCityName(cityName) === normalizeCityName(selectedCity))) {
          onCityChange('');
          onDespachoChange('');
        }
      }
    } else {
      setAvailableCities([]);
    }
  }, [selectedDepartment, departments, selectedCity, onCityChange, onDespachoChange]);

  // Actualizar despachos disponibles cuando cambie la ciudad
  useEffect(() => {
    if (selectedCity && despachoJudicialData && Object.keys(despachoJudicialData).length > 0) {
      const normalizedCity = normalizeCityName(selectedCity);
      const despachosForCity = despachoJudicialData[normalizedCity] || [];
      setAvailableDespachos(despachosForCity);
      
      // Si el despacho actual no está en la lista, limpiarlo
      if (selectedDespacho && !despachosForCity.includes(selectedDespacho)) {
        onDespachoChange('');
      }
    } else {
      setAvailableDespachos([]);
    }
  }, [selectedCity, despachoJudicialData, selectedDespacho, onDespachoChange]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Departamento</Label>
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <Label>Ciudad</Label>
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
        </div>
        {showDespacho && (
          <div className="space-y-2">
            <Label>Despacho Judicial</Label>
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-red-600 text-sm">
          Error al cargar datos de ubicación: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Departamento */}
      <div className="space-y-2">
        <Label htmlFor="department">Departamento *</Label>
        <Select
          value={selectedDepartment}
          onValueChange={onDepartmentChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccione un departamento" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((dept) => (
              <SelectItem key={dept.codigo} value={dept.nombre}>
                {dept.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ciudad */}
      <div className="space-y-2">
        <Label htmlFor="city">Ciudad *</Label>
        <Select
          value={selectedCity}
          onValueChange={onCityChange}
          disabled={disabled || !selectedDepartment}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccione una ciudad" />
          </SelectTrigger>
          <SelectContent>
            {availableCities.map((city) => (
              <SelectItem key={city.codigo} value={city.nombre}>
                {city.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Despacho Judicial */}
      {showDespacho && (
        <div className="space-y-2">
          <Label htmlFor="despachoJudicial">Despacho Judicial *</Label>
          <Select
            value={selectedDespacho}
            onValueChange={onDespachoChange}
            disabled={disabled || !selectedCity}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione un despacho" />
            </SelectTrigger>
            <SelectContent>
              {availableDespachos.map((despacho) => (
                <SelectItem key={despacho} value={despacho}>
                  {despacho}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
