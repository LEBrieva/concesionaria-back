import { BaseEntity } from 'src/modules/shared/entities/base.entity';
import { UsuarioProps } from './usuario.interfaces';

export class Usuario extends BaseEntity {
  private readonly props: UsuarioProps;

  public readonly nombre: string;
  public readonly apellido: string;
  public readonly email: string;
  public readonly telefono?: string;

  constructor(props: UsuarioProps) {
    const { nombre, apellido, email, telefono } = props;
    super(props);
    this.props = props;

    this.nombre = nombre;
    this.apellido = apellido;
    this.email = email;
    this.telefono = telefono;

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

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      throw new Error('El formato del email no es válido');
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