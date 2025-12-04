export interface IUser {
  id?: string;
  idUsuario?: number; // Int (autoincremental) - PK
  nombre?: string; // Varchar(50) - Nombre del usuario
  apellido?: string; // Varchar(50) - Apellido del usuario
  name?: string; // Nombre alternativo del localStorage
  lastname?: string; // Apellido alternativo del localStorage
  email: string; // Varchar(250) - Correo electrónico del usuario
  contrasena?: string; // Varchar(250) - Contraseña del usuario
  telefono?: string; // Varchar(250) - Teléfono del usuario
  codigoVerificacion?: string;
  estaVerificado?: boolean;
  role?: string; // Enum de tipos de usuario (formato string)
  rol?: string[]; // Enum de tipos de usuario (formato array del localStorage)
  roles?: string[]; // Enum de tipos de usuario (formato array del backend)
  token?: string; // JWT token
  entidad?: any[]; // Entidades asociadas
  creadoEn?: Date; // DateTime - Fecha de registro del usuario
}
