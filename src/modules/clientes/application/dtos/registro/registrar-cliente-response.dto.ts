import { Marca } from '@prisma/client';
import { TipoAuto, PreferenciaContacto } from '@prisma/client';
import { ClienteHttpResponseSafe } from '../../../application/interfaces/cliente-http.interface';

export class RegistrarClienteResponseDto implements ClienteHttpResponseSafe {
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
  message?: string;
}
