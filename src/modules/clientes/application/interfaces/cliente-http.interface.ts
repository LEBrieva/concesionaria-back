import { Marca } from '@prisma/client';
import { TipoAuto, PreferenciaContacto } from '@prisma/client';

export interface ClienteHttpResponse {
  id: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  email: string;
  telefono?: string | null;
  fechaNacimiento?: Date | null;
  emailVerificado: boolean;
  rangoPresupuestoMin?: number | null;
  rangoPresupuestoMax?: number | null;
  marcasInteres: Marca[];
  tipoAutoInteres: TipoAuto[];
  suscritoNewsletter: boolean;
  aceptaMarketing: boolean;
  preferenciaContacto: PreferenciaContacto;
  ultimaActividad: Date;
  totalVistasAutos: number;
  totalClicksAutos: number;
  totalConsultas: number;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

export interface ClienteHttpResponseWithSensitive extends ClienteHttpResponse {
  password?: string | null | undefined;
  tokenVerificacion?: string | null | undefined;
}

export type ClienteHttpResponseSafe = Omit<
  ClienteHttpResponseWithSensitive,
  'password' | 'tokenVerificacion'
>;
