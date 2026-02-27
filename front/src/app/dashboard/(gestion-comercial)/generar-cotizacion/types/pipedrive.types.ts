export interface IPipeDriveSearchResult {
  id: number;
  type: 'organization' | 'person';
  name: string;
  email: string | null;
  organization: string | null;
}

export interface IPipeDriveDetail {
  companyName: string;
  nit: number;
  industry: string;
  totalWorkers: number;
  productionWorkers: number;
  contactName: string;
  contactPosition: string | null;
  email: string;
  phones: string[];
  pipedriveOrgId: number;
  pipedrivePersonId: number;
}