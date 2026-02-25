import { Controller, Get, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PipedriveDetailDto } from './dto/pipedrive-detail-query.dto';
import { SearchByTermDto } from './dto/pipedrive-search.dto';
import { PipedriveService } from './pipedrive.service';

@ApiTags('QUANTA - Pipedrive')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pipedrive')
export class PipedriveController {
  constructor(private readonly pipeDriveService: PipedriveService) {}

  @Get('search')
  @ApiOperation({ summary: 'Buscar personas u organizaciones en PipeDrive' })
  @UsePipes(new ValidationPipe({ transform: true }))
  getDataBySearch(@Query() dto: SearchByTermDto) {
    return this.pipeDriveService.getDataBySearch(
      dto.searchTerm,
      dto.item_types,
    );
  }

  @Get('detail')
  @ApiOperation({ summary: 'Obtener datos del formulario desde un item de PipeDrive' })
  @UsePipes(new ValidationPipe({ transform: true }))
  getQuoteFormData(@Query() dto: PipedriveDetailDto) {
    return this.pipeDriveService.getQuoteFormData(dto.id, dto.type);
  }
}
