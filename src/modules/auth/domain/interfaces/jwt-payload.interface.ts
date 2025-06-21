export interface JwtPayload {
  sub: string; // ID del usuario
  email: string;
  nombre: string;
  iat?: number; // issued at
  exp?: number; // expiration time
} 