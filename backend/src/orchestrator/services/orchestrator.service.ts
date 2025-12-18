
import { Injectable, Logger } from '@nestjs/common';
import { RecordsService } from 'src/records/records.service';
import { RecordAdapter } from '../adapters/record.adapter';
import { RecordAdaptedResponse } from '../interfaces/record-adapted.interface';
import { IdRecordDto, InternalCodeDto } from '../dto/records-service.dto';
import { CreateOrchestratorDto } from '../dto/create-orchestrator.dto';
import { UpdateOrchestratorDto } from '../dto/update-orchestrator.dto';

@Injectable()
export class OrchestratorService {

  private readonly logger = new Logger(OrchestratorService.name);

  constructor(
    private readonly recordsService: RecordsService,
    private readonly recordAdapter: RecordAdapter,
  ) {}
  
  create(createOrchestratorDto: CreateOrchestratorDto) {
    return 'This action adds a new orchestrator';
  }

  findAll() {
    return `This action returns all orchestrator`;
  }

  findOne(id: number) {
    return `This action returns a #${id} orchestrator`;
  }

  update(id: number, updateOrchestratorDto: UpdateOrchestratorDto) {
    return `This action updates a #${id} orchestrator`;
  }

  remove(id: number) {
    return `This action removes a #${id} orchestrator`;
  }

  async getRecordByInternalCode(
    dto: InternalCodeDto,
  ): Promise<RecordAdaptedResponse> {
    try {

      const recordResponse = await this.recordsService
        .getRecordDetailsByInternalCode(dto);

      const adaptedResponse = this.recordAdapter.adapt(recordResponse);

      return adaptedResponse;
    } catch (error) {
      this.logger.error(
        `Error en orquestación de record: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getInternalCodeById(dto: IdRecordDto): Promise<InternalCodeDto> {
    try {
      const result = await this.recordsService.getInternalCodeById(dto);
      return result;

    } catch (error) {
      this.logger.error(
        `Error en orquestación para obtener internalCode: ${error.message}`,
        error.stack,
      );
      throw error;
    }}

}
