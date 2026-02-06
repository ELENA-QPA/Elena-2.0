import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

interface MonolegalLoginResponse {
  token: string;
  tokenMonolegal: string;
  success: boolean;
  message: string;
  errorCode: string;
}

interface ResumenCambios {
  tieneCambios: boolean;
  idFecha: string;
  estadisticas: {
    numeroExpedientes: number;
    numeroCambios: number;
  };
}

interface CambioDetalle {
  id: string;
  numero: string;
  demandantes: string;
  demandados: string;
  despacho: string;
  ultimaActuacion: string;
  ultimaAnotacion: string;
  fechaUltimaActuacion: string;
  ultimoRegistro: string;
  etiqueta: string | null;
  fuentesConCambios: string;
}

interface ProcesoEnFuente {
  tipoFuente: string;
  activo: boolean;
  actuacion: any;
  ultimaActuacion: string;
  idProceso: string;
  numActuaciones: number;
  descripcionUltimaActuacion: string;
  fechaUltimaActuacion: string;
  estado: number;
  expedienteDigital: any;
  informacionRegistro: Array<{ clave: string; valor: string }>;
  idUltimaConsulta: string | null;
  idActualizacion: string;
  termino: string;
  esProcesoPrincipal: boolean;
}

interface ExpedienteDetalle {
  id: string;
  numero: string;
  entidad: string;
  ciudad: string;
  corporacion: string;
  juezEncargado: string;
  despacho: string;
  ubicacion: string;
  tipo: string;
  clase: string;
  demandantes: string;
  demandados: string;
  etiqueta: string | null;
  idAbogado: string;
  procesosEnFuentesDatos: ProcesoEnFuente[];
  fechaUltimoCambioEnFuente: string;
  fuenteUltimoCambio: number;
  fechaTerminoEnFuente: string | null;
  tieneCambioEnFuente: boolean;
  tieneTerminoEnFuente: boolean;
  fechaUltimoCambioFuenteStr: string;
}

interface ActuacionUnificada {
  id: string;
  idProceso: string;
  numProceso: string;
  fechaDeActuacion: string;
  textoActuacion: string;
  anotacion: string;
  fechaIniciaTermino: string | null;
  fechaFinalizaTermino: string | null;
  fechaDeRegistro: string;
  idActualizacion: string;
  fechaCreacion: string;
  idRegActuacion: number;
  conDocumentos: boolean;
}

@Injectable()
export class MonolegalApiService {
  private readonly logger = new Logger(MonolegalApiService.name);
  private readonly baseUrl = 'https://apiexpedientedigital.monolegal.co/api';
  private token: string | null = null;
  private tokenMonolegal: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async login(): Promise<string> {
    if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.token;
    }

    try {
      const email = this.configService.get('MONOLEGAL_EMAIL');
      const pwd = this.configService.get('MONOLEGAL_PASSWORD');

      if (!email || !pwd) {
        throw new BadRequestException(
          'Credenciales de Monolegal no configuradas en variables de entorno',
        );
      }

      const response = await firstValueFrom(
        this.httpService.post<MonolegalLoginResponse>(`${this.baseUrl}/Login`, {
          email,
          pwd,
        }),
      );

      if (!response.data.success) {
        throw new BadRequestException(
          'Error en login de Monolegal: ' + response.data.message,
        );
      }

      this.token = response.data.token;
      this.tokenMonolegal = response.data.tokenMonolegal;
      this.tokenExpiry = new Date();
      this.tokenExpiry.setHours(this.tokenExpiry.getHours() + 23);

      this.logger.log('Login exitoso en Monolegal');
      return this.token;
    } catch (error) {
      this.logger.error('Error en login Monolegal:', (error as any).message);
      throw new BadRequestException(
        'No se pudo autenticar con Monolegal: ' + (error as any).message,
      );
    }
  }

  /**
   * @param idExpediente
   */
  async getExpediente(idExpediente: string): Promise<ExpedienteDetalle> {
    const token = await this.login();

    try {
      const response = await firstValueFrom(
        this.httpService.get<ExpedienteDetalle>(
          `${this.baseUrl}/Expedientes/${idExpediente}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error obteniendo expediente:', (error as any).message);
      throw new BadRequestException(
        'Error al obtener expediente de Monolegal: ' + (error as any).message,
      );
    }
  }

  /**
   * @param fecha
   */
  async getResumenCambios(fecha: string): Promise<ResumenCambios> {
    const token = await this.login();

    try {
      const response = await firstValueFrom(
        this.httpService.get<ResumenCambios>(
          `${this.baseUrl}/ResumenActualizacion/${fecha}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error obteniendo resumen:', (error as any).message);
      throw new BadRequestException(
        'Error al obtener resumen de Monolegal: ' + (error as any).message,
      );
    }
  }

  /**
   * @param fecha
   * @param pagina
   */
  async getDetalleCambios(fecha: string, pagina = 0): Promise<CambioDetalle[]> {
    const token = await this.login();

    try {
      const response = await firstValueFrom(
        this.httpService.get<CambioDetalle[]>(
          `${this.baseUrl}/InformeExpedientes/Cambios`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              idFecha: fecha,
              pagina: pagina,
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error obteniendo detalle:', (error as any).message);
      throw new BadRequestException(
        'Error al obtener detalle de Monolegal: ' + (error as any).message,
      );
    }
  }

  async getTodosCambios(fecha: string): Promise<CambioDetalle[]> {
    const todosLosCambios: CambioDetalle[] = [];
    let pagina = 0;
    let tieneMasDatos = true;

    while (tieneMasDatos) {
      const cambios = await this.getDetalleCambios(fecha, pagina);

      if (cambios.length === 0) {
        tieneMasDatos = false;
      } else {
        todosLosCambios.push(...cambios);
        pagina++;

        if (pagina > 100) {
          this.logger.warn('Se alcanzó el límite de 100 páginas');
          break;
        }
      }
    }

    this.logger.log(`Total de cambios obtenidos: ${todosLosCambios.length}`);
    return todosLosCambios;
  }

  formatearFechaMonolegal(fecha: Date = new Date()): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * @param idProceso
   * @param fuente
   */
  async getActuaciones(
    idProceso: string,
    fuente: string,
  ): Promise<ActuacionUnificada[]> {
    await this.login();

    let baseUrl: string;
    let tokenToUse: string;

    switch (fuente?.toLowerCase()) {
      case 'unificada':
        baseUrl = `https://unificada.monolegal.co/backend/api/procesos/${idProceso}/Actuaciones`;
        tokenToUse = this.token;
        break;
      case 'rama':
        baseUrl = `https://apirama.monolegal.co/api/Procesos/${idProceso}/Actuaciones`;
        tokenToUse = this.token;
        break;
      case 'tyba':
        baseUrl = `https://apityba.monolegal.co/api/Procesos/${idProceso}/Actuaciones`;
        tokenToUse = this.token;
        break;
      case 'estadoselectronicos':
      case 'publicacionesprocesales':
      case 'siugj':
        return this.getActuacionesPublicacionesProcesales(idProceso);
      case 'samai':
        baseUrl = `https://apisamai.monolegal.co/api/Procesos/${idProceso}/Actuaciones`;
        tokenToUse = this.token;
        break;
      default:
        this.logger.warn(`Fuente desconocida: ${fuente}, intentando con Rama`);
        baseUrl = `https://apirama.monolegal.co/api/Procesos/${idProceso}/Actuaciones`;
        tokenToUse = this.token;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<any[]>(baseUrl, {
          headers: {
            Authorization: `Bearer ${tokenToUse}`,
          },
        }),
      );

      // Formatear las actuaciones
      const actuaciones = (response.data || []).map((act) => ({
        ...act,
        // Formatear fechaActuacion si viene en formato texto "14 Oct 2025"
        fechaActuacion:
          this.formatearFechaTexto(act.fechaActuacion) || act.fechaActuacion,
        fechaDeActuacion:
          this.formatearFechaTexto(act.fechaActuacion) || act.fechaDeActuacion,
      }));

      // Ordenar por fecha
      return actuaciones.sort((a, b) => {
        const dateA = this.parsearFecha(a.fechaActuacion || a.fechaDeActuacion);
        const dateB = this.parsearFecha(b.fechaActuacion || b.fechaDeActuacion);

        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;

        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      this.logger.error(
        `Error obteniendo actuaciones (${fuente}):`,
        (error as any).message,
      );
      return [];
    }
  }

  /**
   * Obtiene actuaciones de PublicacionesProcesales y las transforma al formato estándar
   */
  private async getActuacionesPublicacionesProcesales(
    idProceso: string,
  ): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<any>(
          `https://estadoselectronicos.monolegal.co/backend/api/v2/procesos/${idProceso}`,
          {
            headers: {
              Authorization: `Bearer ${this.token}`,
            },
          },
        ),
      );

      const data = response.data;
      const actuaciones: any[] = [];

      if (
        data.documentosDondeSeEncuentra &&
        Array.isArray(data.documentosDondeSeEncuentra)
      ) {
        for (const doc of data.documentosDondeSeEncuentra) {
          const extracto = doc.coincidenciasDelDocumento?.[0]?.extracto || '';

          // Convertir fecha "22 abril 2025" a "22/04/2025"
          const fechaFormateada = this.formatearFechaTexto(doc.fecha);

          actuaciones.push({
            id: doc.idDocumento || `pp-${Date.now()}`,
            idProceso: idProceso,
            textoActuacion: doc.nombreDocumento || '',
            actuacion: doc.nombreDocumento || '',
            anotacion: extracto,
            fechaActuacion: fechaFormateada,
            fechaDeActuacion: fechaFormateada,
            linkDocumento: doc.linkAlDocumento || '',
            seccion: doc.seccion || '',
            fuente: 'PublicacionesProcesales',
            tipoFuente: 'PublicacionesProcesales',
          });
        }
      }

      return actuaciones.sort((a, b) => {
        const fechaA = this.parsearFecha(a.fechaActuacion);
        const fechaB = this.parsearFecha(b.fechaActuacion);

        if (!fechaA && !fechaB) return 0;
        if (!fechaA) return 1;
        if (!fechaB) return -1;

        return fechaB.getTime() - fechaA.getTime();
      });
    } catch (error) {
      this.logger.error(
        `Error obteniendo PublicacionesProcesales: ${(error as any).message}`,
      );
      return [];
    }
  }

  /**
   * Convierte "22 abril 2025" a "22/04/2025"
   */
  private formatearFechaTexto(fecha: string): string {
    if (!fecha) return '';

    const meses: { [key: string]: string } = {
      // Español completo
      enero: '01',
      febrero: '02',
      marzo: '03',
      abril: '04',
      mayo: '05',
      junio: '06',
      julio: '07',
      agosto: '08',
      septiembre: '09',
      octubre: '10',
      noviembre: '11',
      diciembre: '12',
      // Inglés abreviado
      jan: '01',
      feb: '02',
      mar: '03',
      apr: '04',
      may: '05',
      jun: '06',
      jul: '07',
      aug: '08',
      sep: '09',
      oct: '10',
      nov: '11',
      dec: '12',
      // Español abreviado
      ene: '01',
      abr: '04',
      ago: '08',
      dic: '12',
    };

    const match = fecha.match(/^(\d{1,2})\s+([a-zA-ZáéíóúÁÉÍÓÚ]+)\s+(\d{4})$/i);
    if (match) {
      const [, day, mesTexto, year] = match;
      const mes = meses[mesTexto.toLowerCase()];
      if (mes) {
        return `${day.padStart(2, '0')}/${mes}/${year}`;
      }
    }

    return fecha;
  }
  /**
   * Busca procesos por número de radicado en la API Unificada
   * @param numeroRadicado - Número de radicado del proceso
   */
  async buscarProcesosPorRadicado(numeroRadicado: string): Promise<any[]> {
    await this.login();

    try {
      const response = await firstValueFrom(
        this.httpService.get<any[]>(
          `https://unificada.monolegal.co/backend/api/procesos/${numeroRadicado}`,
          {
            headers: {
              Authorization: `Bearer ${this.token}`,
            },
          },
        ),
      );

      return response.data || [];
    } catch (error) {
      this.logger.error('Error buscando procesos:', (error as any).message);
      return [];
    }
  }

  /**
   * @param numeroRadicado
   */
  async getActuacionesPorRadicado(numeroRadicado: string): Promise<any[]> {
    await this.login();

    try {
      const procesos = await this.buscarProcesosPorRadicado(numeroRadicado);

      // Validar que hay procesos válidos con id
      if (!procesos || procesos.length === 0) {
        this.logger.warn(`No se encontraron procesos para ${numeroRadicado}`);
        return [];
      }

      // Filtrar solo procesos que tengan id válido
      const procesosValidos = procesos.filter((p: any) => p && p.id);

      if (procesosValidos.length === 0) {
        this.logger.warn(
          `No hay procesos válidos con id para ${numeroRadicado}`,
        );
        return [];
      }

      const procesoSeleccionado = procesosValidos.reduce(
        (mejor: any, actual: any) => {
          return (actual.totalActuaciones || 0) > (mejor.totalActuaciones || 0)
            ? actual
            : mejor;
        },
        procesosValidos[0],
      );

      this.logger.log(
        `Proceso seleccionado: ${procesoSeleccionado.id} con ${procesoSeleccionado.totalActuaciones} actuaciones`,
      );

      const response = await firstValueFrom(
        this.httpService.get<any[]>(
          `https://unificada.monolegal.co/backend/api/procesos/${procesoSeleccionado.id}/Actuaciones`,
          {
            headers: {
              Authorization: `Bearer ${this.token}`,
            },
          },
        ),
      );

      const actuaciones = (response.data || []).sort((a, b) => {
        const dateA = new Date(
          a.fechaActuacion || a.fechaDeActuacion || 0,
        ).getTime();
        const dateB = new Date(
          b.fechaActuacion || b.fechaDeActuacion || 0,
        ).getTime();
        return dateB - dateA;
      });

      return actuaciones;
    } catch (error) {
      this.logger.error(
        'Error obteniendo actuaciones por radicado:',
        (error as any).message,
      );
      return [];
    }
  }

  /**
   * @param radicado
   */
  async buscarProcesosEnUnificada(radicado: string): Promise<any[]> {
    await this.login();

    try {
      this.logger.log(
        `[UNIFICADA] Buscando procesos para radicado: ${radicado}`,
      );

      const response = await firstValueFrom(
        this.httpService.get<any>(
          `https://unificada.monolegal.co/backend/api/procesos`,
          {
            headers: {
              Authorization: `Bearer ${this.token}`,
            },
            params: {
              numero: radicado,
            },
          },
        ),
      );

      const procesos = Array.isArray(response.data)
        ? response.data
        : [response.data].filter(Boolean);
      this.logger.log(`[UNIFICADA] Procesos encontrados: ${procesos.length}`);

      return procesos;
    } catch (error) {
      this.logger.error(
        `[UNIFICADA] Error buscando procesos: ${(error as any).message}`,
      );
      return [];
    }
  }

  /**
   * @param idProceso - ID del proceso en Monolegal
   */
  async getActuacionesPorIdProceso(idProceso: string): Promise<any[]> {
    await this.login();

    try {
      const response = await firstValueFrom(
        this.httpService.get<any[]>(
          `https://unificada.monolegal.co/backend/api/procesos/${idProceso}/Actuaciones`,
          {
            headers: {
              Authorization: `Bearer ${this.token}`,
            },
          },
        ),
      );

      const actuaciones = (response.data || []).sort((a, b) => {
        const dateA = new Date(
          a.fechaActuacion || a.fechaDeActuacion || 0,
        ).getTime();
        const dateB = new Date(
          b.fechaActuacion || b.fechaDeActuacion || 0,
        ).getTime();
        return dateB - dateA;
      });

      return actuaciones;
    } catch (error) {
      this.logger.error('Error obteniendo actuaciones:', (error as any).message);
      return [];
    }
  }

  /**
   * Obtiene actuaciones de TODAS las fuentes disponibles
   * @param idExpediente - ID del expediente en Monolegal
   */
  async getActuacionesTodasLasFuentes(idExpediente: string): Promise<{
    unificada: any[];
    publicacionesProcesales: any[];
    otras: any[];
    combinadas: any[];
    fechaUltimaActuacion: string;
  }> {
    const resultado = {
      unificada: [],
      publicacionesProcesales: [],
      otras: [],
      combinadas: [],
      fechaUltimaActuacion: '',
    };

    try {
      const expediente = await this.getExpediente(idExpediente);

      if (!expediente?.procesosEnFuentesDatos) {
        this.logger.warn(
          `Expediente ${idExpediente} no tiene procesosEnFuentesDatos`,
        );
        return resultado;
      }

      // Buscar fecha más reciente
      let fechaMasReciente: Date | null = null;

      for (const fuente of expediente.procesosEnFuentesDatos) {
        if (
          fuente.fechaUltimaActuacion &&
          fuente.fechaUltimaActuacion.trim() !== ''
        ) {
          const fechaParsed = this.parsearFecha(fuente.fechaUltimaActuacion);
          if (
            fechaParsed &&
            (!fechaMasReciente ||
              fechaParsed.getTime() > fechaMasReciente.getTime())
          ) {
            fechaMasReciente = fechaParsed;
          }
        }
      }

      if (fechaMasReciente) {
        resultado.fechaUltimaActuacion = `${String(
          fechaMasReciente.getDate(),
        ).padStart(2, '0')}/${String(fechaMasReciente.getMonth() + 1).padStart(
          2,
          '0',
        )}/${fechaMasReciente.getFullYear()}`;
      }

      // Recorrer TODAS las fuentes
      for (const fuente of expediente.procesosEnFuentesDatos) {
        if (!fuente.activo || !fuente.idProceso) continue;

        const tipoFuente = (fuente.tipoFuente || '').toLowerCase();

        try {
          if (tipoFuente === 'unificada') {
            const actuaciones = await this.getActuacionesPorIdProceso(
              fuente.idProceso,
            );
            for (const act of actuaciones) {
              resultado.unificada.push({
                ...act,
                fuente: 'Unificada',
                tipoFuente: 'Unificada',
              });
            }
          } else if (tipoFuente === 'publicacionesprocesales') {
            // Obtener actuaciones de la API de estados electrónicos
            const actuaciones = await this.getActuaciones(
              fuente.idProceso,
              'publicacionesprocesales',
            );
            for (const act of actuaciones) {
              resultado.publicacionesProcesales.push({
                ...act,
                fuente: 'PublicacionesProcesales',
                tipoFuente: 'PublicacionesProcesales',
              });
            }
          } else {
            // Otras fuentes: rama, tyba, samai, etc.
            const actuaciones = await this.getActuaciones(
              fuente.idProceso,
              tipoFuente,
            );
            for (const act of actuaciones) {
              resultado.otras.push({
                ...act,
                fuente: fuente.tipoFuente,
                tipoFuente: fuente.tipoFuente,
              });
            }
          }

          this.logger.log(
            `[FUENTE] ${fuente.tipoFuente}: obtenidas actuaciones`,
          );
        } catch (error) {
          this.logger.error(
            `[FUENTE] Error obteniendo ${fuente.tipoFuente}: ${(error as any).message}`,
          );
        }
      }

      // Combinar todas
      const todas = [
        ...resultado.unificada,
        ...resultado.publicacionesProcesales,
        ...resultado.otras,
      ];

      // Eliminar duplicados
      const mapaUnicos = new Map();
      for (const act of todas) {
        const clave = `${act.textoActuacion || act.actuacion}-${
          act.fechaActuacion || act.fechaDeActuacion
        }`;
        if (!mapaUnicos.has(clave)) {
          mapaUnicos.set(clave, act);
        }
      }

      // Ordenar por fecha (más reciente primero)
      resultado.combinadas = Array.from(mapaUnicos.values()).sort((a, b) => {
        const fechaA = this.parsearFecha(
          a.fechaActuacion || a.fechaDeActuacion,
        );
        const fechaB = this.parsearFecha(
          b.fechaActuacion || b.fechaDeActuacion,
        );

        if (!fechaA && !fechaB) return 0;
        if (!fechaA) return 1;
        if (!fechaB) return -1;

        return fechaB.getTime() - fechaA.getTime();
      });

      this.logger.log(
        `[ACTUACIONES] Expediente ${idExpediente}: ` +
          `Unificada=${resultado.unificada.length}, ` +
          `PublicacionesProcesales=${resultado.publicacionesProcesales.length}, ` +
          `Otras=${resultado.otras.length}, ` +
          `Total=${resultado.combinadas.length}`,
      );

      return resultado;
    } catch (error) {
      this.logger.error(
        `Error en getActuacionesTodasLasFuentes: ${(error as any).message}`,
      );
      throw error;
    }
  }

  //Parsea diferentes formatos de fecha

  private parsearFecha(fecha: any): Date | null {
    if (!fecha) return null;

    if (fecha instanceof Date) {
      return isNaN(fecha.getTime()) ? null : fecha;
    }

    if (typeof fecha === 'string') {
      // Formato ISO
      if (fecha.includes('T')) {
        const parsed = new Date(fecha);
        return isNaN(parsed.getTime()) ? null : parsed;
      }

      // Formato "1/27/2026 9:54:54 AM"
      const usFormat =
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM|a\.\s*m\.|p\.\s*m\.)?/i;
      const usMatch = fecha.match(usFormat);
      if (usMatch) {
        const [, month, day, year, hour, min, sec, ampm] = usMatch;
        let hourNum = parseInt(hour, 10);
        const isPM = ampm?.toLowerCase().includes('p');
        const isAM = ampm?.toLowerCase().includes('a');
        if (isPM && hourNum < 12) hourNum += 12;
        if (isAM && hourNum === 12) hourNum = 0;
        return new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          hourNum,
          parseInt(min),
          parseInt(sec),
        );
      }

      // Formato "DD/MM/YYYY"
      const simpleMatch = fecha.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (simpleMatch) {
        const [, p1, p2, year] = simpleMatch;
        const day = parseInt(p1, 10);
        const month = parseInt(p2, 10);
        return new Date(parseInt(year), month - 1, day, 12, 0, 0);
      }

      // Formato "22 abril 2025" o "14 Oct 2025" (mes completo o abreviado)
      const meses: { [key: string]: number } = {
        // Español completo
        enero: 0,
        febrero: 1,
        marzo: 2,
        abril: 3,
        mayo: 4,
        junio: 5,
        julio: 6,
        agosto: 7,
        septiembre: 8,
        octubre: 9,
        noviembre: 10,
        diciembre: 11,
        // Inglés completo
        january: 0,
        february: 1,
        march: 2,
        april: 3,
        may: 4,
        june: 5,
        july: 6,
        august: 7,
        september: 8,
        october: 9,
        november: 10,
        december: 11,
        // Inglés abreviado
        jan: 0,
        feb: 1,
        mar: 2,
        apr: 3,
        jun: 5,
        jul: 6,
        aug: 7,
        sep: 8,
        oct: 9,
        nov: 10,
        dec: 11,
        // Español abreviado
        ene: 0,
        abr: 3,
        ago: 7,
        dic: 11,
      };

      const textoMatch = fecha.match(
        /^(\d{1,2})\s+([a-zA-ZáéíóúÁÉÍÓÚ]+)\s+(\d{4})$/i,
      );
      if (textoMatch) {
        const [, day, mesTexto, year] = textoMatch;
        const mes = meses[mesTexto.toLowerCase()];
        if (mes !== undefined) {
          return new Date(parseInt(year), mes, parseInt(day), 12, 0, 0);
        }
      }

      // Último intento
      const parsed = new Date(fecha);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  }

  /**
   * Normaliza fechas de PublicacionesProcesales (formato: "12/18/2025 6:39:39 AM")
   * a formato DD/MM/YYYY
   */
  private normalizarFechaPublicaciones(fecha: string): string {
    if (!fecha) return '';

    try {
      // Formato: "12/18/2025 6:39:39 AM" -> "18/12/2025"
      const match = fecha.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (match) {
        const [, month, day, year] = match;
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      }
    } catch (error) {
      this.logger.error(`Error normalizando fecha: ${(error as any).message}`);
    }

    return fecha;
  }

  /**
   * Obtiene todos los expedientes paginados
   */
  async getTodosExpedientes(): Promise<any[]> {
    await this.login();

    const todosLosExpedientes: any[] = [];
    let pagina = 0;
    let tieneMasDatos = true;

    while (tieneMasDatos) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<any[]>(`${this.baseUrl}/Expedientes`, {
            headers: {
              Authorization: `Bearer ${this.token}`,
            },
            params: {
              pagina: pagina,
              ordenadoPor: 'primerolosquehancambiado',
            },
          }),
        );

        const expedientes = response.data || [];

        if (expedientes.length === 0) {
          tieneMasDatos = false;
        } else {
          todosLosExpedientes.push(...expedientes);
          this.logger.log(
            `[EXPEDIENTES] Página ${pagina}: ${expedientes.length} expedientes`,
          );
          pagina++;

          if (pagina > 100) {
            this.logger.warn('Se alcanzó el límite de 100 páginas');
            break;
          }
        }
      } catch (error) {
        this.logger.error(`Error en página ${pagina}: ${(error as any).message}`);
        tieneMasDatos = false;
      }
    }

    this.logger.log(
      `[EXPEDIENTES] Total obtenidos: ${todosLosExpedientes.length}`,
    );
    return todosLosExpedientes;
  }

  /**
   * Registra un proceso en Monolegal
   * @param radicado - Número de radicado del proceso (ej: "05001400300120210113000")
   * @returns Respuesta de la API de Monolegal con el ID del expediente creado
   */
  async registrarProcesoEnMonolegal(radicado: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    await this.login();

    // Valores fijos proporcionados por el cliente
    const ID_ABOGADO = '59917';
    const ID_USUARIO_MIGRADO = 'e6267664-aeca-4ae5-8d84-c0776c9b8fcc';

    try {
      const payload = {
        idAbogado: ID_ABOGADO,
        idUsuarioMigrado: ID_USUARIO_MIGRADO,
        numerosProcesos: [radicado],
      };

      this.logger.log(`[MONOLEGAL] Registrando proceso: ${radicado}`);

      const response = await firstValueFrom(
        this.httpService.post<any>(
          'https://apisales.monolegal.co/api/RegistroAutomaticoProcesos',
          payload,
          {
            headers: {
              Authorization: `Bearer ${this.token}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.logger.log(
        `[MONOLEGAL] Proceso registrado exitosamente: ${radicado}`,
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      this.logger.error(
        `[MONOLEGAL] Error al registrar proceso ${radicado}: ${(error as any).message}`,
      );

      // Extraer mensaje de error más específico si existe
      const errorMessage =
        (error as any).response?.data?.message ||
        (error as any).response?.data?.error ||
        (error as any).message ||
        'Error desconocido al registrar en Monolegal';

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Registra múltiples procesos en Monolegal en una sola llamada
   * @param radicados - Array de números de radicado
   * @returns Respuesta de la API de Monolegal
   */
  async registrarProcesosEnMonolegal(radicados: string[]): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    await this.login();

    const ID_ABOGADO = '59917';
    const ID_USUARIO_MIGRADO = 'e6267664-aeca-4ae5-8d84-c0776c9b8fcc';

    try {
      const payload = {
        idAbogado: ID_ABOGADO,
        idUsuarioMigrado: ID_USUARIO_MIGRADO,
        numerosProcesos: radicados,
      };

      this.logger.log(
        `[MONOLEGAL] Registrando ${radicados.length} procesos en lote`,
      );

      const response = await firstValueFrom(
        this.httpService.post<any>(
          'https://apisales.monolegal.co/api/RegistroAutomaticoProcesos',
          payload,
          {
            headers: {
              Authorization: `Bearer ${this.token}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.logger.log(
        `[MONOLEGAL] ${radicados.length} procesos registrados exitosamente`,
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      this.logger.error(
        `[MONOLEGAL] Error al registrar procesos en lote: ${(error as any).message}`,
      );

      return {
        success: false,
        error:
          (error as any).response?.data?.message ||
          (error as any).message ||
          'Error al registrar en Monolegal',
      };
    }
  }

  /**
   * Busca expediente por número de radicado en la API de Expedientes
   */
  async buscarExpedientePorRadicado(radicado: string): Promise<any | null> {
    await this.login();

    try {
      const response = await firstValueFrom(
        this.httpService.get<any[]>(`${this.baseUrl}/Expedientes`, {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
          params: {
            numero: radicado,
          },
        }),
      );

      const expedientes = response.data || [];

      // Buscar el que coincida con el radicado
      const expediente = expedientes.find(
        (exp) =>
          exp.numero === radicado ||
          exp.numero?.replace(/\s/g, '') === radicado.replace(/\s/g, ''),
      );

      if (expediente) {
        this.logger.log(
          `[EXPEDIENTE] Encontrado: ${expediente.id} para radicado ${radicado}`,
        );
        return expediente;
      }

      this.logger.warn(
        `[EXPEDIENTE] No se encontró expediente para radicado: ${radicado}`,
      );
      return null;
    } catch (error) {
      this.logger.error(
        `Error buscando expediente por radicado: ${(error as any).message}`,
      );
      return null;
    }
  }
}
