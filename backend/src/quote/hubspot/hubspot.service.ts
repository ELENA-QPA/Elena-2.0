import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class HubspotService {
  private readonly logger = new Logger(HubspotService.name);
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.client = axios.create({
      baseURL: 'https://api.hubapi.com',
      headers: {
        Authorization: `Bearer ${this.configService.get<string>('HUBSPOT_TOKEN')}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async search(objectType: string, query: string, properties: string[], limit = 10) {
    try {
      const { data } = await this.client.post(`/crm/v3/objects/${objectType}/search`, {
        query,
        limit,
        properties,
      });
      return data.results ?? [];
    } catch (error) {
      this.logger.error(`HubSpot search error [${objectType}]: ${(error as any).message}`);
      this.logger.error(`Response: ${JSON.stringify((error as any).response?.data)}`);
      throw new InternalServerErrorException(`Error al buscar en HubSpot: ${objectType}`);
    }
  }

  private async getById(objectType: string, id: string, properties: string[]) {
    try {
      const { data } = await this.client.get(
        `/crm/v3/objects/${objectType}/${id}?properties=${properties.join(',')}`,
      );
      return data;
    } catch (error) {
      this.logger.error(`HubSpot getById error [${objectType}/${id}]: ${(error as any).message}`);
      throw new InternalServerErrorException(`Error al obtener ${objectType} de HubSpot`);
    }
  }

  // ─── Empresas ─────────────────────────────────────────────────────────────

  async searchCompanies(query: string, limit = 10) {
    const results = await this.search(
      'companies',
      query,
      ['name', 'domain', 'industry', 'phone', 'city'],
      limit,
    );

    return results.map((r: any) => ({
      hubspotCompanyId: r.id,
      companyName: r.properties.name,
      domain: r.properties.domain,
      industry: r.properties.industry,
      phone: r.properties.phone,
      city: r.properties.city,
    }));
  }

  async getCompanyById(id: string) {
    const r = await this.getById('companies', id, [
      'name',
      'domain',
      'industry',
      'phone',
      'city',
      'zip',
    ]);

    return {
      hubspotCompanyId: r.id,
      companyName: r.properties.name,
      domain: r.properties.domain,
      industry: r.properties.industry,
      phone: r.properties.phone,
      city: r.properties.city,
    };
  }

  // ─── Contactos ────────────────────────────────────────────────────────────

  async searchContacts(query: string, limit = 10) {
    const results = await this.search(
      'contacts',
      query,
      ['firstname', 'lastname', 'email', 'phone', 'jobtitle', 'company'],
      limit,
    );

    return results.map((r: any) => ({
      hubspotContactId: r.id,
      contactName: `${r.properties.firstname ?? ''} ${r.properties.lastname ?? ''}`.trim(),
      email: r.properties.email,
      phone: r.properties.phone,
      contactPosition: r.properties.jobtitle,
      company: r.properties.company,
    }));
  }

  async getContactById(id: string) {
    const r = await this.getById('contacts', id, [
      'firstname',
      'lastname',
      'email',
      'phone',
      'jobtitle',
      'company',
    ]);

    return {
      hubspotContactId: r.id,
      contactName: `${r.properties.firstname ?? ''} ${r.properties.lastname ?? ''}`.trim(),
      email: r.properties.email,
      phone: r.properties.phone,
      contactPosition: r.properties.jobtitle,
      company: r.properties.company,
    };
  }

  // ─── Deals ────────────────────────────────────────────────────────────────

  async searchDeals(query: string, limit = 10) {
    const results = await this.search(
      'deals',
      query,
      ['dealname', 'amount', 'dealstage', 'closedate'],
      limit,
    );

    return results.map((r: any) => ({
      hubspotDealId: r.id,
      dealName: r.properties.dealname,
      amount: r.properties.amount,
      dealStage: r.properties.dealstage,
      closeDate: r.properties.closedate,
    }));
  }

  // ─── Autocompletar formulario ─────────────────────────────────────────────

  /**
   * Dado un companyId y contactId, retorna todos los campos
   * necesarios para autocompletar el formulario de cotización
   */
  async getQuoteFormData(hubspotCompanyId: string, hubspotContactId: string) {
    const [company, contact] = await Promise.all([
      this.getCompanyById(hubspotCompanyId),
      this.getContactById(hubspotContactId),
    ]);

    return {
      // Cliente
      hubspotCompanyId: company.hubspotCompanyId,
      hubspotContactId: contact.hubspotContactId,
      companyName: company.companyName,
      industry: company.industry,
      // Contacto
      contactName: contact.contactName,
      contactPosition: contact.contactPosition,
      email: contact.email,
      phones: [contact.phone ?? '', company.phone ?? ''].filter(Boolean),
    };
  }
}