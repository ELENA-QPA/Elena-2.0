// Adaptador para respuestas de equipo
export function mapTeamApiToModel(apiResponse: any[]) {
  // La API devuelve un array directo de miembros, no un objeto con team
  console.log('[TEAM_ADAPTER] API Response:', apiResponse);
  
  return {
    id: 'team-' + Date.now(), // ID temporal para el equipo
    name: 'Mi Equipo',
    members: apiResponse || [], // El array directo de miembros
    totalMembers: apiResponse?.length || 0,
  };
}
