export enum UserRole {
  ADMINISTRADOR = "Administrador",
  ASISTENTE_LEGAL = "lawyer",
}

export const USER_ROLES = Object.values(UserRole);

export const USER_ROLE_LABELS = {
  [UserRole.ADMINISTRADOR]: "Administrador",
  [UserRole.ASISTENTE_LEGAL]: "Asistente Legal",
};

// Función helper para validar roles
export const isValidUserRole = (role: string): role is UserRole => {
  return Object.values(UserRole).includes(role as UserRole);
};

// Función helper para obtener el label de un rol
export const getUserRoleLabel = (role: string): string => {
  return USER_ROLE_LABELS[role as UserRole] || role;
};
