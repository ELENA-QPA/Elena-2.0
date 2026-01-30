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
      this.logger.error('Error en login Monolegal:', error.message);
      throw new BadRequestException(
        'No se pudo autenticar con Monolegal: ' + error.message,
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
      this.logger.error('Error obteniendo expediente:', error.message);
      throw new BadRequestException(
        'Error al obtener expediente de Monolegal: ' + error.message,
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
      this.logger.error('Error obteniendo resumen:', error.message);
      throw new BadRequestException(
        'Error al obtener resumen de Monolegal: ' + error.message,
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
      this.logger.error('Error obteniendo detalle:', error.message);
      throw new BadRequestException(
        'Error al obtener detalle de Monolegal: ' + error.message,
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
      default:
        this.logger.warn(`Fuente desconocida: ${fuente}, intentando con Rama`);
        baseUrl = `https://apirama.monolegal.co/api/Procesos/${idProceso}/Actuaciones`;
        tokenToUse = this.token;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<ActuacionUnificada[]>(baseUrl, {
          headers: {
            Authorization: `Bearer ${tokenToUse}`,
          },
        }),
      );

      const actuaciones = response.data.sort((a, b) => {
        const dateA = new Date(a.fechaDeActuacion).getTime();
        const dateB = new Date(b.fechaDeActuacion).getTime();
        return dateB - dateA;
      });

      return actuaciones;
    } catch (error) {
      this.logger.error(
        `Error obteniendo actuaciones (${fuente}):`,
        error.message,
      );
      throw new BadRequestException(
        'Error al obtener actuaciones de Monolegal: ' + error.message,
      );
    }
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
      this.logger.error('Error buscando procesos:', error.message);
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
        error.message,
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
        `[UNIFICADA] Error buscando procesos: ${error.message}`,
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
      this.logger.error('Error obteniendo actuaciones:', error.message);
      return [];
    }
  }

  /**
   * Obtiene actuaciones de todas las fuentes (Unificada + PublicacionesProcesales)
   * Si Unificada está vacía, busca en otras fuentes como fallback
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
      // 1. Obtener el expediente con todas sus fuentes
      const expediente = await this.getExpediente(idExpediente);

      if (!expediente?.procesosEnFuentesDatos) {
        this.logger.warn(
          `Expediente ${idExpediente} no tiene procesosEnFuentesDatos`,
        );
        return resultado;
      }

      // BUSCAR LA FECHA MÁS RECIENTE entre Unificada y PublicacionesProcesales
      let fechaMasReciente: Date | null = null;

      for (const fuente of expediente.procesosEnFuentesDatos) {
        const tipoFuente = (fuente.tipoFuente || '').toLowerCase();

        // Solo considerar Unificada y PublicacionesProcesales
        if (
          tipoFuente !== 'unificada' &&
          tipoFuente !== 'publicacionesprocesales'
        ) {
          continue;
        }

        if (
          fuente.fechaUltimaActuacion &&
          fuente.fechaUltimaActuacion.trim() !== ''
        ) {
          const fechaParsed = this.parsearFecha(fuente.fechaUltimaActuacion);

          if (fechaParsed) {
            // Si no hay fecha aún, o esta es más reciente, guardarla
            if (
              !fechaMasReciente ||
              fechaParsed.getTime() > fechaMasReciente.getTime()
            ) {
              fechaMasReciente = fechaParsed;
              this.logger.log(
                `[FECHA] Nueva fecha más reciente de ${fuente.tipoFuente}: ${fuente.fechaUltimaActuacion}`,
              );
            }
          }
        }
      }

      // Formatear la fecha encontrada
      if (fechaMasReciente) {
        resultado.fechaUltimaActuacion = `${String(
          fechaMasReciente.getDate(),
        ).padStart(2, '0')}/${String(fechaMasReciente.getMonth() + 1).padStart(
          2,
          '0',
        )}/${fechaMasReciente.getFullYear()}`;
      }

      this.logger.log(
        `[FECHA] Fecha final más reciente: ${
          resultado.fechaUltimaActuacion || 'N/A'
        }`,
      );

      // 2. Primera pasada: obtener Unificada y PublicacionesProcesales
      for (const fuente of expediente.procesosEnFuentesDatos) {
        if (!fuente.activo) continue;

        const tipoFuente = (fuente.tipoFuente || '').toLowerCase();

        if (tipoFuente === 'unificada') {
          if (fuente.idProceso) {
            try {
              const actuacionesDetalle = await this.getActuacionesPorIdProceso(
                fuente.idProceso,
              );
              for (const act of actuacionesDetalle) {
                resultado.unificada.push({
                  ...act,
                  fuente: 'Unificada',
                  tipoFuente: 'Unificada',
                });
              }
            } catch (error) {
              this.logger.error(
                `Error obteniendo detalle de Unificada: ${error.message}`,
              );
            }
          }
        } else if (tipoFuente === 'publicacionesprocesales') {
          // SOLO agregar si tiene fecha válida
          if (
            fuente.fechaUltimaActuacion &&
            fuente.fechaUltimaActuacion.trim() !== ''
          ) {
            const actuacionData = {
              id: fuente.idProceso || `${tipoFuente}-${Date.now()}`,
              idProceso: fuente.idProceso,
              actuacion: fuente.ultimaActuacion || '',
              textoActuacion: fuente.ultimaActuacion || '',
              anotacion: fuente.descripcionUltimaActuacion || '',
              fechaActuacion: this.normalizarFechaPublicaciones(
                fuente.fechaUltimaActuacion,
              ),
              fechaDeActuacion: this.normalizarFechaPublicaciones(
                fuente.fechaUltimaActuacion,
              ),
              numActuaciones: fuente.numActuaciones || 0,
              fuente: 'PublicacionesProcesales',
              tipoFuente: 'PublicacionesProcesales',
              estado: fuente.estado,
              esProcesoPrincipal: fuente.esProcesoPrincipal,
            };
            resultado.publicacionesProcesales.push(actuacionData);
          }
        }
      }

      // 3. SI UNIFICADA ESTÁ VACÍA, buscar en otras fuentes
      if (resultado.unificada.length === 0) {
        this.logger.log(
          `[FALLBACK] Unificada vacía, buscando en otras fuentes...`,
        );

        for (const fuente of expediente.procesosEnFuentesDatos) {
          if (!fuente.activo || !fuente.idProceso) continue;

          const tipoFuente = (fuente.tipoFuente || '').toLowerCase();

          if (
            tipoFuente === 'unificada' ||
            tipoFuente === 'publicacionesprocesales'
          ) {
            continue;
          }

          try {
            this.logger.log(
              `[FALLBACK] Intentando obtener de ${tipoFuente.toUpperCase()}`,
            );

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

            this.logger.log(
              `[FALLBACK] ${tipoFuente.toUpperCase()}: ${
                actuaciones.length
              } actuaciones encontradas`,
            );
          } catch (error) {
            this.logger.error(
              `[FALLBACK] Error obteniendo ${tipoFuente}: ${error.message}`,
            );
          }
        }
      }

      // 4. Combinar todas las fuentes
      const todas = [
        ...resultado.unificada,
        ...resultado.publicacionesProcesales,
        ...resultado.otras,
      ];

      // 5. Eliminar duplicados
      const mapaUnicos = new Map();
      for (const act of todas) {
        const clave = `${act.textoActuacion || act.actuacion}-${
          act.fechaActuacion || act.fechaDeActuacion
        }`;
        if (!mapaUnicos.has(clave)) {
          mapaUnicos.set(clave, act);
        }
      }
      const sinDuplicados = Array.from(mapaUnicos.values());

      // 6. Ordenar por fecha
      resultado.combinadas = sinDuplicados.sort((a, b) => {
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

      // 7. Si no se encontró fecha en las fuentes, usar la de la actuación más reciente
      if (!resultado.fechaUltimaActuacion && resultado.combinadas.length > 0) {
        const primeraActuacion = resultado.combinadas[0];
        const fechaActuacion =
          primeraActuacion.fechaActuacion || primeraActuacion.fechaDeActuacion;

        if (fechaActuacion) {
          const fechaParsed = this.parsearFecha(fechaActuacion);
          if (fechaParsed) {
            resultado.fechaUltimaActuacion = `${String(
              fechaParsed.getDate(),
            ).padStart(2, '0')}/${String(fechaParsed.getMonth() + 1).padStart(
              2,
              '0',
            )}/${fechaParsed.getFullYear()}`;
            this.logger.log(
              `[FECHA] Tomada de actuación más reciente: ${resultado.fechaUltimaActuacion}`,
            );
          }
        }
      }

      this.logger.log(
        `[ACTUACIONES] Expediente ${idExpediente}: ` +
          `Unificada=${resultado.unificada.length}, ` +
          `PublicacionesProcesales=${resultado.publicacionesProcesales.length}, ` +
          `Otras=${resultado.otras.length}, ` +
          `Total=${resultado.combinadas.length}, ` +
          `FechaReciente=${resultado.fechaUltimaActuacion}`,
      );

      return resultado;
    } catch (error) {
      this.logger.error(
        `Error en getActuacionesTodasLasFuentes: ${error.message}`,
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
      this.logger.error(`Error normalizando fecha: ${error.message}`);
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
        this.logger.error(`Error en página ${pagina}: ${error.message}`);
        tieneMasDatos = false;
      }
    }

    this.logger.log(
      `[EXPEDIENTES] Total obtenidos: ${todosLosExpedientes.length}`,
    );
    return todosLosExpedientes;
  }
}
