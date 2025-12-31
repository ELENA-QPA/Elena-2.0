import { Injectable, Logger } from '@nestjs/common';
import {
  JUZGADOS_VALIDOS,
  CIUDAD_DEPARTAMENTO,
} from '../constants/juzgados-colombia';

@Injectable()
export class JuzgadoNormalizerService {
  private readonly logger = new Logger(JuzgadoNormalizerService.name);
  private readonly juzgadosValidos = JUZGADOS_VALIDOS;

  normalizeJuzgado(despachoOriginal: string, ciudadOriginal?: string): string {
    if (!despachoOriginal || despachoOriginal.trim() === '') {
      return despachoOriginal;
    }

    const despacho = despachoOriginal.trim().replace(/\s+/g, ' ');

    const normalizado = this.intentarNormalizar(despacho, ciudadOriginal);

    if (normalizado && this.juzgadosValidos.has(normalizado)) {
      return normalizado;
    }

    if (normalizado) {
      const cercano = this.buscarJuzgadoCercano(normalizado);
      if (cercano) {
        return cercano;
      }
    }

    return despachoOriginal;
  }

  private intentarNormalizar(despacho: string, ciudad?: string): string | null {
    const normalized = despacho.toUpperCase();

    const componentes = this.extraerComponentes(normalized, ciudad);

    if (!componentes) {
      return null;
    }

    const {
      numero,
      tipo,
      ciudadFinal,
      esCircuito,
      esMunicipal,
      esFamilia,
      esPequenasCausas,
    } = componentes;

    if (numero && tipo && ciudadFinal) {
      const numeroFormateado = numero.padStart(2, '0');
      const numeroSinCeros = String(parseInt(numero, 10));

      let resultado = '';

      if (esPequenasCausas) {
        resultado = `Juzgado ${numeroFormateado} Municipal de Pequeñas Causas ${tipo} de ${ciudadFinal}`;
      } else if (esFamilia) {
        resultado = `Juzgado ${numeroFormateado} de Familia de ${ciudadFinal}`;
      } else if (esCircuito) {
        resultado = `Juzgado ${numeroFormateado} ${tipo} del Circuito de ${ciudadFinal}`;
      } else if (esMunicipal) {
        resultado = `Juzgado ${numeroFormateado} ${tipo} Municipal de ${ciudadFinal}`;
      } else if (tipo === 'Administrativo') {
        resultado = `Juzgado ${numeroFormateado} Administrativo de ${ciudadFinal}`;
      } else {
        resultado = `Juzgado ${numeroFormateado} ${tipo} del Circuito de ${ciudadFinal}`;
      }

      const variantes = [
        resultado,
        resultado.replace(numeroFormateado, numeroSinCeros),
        `Juzgado ${numeroSinCeros} ${tipo} del Circuito de ${ciudadFinal}`,
      ];

      for (const variante of variantes) {
        if (this.juzgadosValidos.has(variante)) {
          return variante;
        }
      }

      return resultado;
    }

    return null;
  }

  private extraerComponentes(despacho: string, ciudadOriginal?: string): any {
    let numero = '';
    let tipo = '';
    let ciudad = '';
    let esCircuito = false;
    let esMunicipal = false;
    let esFamilia = false;
    let esPequenasCausas = false;

    esCircuito = /CIRCUITO/i.test(despacho);
    esMunicipal = /MUNICIPAL/i.test(despacho);
    esFamilia = /FAMILIA/i.test(despacho);
    esPequenasCausas = /PEQUEÑAS?\s+CAUSAS/i.test(despacho);

    const patrones = [
      /JUZGADO\s+(\d+)\s+(LABORAL|CIVIL|PENAL|FAMILIA|ADMINISTRATIVO)(?:\s+(?:DEL?\s+)?CIRCUITO)?\s+(?:DE\s+)?(.+)/i,
      /^(\d+)\s+CIRCUITO\s*[-–]\s*(LABORAL|CIVIL|PENAL|FAMILIA|ADMINISTRATIVO)\s+(?:DE\s+)?(.+)/i,
      /JUZGADO\s+(LABORAL|CIVIL|PENAL|FAMILIA|ADMINISTRATIVO)\s+(\d+)\s+(?:(?:DEL?\s+)?CIRCUITO\s+)?(?:DE\s+)?(.+)/i,
      /JUZGADO\s+(\d+)\s+DE\s+(FAMILIA)\s+(?:DE\s+)?(.+)/i,
      /JUZGADO\s+(\d+)\s+(ADMINISTRATIVO)\s+(?:DE\s+)?(.+)/i,
      /JUZGADO\s+(\d+)\s+.*PEQUEÑAS?\s+CAUSAS\s+(LABORALES?)\s+(?:DE\s+)?(.+)/i,
    ];

    for (let i = 0; i < patrones.length; i++) {
      const patron = patrones[i];
      const match = despacho.match(patron);
      if (match) {
        if (i === 0 || i === 3 || i === 4) {
          numero = match[1];
          tipo = match[2];
          ciudad = match[3] || '';
        } else if (i === 1) {
          numero = match[1];
          tipo = match[2];
          ciudad = match[3] || '';
          esCircuito = true;
        } else if (i === 2) {
          tipo = match[1];
          numero = match[2];
          ciudad = match[3] || '';
        } else if (i === 5) {
          numero = match[1];
          tipo = 'Laborales';
          ciudad = match[3] || '';
          esPequenasCausas = true;
        }
        break;
      }
    }

    if (!numero) {
      const numeroMatch = despacho.match(/(\d+)/);
      if (numeroMatch) {
        numero = numeroMatch[1];
      }
    }

    if (!tipo) {
      if (/LABORAL/i.test(despacho)) tipo = 'Laboral';
      else if (/CIVIL/i.test(despacho)) tipo = 'Civil';
      else if (/PENAL/i.test(despacho)) tipo = 'Penal';
      else if (/FAMILIA/i.test(despacho)) tipo = 'Familia';
      else if (/ADMINISTRATIV/i.test(despacho)) tipo = 'Administrativo';
    }

    if (tipo) {
      tipo = this.normalizarTipo(tipo);
    }

    ciudad = ciudad.trim();

    const ciudadFinal = this.determinarCiudad(ciudad, ciudadOriginal, despacho);

    if (!numero || !tipo || !ciudadFinal) {
      return null;
    }

    return {
      numero,
      tipo,
      ciudadFinal,
      esCircuito,
      esMunicipal,
      esFamilia,
      esPequenasCausas,
    };
  }

  private normalizarTipo(tipo: string): string {
    const tipos: { [key: string]: string } = {
      LABORAL: 'Laboral',
      LABORALES: 'Laborales',
      CIVIL: 'Civil',
      PENAL: 'Penal',
      FAMILIA: 'Familia',
      ADMINISTRATIVO: 'Administrativo',
    };

    return tipos[tipo.toUpperCase()] || tipo;
  }

  private determinarCiudad(
    ciudadExtraida: string,
    ciudadOriginal?: string,
    despacho?: string,
  ): string {
    if (ciudadExtraida && ciudadExtraida.trim()) {
      return this.normalizarNombreCiudad(ciudadExtraida);
    }

    if (ciudadOriginal && ciudadOriginal.trim()) {
      return this.normalizarNombreCiudad(ciudadOriginal);
    }

    if (despacho) {
      for (const ciudad of Object.keys(CIUDAD_DEPARTAMENTO)) {
        if (despacho.toUpperCase().includes(ciudad.toUpperCase())) {
          return ciudad;
        }
      }
    }

    return '';
  }

  private normalizarNombreCiudad(ciudad: string): string {
    const ciudadLimpia = ciudad.trim().replace(/\*/g, '').replace(/\s+/g, ' ');

    const casosEspeciales: { [key: string]: string } = {
      MEDELLIN: 'Medellín',
      MEDELLÍN: 'Medellín',
      BOGOTA: 'Bogotá',
      BOGOTÁ: 'Bogotá',
      'BOGOTA D.C.': 'Bogotá',
      'BOGOTÁ D.C.': 'Bogotá',
      CUCUTA: 'Cúcuta',
      CÚCUTA: 'Cúcuta',
      ITAGUI: 'Itagüí',
      ITAGÜÍ: 'Itagüí',
      'SANTA MARTA': 'Santa Marta',
      MONTERIA: 'Montería',
      CÓRDOBA: 'Córdoba',
      CORDOBA: 'Córdoba',
      CHOCONTA: 'Chocontá',
      CHOCONTÁ: 'Chocontá',
      CALI: 'Cali',
      NEIVA: 'Neiva',
    };

    const ciudadUpper = ciudadLimpia.toUpperCase();
    if (casosEspeciales[ciudadUpper]) {
      return casosEspeciales[ciudadUpper];
    }

    return ciudadLimpia
      .toLowerCase()
      .split(' ')
      .map((palabra, index) => {
        if (palabra === 'd.c.' || palabra === 'dc') return 'D.C.';
        if (
          index > 0 &&
          ['de', 'del', 'la', 'las', 'los', 'el'].includes(palabra)
        ) {
          return palabra;
        }
        return palabra.charAt(0).toUpperCase() + palabra.slice(1);
      })
      .join(' ');
  }

  private buscarJuzgadoCercano(normalizado: string): string | null {
    const palabras = normalizado.split(' ');
    const numeroMatch = normalizado.match(/\d+/);
    const numero = numeroMatch ? numeroMatch[0] : null;
    const numeroSinCeros = numero ? String(parseInt(numero, 10)) : null;
    const ciudad = palabras[palabras.length - 1];

    const normalizadoUpper = normalizado.toUpperCase();
    for (const juzgadoValido of this.juzgadosValidos) {
      if (juzgadoValido.toUpperCase() === normalizadoUpper) {
        return juzgadoValido;
      }
    }

    if (numeroSinCeros && numeroSinCeros !== numero) {
      const conNumeroSinCeros = normalizado.replace(numero, numeroSinCeros);

      for (const juzgadoValido of this.juzgadosValidos) {
        if (juzgadoValido.toUpperCase() === conNumeroSinCeros.toUpperCase()) {
          return juzgadoValido;
        }
      }
    }

    for (const juzgadoValido of this.juzgadosValidos) {
      if (
        juzgadoValido.toUpperCase().includes(normalizadoUpper) ||
        normalizadoUpper.includes(juzgadoValido.toUpperCase())
      ) {
        return juzgadoValido;
      }
    }

    if ((numeroSinCeros || numero) && ciudad) {
      const numBuscar = numeroSinCeros || numero;
      for (const juzgadoValido of this.juzgadosValidos) {
        if (
          juzgadoValido.includes(numBuscar) &&
          juzgadoValido.includes(ciudad)
        ) {
          return juzgadoValido;
        }
      }
    }

    return null;
  }
}
