export enum UserRole {
  ADMINISTRADOR = "Administrador",
  ASISTENTE_LEGAL = "lawyer",
}

export const isValidUserRole = (role: string): role is UserRole => {
  return Object.values(UserRole).includes(role as UserRole);
};

export enum UserRoleComposite {
  ANALISTA_SENIOR = "analista_senior",
}

export const USER_ROLES = Object.values(UserRole);
export const USER_ROLES_COMPOSITE = Object.values(UserRoleComposite);

export const COMPOSITE_ROLE_MAPPING: Record<UserRoleComposite, UserRole[]> = {
  [UserRoleComposite.ANALISTA_SENIOR]: [
    UserRole.ADMINISTRADOR,
    UserRole.ASISTENTE_LEGAL,
  ],
};

export const USER_ROLE_LABELS = {
  [UserRole.ADMINISTRADOR]: "Administrador",
  [UserRole.ASISTENTE_LEGAL]: "Asistente Legal",
  [UserRoleComposite.ANALISTA_SENIOR]: "Analista Senior",
};

export const ALL_SELECTABLE_ROLES = [...USER_ROLES, ...USER_ROLES_COMPOSITE];

export const getUserRoleLabel = (role: string): string => {
  return USER_ROLE_LABELS[role as UserRole | UserRoleComposite] || role;
};

export const getRolesArray = (selectedRole: string): string[] => {
  const role = selectedRole as UserRole | UserRoleComposite;

  if (role in COMPOSITE_ROLE_MAPPING) {
    return COMPOSITE_ROLE_MAPPING[role as UserRoleComposite];
  }

  return [role];
};

export const getSelectableRoleFromArray = (roles: string[]): string => {
  if (!roles || roles.length === 0) return "";

  if (roles.length === 1) return roles[0];

  const rolesSet = new Set(roles);

  // Verificar "Analista Senior" (Administrador + lawyer)
  const analistaSeniorRoles = new Set(["Administrador", "lawyer"]);
  if (
    rolesSet.size === analistaSeniorRoles.size &&
    [...rolesSet].every((role) => analistaSeniorRoles.has(role))
  ) {
    return "analista_senior";
  }

  // Si no coincide con ningún rol compuesto conocido, devolver el primero
  return roles[0];
};
