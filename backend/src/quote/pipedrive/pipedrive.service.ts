import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { PipedriveItemType } from './dto/pipedrive-search.dto';

@Injectable()
export class PipedriveService {
  private readonly client: AxiosInstance;
  private readonly logger = new Logger(PipedriveService.name);
  private fieldDefinitionsCache: Map<string, Record<string, string>> =
    new Map();
  private fieldOptionsCache: Map<string, Record<string, Record<number, string>>> =
    new Map();

  constructor(private readonly configService: ConfigService) {
    this.client = axios.create({
      baseURL: 'https://api.pipedrive.com/v1',
      headers: {
        'x-api-token': this.configService.get<string>('PIPEDRIVE_TOKEN'),
        'Content-Type': 'application/json',
      },
    });
  }

  async getDataBySearch(
    searchTerm: string,
    typeSearch: string[] = ['organization', 'person'],
  ) {
    try {
      const params = new URLSearchParams({
        term: searchTerm,
        exact_match: 'false',
        limit: '100',
      });
      typeSearch.forEach((type) => params.append('item_types', type));

      const { data } = await this.client.get(
        `/itemSearch?${params.toString()}`,
      );

      return data.data.items.map(({ item }: any) => ({
        id: item.id,
        type: item.type,
        name: item.name,
        email: item.type === 'person' ? item.emails?.[0] ?? null : null,
        organization: item.type === 'person' ? item.organization?.name ?? null : null,
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          this.logger.error(
            `Pipedrive API error | status: ${
              error.response.status
            } | data: ${JSON.stringify(error.response.data)}`,
          );
        } else if (error.request) {
          this.logger.error(`No response from Pipedrive | ${error.message}`);
        }
      } else {
        this.logger.error(`Unexpected error | ${String(error)}`);
      }

      throw error;
    }
  }

  private async getFieldKeysByName(
    type: 'organization' | 'person',
  ): Promise<Record<string, string>> {
    if (this.fieldDefinitionsCache.has(type)) {
      return this.fieldDefinitionsCache.get(type);
    }

    const endpoint =
      type === 'organization' ? '/organizationFields' : '/personFields';

    const { data } = await this.client.get(endpoint);

    const fieldMap: Record<string, string> = {};
    const optionsMap: Record<string, Record<number, string>> = {};

    for (const field of data.data) {
      fieldMap[field.name] = field.key;
      if (field.options?.length) {
        optionsMap[field.name] = Object.fromEntries(
          field.options.map((o: any) => [o.id, o.label]),
        );
      }
    }

    this.fieldDefinitionsCache.set(type, fieldMap);
    this.fieldOptionsCache.set(type, optionsMap);
    return fieldMap;
  }

  private resolveOptionLabel(
    type: 'organization' | 'person',
    fieldName: string,
    optionId: number,
  ): string | null {
    return this.fieldOptionsCache.get(type)?.[fieldName]?.[optionId] ?? null;
  }

  private async getOrganizationDetail(id: number) {
    const { data } = await this.client.get(`/organizations/${id}`);

    return data.data;
  }

  private async getPersonDetail(id: number) {
    const { data } = await this.client.get(`/persons/${id}`);

    return data.data;
  }

  private async getOrganizationFirtsPerson(orgId: number) {
    const { data } = await this.client.get(`/organizations/${orgId}/persons`);

    const persons = data.data ?? [];
    return persons.length > 0 ? persons[0] : null;
  }

  async getQuoteFormData(id: number, type: PipedriveItemType) {
    let org: any = null;
    let orgFields: Record<string, string> = {};
    let person: any = null;

    if (type === PipedriveItemType.ORGANIZATION) {
      [org, orgFields] = await Promise.all([
        this.getOrganizationDetail(id),
        this.getFieldKeysByName('organization'),
      ]);
      person = await this.getOrganizationFirtsPerson(id);
    } else {
      person = await this.getPersonDetail(id);
      const orgId = person.org_id?.value ?? person.org_id;

      if (orgId) {
        [org, orgFields] = await Promise.all([
          this.getOrganizationDetail(orgId),
          this.getFieldKeysByName('organization'),
        ]);
      }
    }

    return {
      // Empresa
      companyName: org?.name ?? null,
      nit: org ? org[orgFields['Nit']] ?? null : null,
      industry: org
        ? this.resolveOptionLabel('organization', 'Industry', org[orgFields['Industry']]) ?? null
        : null,
      totalWorkers: org ? org[orgFields['Number of employees']] ?? null : null,
      productionWorkers: org
        ? org[orgFields['Number of production employees']] ?? null
        : null,

      // Contacto
      contactName: person?.name ?? null,
      contactPosition: person?.job_title ?? null,
      email: person?.email?.[0]?.value ?? null,
      phones: person?.phone?.map((p: any) => p.value) ?? [],

      // IDs de referencia
      pipedriveOrgId: org?.id ?? null,
      pipedrivePersonId: person?.id ?? null,
    };
  }
}
