const CLIENT_TYPE_MAPPINGS: Record<string, string> = {
  rappi: 'Rappi SAS',
  'rappi s.a.s': 'Rappi SAS',
  'rappi s.a.s.': 'Rappi SAS',
  'rappi sas': 'Rappi SAS',
  'rappi s.a': 'Rappi SAS',
  'rappy s.a.s': 'Rappi SAS',
  'rappy s.a.s.': 'Rappi SAS',
  'r a p p i s.a.s.': 'Rappi SAS',
  'r a p p i s.a.s': 'Rappi SAS',

  uber: 'Uber',
  didi: 'DiDi',
  ifood: 'iFood',
  beat: 'Beat',
};

export function normalizeClientType(clientType: string | null | undefined): string {
  if (!clientType) {
    return '';
  }
  
  const normalized = clientType.toLowerCase().trim();

  if (CLIENT_TYPE_MAPPINGS[normalized]) {
    return CLIENT_TYPE_MAPPINGS[normalized];
  }

  if (normalized.includes('rappi') || normalized.includes('rappy')) {
    return 'Rappi SAS';
  }

  return clientType.trim();
}