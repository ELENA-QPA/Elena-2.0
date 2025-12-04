import { User } from "./user.interface";

export interface Team {
  id: string;
  name: string;
  members: User[];
  totalMembers: number;
}

export interface UpdateTeamMemberBody {
  email: string;
  roles: string[];
  group_admin: string;
}

export interface RemoveTeamMemberBody {
  email: string;
}
