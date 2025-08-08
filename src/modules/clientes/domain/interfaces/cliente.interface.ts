import { Marca } from '@prisma/client';
import { PreferenciaContacto, TipoAuto } from '@prisma/client';

export interface ClienteProps {
  id?: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string | null;
  fechaNacimiento?: Date | null;
  password?: string | null;
  emailVerificado?: boolean;
  tokenVerificacion?: string | null;
  rangoPresupuestoMin?: number | null;
  rangoPresupuestoMax?: number | null;
  marcasInteres?: Marca[];
  tipoAutoInteres?: TipoAuto[];
  suscritoNewsletter?: boolean;
  aceptaMarketing?: boolean;
  preferenciaContacto?: PreferenciaContacto;
  ultimaActividad?: Date;
  totalVistasAutos?: number;
  totalClicksAutos?: number;
  totalConsultas?: number;
  createdAt?: Date;
  updatedAt?: Date;
  active?: boolean;
}

export interface ClienteFilters {
  nombre?: string;
  apellido?: string;
  email?: string;
  emailVerificado?: boolean;
  suscritoNewsletter?: boolean;
  aceptaMarketing?: boolean;
  marcasInteres?: Marca[];
  tipoAutoInteres?: TipoAuto[];
  rangoPresupuestoMin?: number;
  rangoPresupuestoMax?: number;
  tokenVerificacion?: string;
  active?: boolean;
}
