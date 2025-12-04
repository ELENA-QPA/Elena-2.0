import type { Profile } from "../interface/profile.interface";

// Adaptador para respuestas de perfil
export function mapProfileApiToModel(api: any): Profile {
  try {
    // Log de depuración para ver la forma exacta que llega del backend
    // Nota: mantener en desarrollo; eliminar/ajustar en producción si es necesario
    // eslint-disable-next-line no-console
    console.log('[PROFILE_ADAPTER][mapProfileApiToModel] raw keys:', api ? Object.keys(api) : 'api=null');

    // Algunos backends envían { user: {...} } y otros el objeto directo {...}
    const raw = api?.user ?? api ?? {};

  const id = String(raw.id ?? raw._id ?? raw.userId ?? raw.uid ?? '');
  const email = String(raw.email ?? '');

  const fullNameFromFields = [raw.name, raw.lastname].filter(Boolean).join(' ').trim();
  const fullName = String((raw.fullName ?? fullNameFromFields ?? '').trim());

  const role = String(raw.role ?? (Array.isArray(raw.roles) && raw.roles.length > 0 ? raw.roles[0] : '') ?? '');
    const team = String(raw.team ?? (Array.isArray(raw.entidad) && raw.entidad.length > 0 ? raw.entidad[0] : '') ?? '');
    const isActive = typeof raw.isActive === 'boolean' ? raw.isActive : (typeof raw.is_active === 'boolean' ? raw.is_active : true);

  const phone = String(raw.phone ?? '');
  const name = String(raw.name ?? '');
  const lastname = String(raw.lastname ?? '');

  const mapped = { id, email, fullName, isActive, role, team, phone, name, lastname };
    // eslint-disable-next-line no-console
    console.log('[PROFILE_ADAPTER][mapProfileApiToModel] mapped:', mapped);
  return mapped as Profile;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[PROFILE_ADAPTER][mapProfileApiToModel] error:', e);
  return { id: '', email: '', fullName: '', isActive: true, role: '', team: '' } as Profile;
  }
}
