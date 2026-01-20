import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CreatePerfomanceDto,
  PerformanceType,
} from './dto/create-perfomance.dto';
import { UpdatePerfomanceDto } from './dto/update-perfomance.dto';
import { Performance } from './entities/perfomance.entity';
import { PerformanceStateService } from './services/performance-state.service';
import { PerformanceAuditService } from './services/performance-audit.service';
import { RecordStateTypeService } from './services/record-state-type.service';

@Injectable()
export class PerfomanceService {
  constructor(
    @InjectModel(Performance.name)
    private perfomanceModel: Model<Performance>,
    @InjectModel('Record')
    private recordModel: Model<any>,
    private performanceStateService: PerformanceStateService,
    private performanceAuditService: PerformanceAuditService,
    private recordStateTypeService: RecordStateTypeService,
  ) {}

  async create(createPerfomanceDto: CreatePerfomanceDto): Promise<any> {
    try {
      // // Obtener el estado actual del expediente
      // const record = await this.recordModel.findById(createPerfomanceDto.record);
      // if (!record) {
      //   throw new NotFoundException(`Expediente con ID ${createPerfomanceDto.record} no encontrado`);
      // }

      // const currentState = record.estado as PerformanceType;
      const newState = createPerfomanceDto.performanceType;

      // // Si se especifica un tipo de performance, validar la transición
      // if (newState) {
      //   // Obtener todos los estados previos del expediente para validación completa
      //   const currentPerformances = await this.findByRecord(createPerfomanceDto.record);
      //   const allPreviousStates: PerformanceType[] = currentPerformances.map(p => p.performanceType as PerformanceType);

      //   // Incluir el estado actual del record si no está en las performances
      //   if (currentState && !allPreviousStates.includes(currentState)) {
      //     allPreviousStates.push(currentState);
      //   }

      //   // Validar la transición
      //   this.performanceStateService.validateTransition(allPreviousStates, newState);

      // // Registrar el intento de cambio de estado en auditoría
      // this.performanceAuditService.logStateChange({
      //   recordId: createPerfomanceDto.record,
      //   fromState: currentState,
      //   toState: newState,
      //   responsible: createPerfomanceDto.responsible,
      //   observation: createPerfomanceDto.observation,
      //   timestamp: new Date()
      // });
      // }

      // Si el campo document está presente, incluirlo en la creación
      const perfomanceData: any = { ...createPerfomanceDto };
      if (createPerfomanceDto.document) {
        perfomanceData.document = createPerfomanceDto.document;
      }

      // Crear la nueva actuación
      const createdPerfomance = await this.perfomanceModel.create(
        perfomanceData,
      );
      // const savedPerformance = await createdPerfomance.save() as Performance;

      // Actualizar el estado del expediente si se especificó un nuevo estado
      if (newState) {
        // Determinar el tipo de estado basado en el nuevo estado
        const newStateType =
          this.recordStateTypeService.getTipoEstadoFromEstado(newState);

        const updateResult = await this.recordModel.findByIdAndUpdate(
          createPerfomanceDto.record,
          {
            estado: newState,
            type: newStateType,
            updatedAt: new Date(),
          },
          { new: true },
        );
      }
      return createdPerfomance;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      // Registrar error en auditoría si hay información suficiente
      if (createPerfomanceDto.record && createPerfomanceDto.performanceType) {
        this.performanceAuditService.logInvalidTransition(
          createPerfomanceDto.record,
          [], // No tenemos los estados actuales aquí debido al error
          createPerfomanceDto.performanceType,
          createPerfomanceDto.responsible,
        );
      }

      throw new BadRequestException(
        'Error al crear la actuación: ' + error.message,
      );
    }
  }

  // -----------------------------------------------------
  /**
   * Crea un performance sin validar el record (para usar dentro de transacciones)
   * @param createPerfomanceDto Datos del performance a crear
   * @param session Sesión de la transacción (opcional)
   * @returns Performance creado
   */
  async createWithoutValidation(
    createPerfomanceDto: CreatePerfomanceDto,
    session?: any,
  ): Promise<any> {
    try {
      // Crear la nueva actuación sin validar el record
      const createdPerfomance = new this.perfomanceModel(createPerfomanceDto);

      // Si hay sesión, usar la sesión para guardar
      const savedPerformance = session
        ? await createdPerfomance.save({ session })
        : await createdPerfomance.save();

      return savedPerformance;
    } catch (error) {
      throw new BadRequestException(
        'Error al crear la actuación: ' + error.message,
      );
    }
  }

  // -----------------------------------------------------
  async findByRecord(recordId: string) {
    return await this.perfomanceModel.find({
      record: recordId,
      deletedAt: { $exists: false },
    });
  }

  async findByRecords(recordIds: string[]) {
    return this.perfomanceModel
      .find({
        record: { $in: recordIds },
        deletedAt: { $exists: false },
      })
      .lean()
      .exec();
  }
  // -----------------------------------------------------
  async update(
    id: string,
    updatePerfomanceDto: UpdatePerfomanceDto,
  ): Promise<any> {
    const updatedPerfomance = await this.perfomanceModel
      .findByIdAndUpdate(id, updatePerfomanceDto, { new: true })
      .populate('record');

    if (!updatedPerfomance) {
      throw new NotFoundException(`Performance record with ID ${id} not found`);
    }
    return updatedPerfomance;
  }
  // -----------------------------------------------------

  async remove(id: string): Promise<void> {
    const deletedAt = new Date();
    const result = await this.perfomanceModel
      .findByIdAndUpdate(id, { deletedAt }, { new: true })
      .exec();
    if (!result) {
      throw new NotFoundException(`Performance record with ID ${id} not found`);
    }
  }

  async getMetrics(userId?: string): Promise<any> {
    const matchStage = userId ? { user: userId } : {};

    return this.perfomanceModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          averageValue: { $avg: '$value' },
          totalRecords: { $sum: 1 },
          maxValue: { $max: '$value' },
          minValue: { $min: '$value' },
        },
      },
    ]);
  }

  // ============== MÉTODOS PARA MANEJO DE ESTADOS ==============

  /**
   * Obtiene los estados actuales de un expediente específico
   * @param recordId ID del expediente
   * @returns Array de estados actuales
   */
  async getCurrentStates(recordId: string): Promise<PerformanceType[]> {
    const performances = await this.findByRecord(recordId);
    return performances
      .map((p) => p.performanceType as PerformanceType)
      .filter((state) => state); // Filtrar estados nulos o undefined
  }

  /**
   * Obtiene los próximos estados válidos para un expediente
   * @param recordId ID del expediente
   * @returns Array de estados válidos para la siguiente transición
   */
  async getValidNextStates(recordId: string): Promise<PerformanceType[]> {
    const currentStates = await this.getCurrentStates(recordId);
    return this.performanceStateService.getValidNextStates(currentStates);
  }

  /**
   * Valida si se puede agregar un estado específico a un expediente
   * @param recordId ID del expediente
   * @param newState Nuevo estado a validar
   * @returns boolean indicando si es válida la transición
   */
  async canTransitionToState(
    recordId: string,
    newState: PerformanceType,
  ): Promise<boolean> {
    const currentStates = await this.getCurrentStates(recordId);
    return this.performanceStateService.isValidTransition(
      currentStates,
      newState,
    );
  }

  /**
   * Obtiene el historial completo de estados de un expediente con información adicional
   * @param recordId ID del expediente
   * @returns Historial de estados con metadatos
   */
  async getStateHistory(recordId: string): Promise<any[]> {
    const performances = await this.perfomanceModel
      .find({ record: recordId })
      .sort({ createdAt: 1 })
      .exec();

    return performances.map((performance) => ({
      id: performance._id,
      state: performance.performanceType,
      responsible: performance.responsible,
      observation: performance.observation,
      createdAt: performance.createdAt,
      description: this.performanceStateService.getTransitionDescription(
        performance.performanceType as PerformanceType,
      ),
      isFinalState: this.performanceStateService.isFinalState(
        performance.performanceType as PerformanceType,
      ),
    }));
  }

  /**
   * Obtiene el estado actual principal de un expediente desde el record
   * @param recordId ID del expediente
   * @returns El estado actual del record
   */
  async getCurrentMainState(recordId: string): Promise<PerformanceType | null> {
    const record = await this.recordModel.findById(recordId).exec();
    return record ? (record.estado as PerformanceType) : null;
  }

  /**
   * Obtiene el estado actual desde el record con información adicional
   * @param recordId ID del expediente
   * @returns Información completa del estado actual
   */
  async getRecordCurrentState(recordId: string): Promise<any> {
    const record = await this.recordModel.findById(recordId).exec();
    if (!record) {
      throw new NotFoundException(
        `Expediente con ID ${recordId} no encontrado`,
      );
    }

    const currentState = record.estado as PerformanceType;
    const currentType = record.type;
    const isFinalState = currentState
      ? this.performanceStateService.isFinalState(currentState)
      : false;
    const validNextStates = currentState
      ? this.performanceStateService.getValidNextStates([currentState])
      : [];
    const isActive = currentType === 'ACTIVO';

    return {
      recordId,
      currentState,
      currentType,
      isActive,
      isFinalState,
      validNextStates,
      lastUpdated: record.updatedAt || record.createdAt,
      stateDescription: currentState
        ? this.performanceStateService.getTransitionDescription(currentState)
        : null,
    };
  }

  /**
   * Verifica si un expediente está en un estado final
   * @param recordId ID del expediente
   * @returns boolean indicando si está en estado final
   */
  async isInFinalState(recordId: string): Promise<boolean> {
    const currentState = await this.getCurrentMainState(recordId);
    if (!currentState) return false;

    return this.performanceStateService.isFinalState(currentState);
  }

  /**
   * Obtiene estadísticas de estados para reportes
   * @param filters Filtros opcionales
   * @returns Estadísticas de estados
   */
  async getStateStatistics(filters?: any): Promise<any> {
    const matchStage = { ...filters };

    return this.perfomanceModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$performanceType',
          count: { $sum: 1 },
          lastUpdated: { $max: '$createdAt' },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);
  }

  /**
   * Obtiene estadísticas de demandas radicadas agrupadas por mes
   * @param year Año para consultar (por defecto año actual)
   * @returns Estadísticas de demandas radicadas por mes
   */
  async getDemandasRadicadasPorMes(year: number): Promise<any> {
    // Fechas del año especificado
    const startOfYear = new Date(year, 0, 1); // 1 de enero
    const endOfYear = new Date(year, 11, 31, 23, 59, 59); // 31 de diciembre

    // Nombres de los meses en español
    const nombresMeses = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];

    // Agregación para obtener las demandas radicadas por mes
    const metrics = await this.perfomanceModel.aggregate([
      {
        $match: {
          performanceType: 'RADICADO',
          createdAt: {
            $gte: startOfYear,
            $lte: endOfYear,
          },
        },
      },
      {
        $group: {
          _id: {
            mes: { $month: '$createdAt' },
            año: { $year: '$createdAt' },
          },
          cantidadRadicadas: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.mes': 1 },
      },
    ]);

    // Calcular el total de demandas radicadas en el año
    const total = metrics.reduce(
      (totalAcc, item) => totalAcc + item.cantidadRadicadas,
      0,
    );

    // Crear array con todos los meses del año (incluso si no hay datos)
    const metric = [];
    for (let mes = 1; mes <= 12; mes++) {
      const monthData = metrics.find((item) => item._id.mes === mes);
      const count = monthData ? monthData.cantidadRadicadas : 0;

      metric.push({
        month: mes,
        monthName: nombresMeses[mes - 1],
        count,
      });
    }

    return {
      year,
      total,
      metric,
      resumen: {
        mesMayorActividad: metric.reduce((max, mes) =>
          mes.count > max.count ? mes : max,
        ),
        promedioPorMes: Math.round((total / 12) * 100) / 100,
        mesesSinActividad: metric.filter((mes) => mes.count === 0).length,
      },
    };
  }

  /**
   * Obtiene el flujo completo de estados disponible
   * @returns Información completa del flujo de estados
   */
  getStateFlow(): any {
    return this.performanceStateService.getStateFlow();
  }

  /**
   * Actualiza el campo 'document' en todas las actuaciones Performance donde falte o sea null
   * @returns Resultado de la actualización masiva
   */
  async updateFields() {
    // Actualiza solo actuaciones donde el campo 'document' esté vacío o null
    return await this.perfomanceModel.updateMany(
      { $or: [{ document: { $exists: false } }, { document: null }] },
      {
        $set: { document: null },
      },
    );
  }
}
