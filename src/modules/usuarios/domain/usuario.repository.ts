import { Usuario } from './usuario.entity';

export abstract class UsuarioRepository {
  abstract crear(usuario: Usuario): Promise<Usuario>;
  abstract obtenerPorId(id: string): Promise<Usuario | null>;
  abstract obtenerPorEmail(email: string): Promise<Usuario | null>;
  abstract obtenerTodos(): Promise<Usuario[]>;
  abstract actualizar(id: string, usuario: Usuario): Promise<Usuario>;
  abstract eliminar(id: string): Promise<void>;
} 