export enum UserRole {
  ADMINISTRADOR = "Administrador",
  ASISTENTE_LEGAL = "Asistente Legal",
  ANALISTA_LEGAL_I = "Analista legal I",
  ANALISTA_LEGAL_II = "Analista legal II",
  ANALISTA_LEGAL_III = "Analista legal III",
}

export const USER_ROLES = Object.values(UserRole);

export const USER_ROLE_LABELS = {
  [UserRole.ADMINISTRADOR]: "Administrador",
  [UserRole.ASISTENTE_LEGAL]: "Asistente Legal",
  [UserRole.ANALISTA_LEGAL_I]: "Analista Legal I",
  [UserRole.ANALISTA_LEGAL_II]: "Analista Legal II",
  [UserRole.ANALISTA_LEGAL_III]: "Analista Legal III",
};

// Función helper para validar roles
export const isValidUserRole = (role: string): role is UserRole => {
  return Object.values(UserRole).includes(role as UserRole);
};

// Función helper para obtener el label de un rol
export const getUserRoleLabel = (role: string): string => {
  return USER_ROLE_LABELS[role as UserRole] || role;
};
