import { IUser } from "../interfaces/user.interface";

export const userAdapter = (user: any): IUser => ({
  id: user.userId,
  nombre: user.firstName, // Varchar(50) - Nombre del usuario
  apellido: user.lastName, // Varchar(50) - Apellido del usuario
  email: user.email, // Varchar(250) - Correo electrónico del usuario
  telefono: user.phone, // Varchar(250) - Teléfono del usuario
  role: user.role,
  creadoEn: new Date(user.createdAt), // DateTime - Fecha de registro del usuario
});
