import { BaseProps } from 'src/modules/shared/interfaces/base-props.interface';

export interface UsuarioProps extends BaseProps {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono?: string;
} 