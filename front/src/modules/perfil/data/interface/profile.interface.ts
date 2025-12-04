export interface Profile {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  role: string;
  team?: string;
  phone?: string;
  name?: string;
  lastname?: string;
}

export interface UpdateProfileBody {
  email?: string;
  phone?: string;
  password?: string;
  roles?: string[];
  name?: string;
  lastname?: string;
  he_leido?: boolean;
}
