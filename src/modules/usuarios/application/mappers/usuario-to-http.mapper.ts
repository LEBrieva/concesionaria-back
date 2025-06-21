import { Usuario } from '../../domain/usuario.entity';
import { CrearUsuarioResponseDto } from '../dtos/usuarios/crear/crear-usuario-response.dto';

export class UsuarioToHttpMapper {
  static toCrearUsuarioResponse(usuario: Usuario): CrearUsuarioResponseDto {
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      telefono: usuario.telefono,
      rol: usuario.rol,
      active: usuario.active,
    };
  }
} 