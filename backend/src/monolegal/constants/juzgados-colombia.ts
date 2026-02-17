export interface JuzgadoInfo {
  nombre: string;
  tipo: string;
  numero: string;
  ciudad: string;
  departamento?: string;
  esCircuito: boolean;
  esMunicipal: boolean;
}

export const CIUDAD_DEPARTAMENTO: { [key: string]: string } = {
  Armenia: 'Quindío',
  Barranquilla: 'Atlántico',
  Bello: 'Antioquia',
  Bogotá: 'Bogotá D.C.',
  Bucaramanga: 'Santander',
  Cali: 'Valle del Cauca',
  Cartagena: 'Bolívar', 
  Cúcuta: 'Norte de Santander',
  Envigado: 'Antioquia',
  Girardot: 'Cundinamarca',
  Itagüí: 'Antioquia',
  Medellín: 'Antioquia',
  Montería: 'Córdoba',
  Neiva: 'Huila',
  'Santa Marta': 'Magdalena',
  Villavicencio: 'Meta',
  Chocontá: 'Cundinamarca',
};

export function generarJuzgadosValidos(): Set<string> {
  const juzgados = new Set<string>();

  // Juzgados Laborales del Circuito
  const laboralesCircuito = [
    { ciudad: 'Armenia', max: 4 },
    { ciudad: 'Barranquilla', max: 16 },
    { ciudad: 'Bello', max: 2 },
    { ciudad: 'Bogotá', max: 52 },
    { ciudad: 'Bucaramanga', max: 7 },
    { ciudad: 'Cali', max: 22 },
    { ciudad: 'Cartagena', max: 11 }, 
    { ciudad: 'Cúcuta', max: 5 },
    { ciudad: 'Envigado', max: 2 },
    { ciudad: 'Girardot', max: 1 },
    { ciudad: 'Itagüí', max: 2 },
    { ciudad: 'Medellín', max: 29 },
    { ciudad: 'Montería', max: 5 },
    { ciudad: 'Neiva', max: 3 },
    { ciudad: 'Santa Marta', max: 5 },
    { ciudad: 'Villavicencio', max: 3 },
  ];

  laboralesCircuito.forEach(({ ciudad, max }) => {
    for (let i = 1; i <= max; i++) {
      const numero = i.toString().padStart(2, '0');
      juzgados.add(`Juzgado ${numero} Laboral del Circuito de ${ciudad}`);
    }
  });

  // Juzgados Civiles del Circuito
  const civilesCircuito = [
    { ciudad: 'Bogotá', max: 50 },
    { ciudad: 'Medellín', max: 20 },
    { ciudad: 'Cali', max: 20 },
    { ciudad: 'Barranquilla', max: 15 },
  ];

  civilesCircuito.forEach(({ ciudad, max }) => {
    for (let i = 1; i <= max; i++) {
      const numero = i.toString().padStart(2, '0');
      juzgados.add(`Juzgado ${numero} Civil del Circuito de ${ciudad}`);
    }
  });

  // Juzgados de Familia
  const familia = [
    { ciudad: 'Bogotá', max: 37 },
    { ciudad: 'Medellín', max: 15 },
    { ciudad: 'Cali', max: 10 },
  ];

  familia.forEach(({ ciudad, max }) => {
    for (let i = 1; i <= max; i++) {
      const numero = i.toString().padStart(2, '0');
      juzgados.add(`Juzgado ${numero} de Familia de ${ciudad}`);
    }
  });

  // Juzgados Civiles Municipales
  const civilesMunicipales = [
    { ciudad: 'Bogotá', max: 90 },
    { ciudad: 'Medellín', max: 30 },
    { ciudad: 'Cali', max: 25 },
    { ciudad: 'Chocontá', max: 1 },
  ];

  civilesMunicipales.forEach(({ ciudad, max }) => {
    for (let i = 1; i <= max; i++) {
      const numero = i.toString().padStart(2, '0');
      juzgados.add(`Juzgado ${numero} Civil Municipal de ${ciudad}`);
    }
  });

  // Juzgados Administrativos
  const administrativos = [
    { ciudad: 'Bogotá', max: 67 },
    { ciudad: 'Medellín', max: 20 },
  ];

  administrativos.forEach(({ ciudad, max }) => {
    for (let i = 1; i <= max; i++) {
      const numero = i.toString().padStart(2, '0');
      juzgados.add(`Juzgado ${numero} Administrativo de ${ciudad}`);
    }
  });

  // Juzgados de Pequeñas Causas Laborales
  const pequenasCausasLaborales = [
    { ciudad: 'Bogotá', max: 12 },
    { ciudad: 'Medellín', max: 5 },
  ];

  pequenasCausasLaborales.forEach(({ ciudad, max }) => {
    for (let i = 1; i <= max; i++) {
      const numero = i.toString().padStart(2, '0');
      juzgados.add(
        `Juzgado ${numero} Municipal de Pequeñas Causas Laborales de ${ciudad}`,
      );
    }
  });

  return juzgados;
}

export const JUZGADOS_VALIDOS = generarJuzgadosValidos();
