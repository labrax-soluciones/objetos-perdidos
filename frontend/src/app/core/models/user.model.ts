export interface User {
  id: number;
  email: string;
  nombre: string;
  apellidos?: string;
  telefono?: string;
  dni?: string;
  tipo: UserType;
  ayuntamiento?: {
    id: number;
    nombre: string;
  };
  emailVerificado: boolean;
  roles: string[];
}

export type UserType = 'CIUDADANO' | 'ADMIN_MUNICIPAL' | 'ADMIN_EXTERNO' | 'LOGISTICA' | 'SUPERADMIN';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nombre: string;
  apellidos?: string;
  telefono?: string;
  dni?: string;
}
