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

export function normalizeClientType(
  clientType: string | undefined | null,
): string {
  if (!clientType) return '';

  const cleaned = clientType.trim().toLowerCase().replace(/\s+/g, ' ');

  if (CLIENT_TYPE_MAPPINGS[cleaned]) {
    return CLIENT_TYPE_MAPPINGS[cleaned];
  }

  if (cleaned.includes('rappi') || cleaned.includes('rappy')) {
    return 'Rappi SAS';
  }

  return clientType.trim();
}
