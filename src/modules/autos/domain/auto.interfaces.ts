import { BaseProps } from 'src/modules/shared/interfaces/base-props.interface';
import { Color, EstadoAuto, Transmision, Marca } from './auto.enum';

export interface AutoProps extends BaseProps {
  nombre: string;
  descripcion: string;
  observaciones: string;
  matricula: string;
  marca: Marca;
  modelo: string;
  version: string;
  ano: number;
  kilometraje: number;
  precio: number;
  costo: number;
  transmision: Transmision;
  estado: EstadoAuto;
  color: Color;
  imagenes: string[];
  equipamientoDestacado: string[];
  caracteristicasGenerales: string[];
  exterior: string[];
  confort: string[];
  seguridad: string[];
  interior: string[];
  entretenimiento: string[];
  esFavorito: boolean;
}
