import { Module } from '@nestjs/common';
import { PipedriveService } from './pipedrive.service';
import { PipedriveController } from './pipedrive.controller';

@Module({
  providers: [PipedriveService],
  controllers: [PipedriveController]
})
export class PipedriveModule {}
