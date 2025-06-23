import { Usuario } from './usuario.entity';
import { IBaseRepository } from '../../shared/interfaces/base-repository.interface';

export interface IUsuarioRepository extends IBaseRepository<Usuario> {
  crear(usuario: Usuario): Promise<Usuario>;
  obtenerPorEmail(email: string): Promise<Usuario | null>;
  actualizar(id: string, usuario: Usuario): Promise<Usuario>;
  eliminar(id: string): Promise<void>;
} 