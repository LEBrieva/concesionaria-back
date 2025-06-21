import { BaseEntity } from 'src/modules/shared/entities/base.entity';
import { UsuarioProps } from './usuario.interfaces';
import { RolUsuario } from './usuario.enum';

export class Usuario extends BaseEntity {
  private readonly props: UsuarioProps;

  public readonly nombre: string;
  public readonly apellido: string;
  public readonly email: string;
  public readonly password: string;
  public readonly telefono?: string;
  public readonly rol: RolUsuario;

  constructor(props: UsuarioProps) {
    const { nombre, apellido, email, password, telefono, rol } = props;
    super(props);
    this.props = props;

    this.nombre = nombre;
    this.apellido = apellido;
    this.email = email;
    this.password = password;
    this.telefono = telefono;
    this.rol = rol;

    this.validarDominio();
  }

  private validarDominio(): void {
    if (!this.nombre || this.nombre.trim().length === 0) {
      throw new Error('El nombre es requerido');
    }

    if (!this.apellido || this.apellido.trim().length === 0) {
      throw new Error('El apellido es requerido');
    }

    if (!this.email || this.email.trim().length === 0) {
      throw new Error('El email es requerido');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      throw new Error('El formato del email no es válido');
    }

    if (!this.password || this.password.trim().length === 0) {
      throw new Error('La contraseña es requerida');
    }

    if (this.password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }

    if (!this.rol || !Object.values(RolUsuario).includes(this.rol)) {
      throw new Error('El rol del usuario es requerido y debe ser válido');
    }
  }

  actualizarCon(props: Partial<UsuarioProps>): Usuario {
    return new Usuario({
      ...this.props,
      ...props,
      updatedAt: new Date(),
    });
  }
} 