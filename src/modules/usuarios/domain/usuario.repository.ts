import { Usuario } from './usuario.entity';

export interface IUsuarioRepository {
  crear(usuario: Usuario): Promise<Usuario>;
  obtenerPorId(id: string): Promise<Usuario | null>;
  obtenerPorEmail(email: string): Promise<Usuario | null>;
  obtenerTodos(): Promise<Usuario[]>;
  actualizar(id: string, usuario: Usuario): Promise<Usuario>;
  eliminar(id: string): Promise<void>;
} 