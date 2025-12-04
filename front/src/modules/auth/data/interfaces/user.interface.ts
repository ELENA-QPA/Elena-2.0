export interface User {
  _id: string; // ✅ CORREGIDO: La API usa _id, no id
  email?: string;
  phone?: string;
  password?: string;
  roles?: string[];
  name?: string;
  lastname?: string;
  isActive?: boolean; // ✅ NUEVO: Campo de la API
  entidad?: any[]; // ✅ NUEVO: Campo de la API
  group_admin?: string; // ✅ NUEVO: Campo de la API
  createdAt?: string; // ✅ NUEVO: Campo de la API
  he_leido?: boolean; // ✅ NUEVO: Campo de la API
}

export interface UpdateUserBody {
  email?: string;
  phone?: string;
  password?: string;
  roles?: string[];
  name?: string;
  lastname?: string;
  he_leido?: boolean;
}
