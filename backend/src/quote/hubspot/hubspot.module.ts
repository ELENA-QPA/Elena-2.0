import { Module } from '@nestjs/common';
import { HubspotService } from './hubspot.service';
import { HubspotController } from './hubspot.controller';

@Module({
  controllers: [HubspotController],
  providers: [HubspotService],
  exports: [HubspotService],
})
export class HubspotModule {}