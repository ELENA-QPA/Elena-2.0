export enum UserRoleBase {
  ADMINISTRADOR = "Administrador",
  LAWYER = "lawyer",
}
export enum UserRole {
  ADMINISTRATOR = "administrator",
  LEGAL_ASSISTANT = "legal_assistant",
  LEGAL_ANALYST_II = "legal_analyst_ii",
}

export const isValidUserRole = (role: string): role is UserRole => {
  return Object.values(UserRole).includes(role as UserRole);
};

export const USER_ROLES = Object.values(UserRole);

export const ROLE_TO_BASE_MAPPING: Record<UserRole, string[]> = {
  [UserRole.ADMINISTRATOR]: [UserRoleBase.ADMINISTRADOR],
  [UserRole.LEGAL_ASSISTANT]: [UserRoleBase.LAWYER],
  [UserRole.LEGAL_ANALYST_II]: [
    UserRoleBase.LAWYER,
    UserRoleBase.ADMINISTRADOR,
  ],
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMINISTRATOR]: "Administrator",
  [UserRole.LEGAL_ASSISTANT]: "Legal Assistant",
  [UserRole.LEGAL_ANALYST_II]: "Legal Analyst II",
};

export const ALL_SELECTABLE_ROLES = USER_ROLES;

export const getUserRoleLabel = (role: string): string => {
  return USER_ROLE_LABELS[role as UserRole] || role;
};

export const getRolesArray = (selectedRole: string): string[] => {
  if (selectedRole in ROLE_TO_BASE_MAPPING) {
    return ROLE_TO_BASE_MAPPING[selectedRole as UserRole];
  }
  return [selectedRole];
};
export const getSelectableRoleFromArray = (roles: string[]): string => {
  if (!roles || roles.length === 0) return "";

  // Buscar coincidencia exacta en el mapeo
  const rolesSet = new Set(roles);

  for (const [selectableRole, baseRoles] of Object.entries(
    ROLE_TO_BASE_MAPPING
  )) {
    const baseSet = new Set(baseRoles);

    // Verificar si los sets son idénticos
    if (
      rolesSet.size === baseSet.size &&
      [...rolesSet].every((role) => baseSet.has(role))
    ) {
      return selectableRole;
    }
  }

  // Si no hay coincidencia exacta, devolver el primer rol
  return roles[0];
};
