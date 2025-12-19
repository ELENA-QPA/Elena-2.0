
import { Injectable, Logger } from '@nestjs/common';
import { RecordsService } from 'src/records/records.service';
import { RecordAdapter } from '../adapters/record.adapter';
import { RecordAdaptedResponse } from '../interfaces/record-adapted.interface';
import { IdLawyerDto, IdRecordDto, InternalCodeDto } from '../dto/records-service.dto';
import { AudienceService } from 'src/audience/services/audience.service';
import { AudienceResponse } from 'src/audience/interfaces/audience.interfaces';
import { AudienceOrchestratorResponse } from '../interfaces/audience.interface';

@Injectable()
export class OrchestratorService {

  private readonly logger = new Logger(OrchestratorService.name);

  constructor(
    private readonly audienceService: AudienceService,
    private readonly recordsService: RecordsService,
    private readonly recordAdapter: RecordAdapter,
  ) {}

  findAll() {
    return `This action returns all orchestrator`;
  }

  findOne(id: number) {
    return `This action returns a #${id} orchestrator`;
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

  async getRecordById(dto:IdRecordDto):Promise<RecordAdaptedResponse>{
    const internalCodeDto:InternalCodeDto = await this.getInternalCodeById(dto);
    const record = await this.getRecordByInternalCode(internalCodeDto);
    return record;

  }
  async buildAudienceResponce(audienceResponse: AudienceResponse) : Promise<AudienceOrchestratorResponse>{ 
    const recordIdDto:IdRecordDto = { id: audienceResponse.audience.record };
    const recordResponse:RecordAdaptedResponse = await this.getRecordById(recordIdDto);
    return {
        ...audienceResponse,
        record: recordResponse.record,
        };

  }

  async getFilteresAudiences(query):Promise<AudienceOrchestratorResponse[]>{
    try {
      const audiences = await this.audienceService.findAll(query);

      const audiencesResponse = await Promise.all(
        audiences.map(audience =>
          this.buildAudienceResponce(audience)
        )
      );

      return audiencesResponse;
    } catch (error) {
      throw error;
    }
  }
  
  async getAllAudiences(): Promise<AudienceOrchestratorResponse[]> {
    try {
      const query = { is_valid: 'true' };
      const audiencesResponse = await this.getFilteresAudiences(query);
      return audiencesResponse;
    } catch (error) {
      throw error;
    }
  }

  async getAudienceByLawyer(lawyerDto:IdLawyerDto): Promise<AudienceOrchestratorResponse[]> {
    try{
      const query = {
        is_valid: true,
        lawyer: lawyerDto.lawyer,
      };
      const audiencesResponse = await this.getFilteresAudiences(query);
      return audiencesResponse;
    } catch (error){
      throw error;
    }
  }

}
