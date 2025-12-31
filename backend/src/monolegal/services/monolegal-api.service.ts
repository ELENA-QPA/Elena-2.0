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
      this.logger.log(`Obteniendo expediente ${idExpediente}`);

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

      if (!procesos || procesos.length === 0) {
        this.logger.warn(`No se encontraron procesos para ${numeroRadicado}`);
        return [];
      }

      const procesoSeleccionado = procesos.reduce((mejor, actual) => {
        return (actual.totalActuaciones || 0) > (mejor.totalActuaciones || 0)
          ? actual
          : mejor;
      }, procesos[0]);

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

      //this.logger.log(`Actuaciones obtenidas: ${actuaciones.length}`);
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
      //this.logger.log(`Obteniendo actuaciones para idProceso: ${idProceso}`);

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

      // this.logger.log(`Actuaciones obtenidas: ${actuaciones.length}`);
      return actuaciones;
    } catch (error) {
      this.logger.error('Error obteniendo actuaciones:', error.message);
      return [];
    }
  }
}
