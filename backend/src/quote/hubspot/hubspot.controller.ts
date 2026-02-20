import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { HubspotService } from './hubspot.service';
import { HubspotSearchDto } from './dto/hubspot-search.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('QUANTA - HubSpot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('hubspot')
export class HubspotController {
  constructor(private readonly hubspotService: HubspotService) {}

  @Get('companies/search')
  @ApiOperation({ summary: 'Buscar empresas en HubSpot por nombre' })
  searchCompanies(@Query() dto: HubspotSearchDto) {
    return this.hubspotService.searchCompanies(dto.query, dto.limit);
  }

  @Get('contacts/search')
  @ApiOperation({ summary: 'Buscar contactos en HubSpot por nombre o email' })
  searchContacts(@Query() dto: HubspotSearchDto) {
    return this.hubspotService.searchContacts(dto.query, dto.limit);
  }

  @Get('deals/search')
  @ApiOperation({ summary: 'Buscar deals en HubSpot por nombre' })
  searchDeals(@Query() dto: HubspotSearchDto) {
    return this.hubspotService.searchDeals(dto.query, dto.limit);
  }

  @Get('autocomplete')
  @ApiOperation({
    summary: 'Autocompletar formulario de cotización desde HubSpot',
    description: 'Dado un companyId y contactId retorna todos los campos para el formulario',
  })
  getQuoteFormData(
    @Query('companyId') companyId: string,
    @Query('contactId') contactId: string,
  ) {
    return this.hubspotService.getQuoteFormData(companyId, contactId);
  }

  @Get('companies/:id')
  @ApiOperation({ summary: 'Obtener detalle de empresa por ID de HubSpot' })
  @ApiParam({ name: 'id', description: 'HubSpot Company ID' })
  getCompany(@Param('id') id: string) {
    return this.hubspotService.getCompanyById(id);
  }

  @Get('contacts/:id')
  @ApiOperation({ summary: 'Obtener detalle de contacto por ID de HubSpot' })
  @ApiParam({ name: 'id', description: 'HubSpot Contact ID' })
  getContact(@Param('id') id: string) {
    return this.hubspotService.getContactById(id);
  }
}