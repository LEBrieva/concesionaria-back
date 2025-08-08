import { Cliente } from '../../domain/cliente.entity';
import {
  ClienteHttpResponseWithSensitive,
  ClienteHttpResponseSafe,
} from '../interfaces/cliente-http.interface';

export class ClienteToHttpMapper {
  static toHttp(cliente: Cliente): ClienteHttpResponseWithSensitive {
    return {
      id: cliente.id,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      nombreCompleto: cliente.nombreCompleto,
      email: cliente.email,
      telefono: cliente.telefono,
      fechaNacimiento: cliente.fechaNacimiento,
      emailVerificado: cliente.emailVerificado,
      rangoPresupuestoMin: cliente.rangoPresupuestoMin,
      rangoPresupuestoMax: cliente.rangoPresupuestoMax,
      marcasInteres: cliente.marcasInteres,
      tipoAutoInteres: cliente.tipoAutoInteres,
      suscritoNewsletter: cliente.suscritoNewsletter,
      aceptaMarketing: cliente.aceptaMarketing,
      preferenciaContacto: cliente.preferenciaContacto,
      ultimaActividad: cliente.ultimaActividad,
      totalVistasAutos: cliente.totalVistasAutos,
      totalClicksAutos: cliente.totalClicksAutos,
      totalConsultas: cliente.totalConsultas,
      createdAt: cliente.createdAt,
      updatedAt: cliente.updatedAt,
      active: cliente.active,
    };
  }

  static toHttpWithoutSensitive(cliente: Cliente): ClienteHttpResponseSafe {
    return {
      id: cliente.id,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      nombreCompleto: cliente.nombreCompleto,
      email: cliente.email,
      telefono: cliente.telefono,
      fechaNacimiento: cliente.fechaNacimiento,
      emailVerificado: cliente.emailVerificado,
      rangoPresupuestoMin: cliente.rangoPresupuestoMin,
      rangoPresupuestoMax: cliente.rangoPresupuestoMax,
      marcasInteres: cliente.marcasInteres,
      tipoAutoInteres: cliente.tipoAutoInteres,
      suscritoNewsletter: cliente.suscritoNewsletter,
      aceptaMarketing: cliente.aceptaMarketing,
      preferenciaContacto: cliente.preferenciaContacto,
      ultimaActividad: cliente.ultimaActividad,
      totalVistasAutos: cliente.totalVistasAutos,
      totalClicksAutos: cliente.totalClicksAutos,
      totalConsultas: cliente.totalConsultas,
      createdAt: cliente.createdAt,
      updatedAt: cliente.updatedAt,
      active: cliente.active,
    };
  }

  static toHttpList(clientes: Cliente[]): ClienteHttpResponseSafe[] {
    return clientes.map((cliente) =>
      ClienteToHttpMapper.toHttpWithoutSensitive(cliente),
    );
  }
}
