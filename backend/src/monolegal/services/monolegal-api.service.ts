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

@Injectable()
export class MonolegalApiService {
  private readonly logger = new Logger(MonolegalApiService.name);
  private readonly baseUrl = 'https://apiexpedientedigital.monolegal.co/api';
  private token: string | null = null;
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

      this.logger.log('Iniciando login en Monolegal...');

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
   * @param fecha - Formato YYYYMMDD (ej: 20251212)
   */
  async getResumenCambios(fecha: string): Promise<ResumenCambios> {
    const token = await this.login();

    try {
      this.logger.log(`Obteniendo resumen de cambios para ${fecha}`);

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
   * @param fecha - Formato YYYYMMDD
   * @param pagina - Número de página (empieza en 0)
   */
  async getDetalleCambios(
    fecha: string,
    pagina: number = 0,
  ): Promise<CambioDetalle[]> {
    const token = await this.login();

    try {
      this.logger.log(
        `Obteniendo detalle de cambios - Fecha: ${fecha}, Página: ${pagina}`,
      );

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
}
