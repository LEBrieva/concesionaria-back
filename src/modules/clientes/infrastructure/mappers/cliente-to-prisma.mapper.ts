import { Cliente as PrismaCliente } from '@prisma/client';
import { Cliente } from '../../domain/cliente.entity';

export class ClienteToPrismaMapper {
  static toDomain(prismaCliente: PrismaCliente): Cliente {
    return new Cliente({
      id: prismaCliente.id,
      nombre: prismaCliente.nombre,
      apellido: prismaCliente.apellido,
      email: prismaCliente.email,
      telefono: prismaCliente.telefono,
      fechaNacimiento: prismaCliente.fechaNacimiento,
      password: prismaCliente.password,
      emailVerificado: prismaCliente.emailVerificado,
      tokenVerificacion: prismaCliente.tokenVerificacion,
      rangoPresupuestoMin: prismaCliente.rangoPresupuestoMin,
      rangoPresupuestoMax: prismaCliente.rangoPresupuestoMax,
      marcasInteres: prismaCliente.marcasInteres,
      tipoAutoInteres: prismaCliente.tipoAutoInteres,
      suscritoNewsletter: prismaCliente.suscritoNewsletter,
      aceptaMarketing: prismaCliente.aceptaMarketing,
      preferenciaContacto: prismaCliente.preferenciaContacto,
      ultimaActividad: prismaCliente.ultimaActividad,
      totalVistasAutos: prismaCliente.totalVistasAutos,
      totalClicksAutos: prismaCliente.totalClicksAutos,
      totalConsultas: prismaCliente.totalConsultas,
      createdAt: prismaCliente.createdAt,
      updatedAt: prismaCliente.updatedAt,
      active: prismaCliente.active,
    });
  }

  static toPrisma(
    cliente: Cliente,
  ): Omit<PrismaCliente, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      email: cliente.email,
      telefono: cliente.telefono ?? null,
      fechaNacimiento: cliente.fechaNacimiento ?? null,
      password: cliente.password ?? null,
      emailVerificado: cliente.emailVerificado,
      tokenVerificacion: cliente.tokenVerificacion ?? null,
      rangoPresupuestoMin: cliente.rangoPresupuestoMin ?? null,
      rangoPresupuestoMax: cliente.rangoPresupuestoMax ?? null,
      marcasInteres: cliente.marcasInteres,
      tipoAutoInteres: cliente.tipoAutoInteres,
      suscritoNewsletter: cliente.suscritoNewsletter,
      aceptaMarketing: cliente.aceptaMarketing,
      preferenciaContacto: cliente.preferenciaContacto,
      ultimaActividad: cliente.ultimaActividad,
      totalVistasAutos: cliente.totalVistasAutos,
      totalClicksAutos: cliente.totalClicksAutos,
      totalConsultas: cliente.totalConsultas,
      active: cliente.active,
    };
  }

  static toPrismaUpdate(cliente: Partial<Cliente>): Partial<PrismaCliente> {
    const updateData: Partial<PrismaCliente> = {};

    if (cliente.nombre !== undefined) updateData.nombre = cliente.nombre;
    if (cliente.apellido !== undefined) updateData.apellido = cliente.apellido;
    if (cliente.email !== undefined) updateData.email = cliente.email;
    if (cliente.telefono !== undefined) updateData.telefono = cliente.telefono;
    if (cliente.fechaNacimiento !== undefined)
      updateData.fechaNacimiento = cliente.fechaNacimiento;
    if (cliente.password !== undefined) updateData.password = cliente.password;
    if (cliente.emailVerificado !== undefined)
      updateData.emailVerificado = cliente.emailVerificado;
    if (cliente.tokenVerificacion !== undefined)
      updateData.tokenVerificacion = cliente.tokenVerificacion;
    if (cliente.rangoPresupuestoMin !== undefined)
      updateData.rangoPresupuestoMin = cliente.rangoPresupuestoMin;
    if (cliente.rangoPresupuestoMax !== undefined)
      updateData.rangoPresupuestoMax = cliente.rangoPresupuestoMax;
    if (cliente.marcasInteres !== undefined)
      updateData.marcasInteres = cliente.marcasInteres;
    if (cliente.tipoAutoInteres !== undefined)
      updateData.tipoAutoInteres = cliente.tipoAutoInteres;
    if (cliente.suscritoNewsletter !== undefined)
      updateData.suscritoNewsletter = cliente.suscritoNewsletter;
    if (cliente.aceptaMarketing !== undefined)
      updateData.aceptaMarketing = cliente.aceptaMarketing;
    if (cliente.preferenciaContacto !== undefined)
      updateData.preferenciaContacto = cliente.preferenciaContacto;
    if (cliente.ultimaActividad !== undefined)
      updateData.ultimaActividad = cliente.ultimaActividad;
    if (cliente.totalVistasAutos !== undefined)
      updateData.totalVistasAutos = cliente.totalVistasAutos;
    if (cliente.totalClicksAutos !== undefined)
      updateData.totalClicksAutos = cliente.totalClicksAutos;
    if (cliente.totalConsultas !== undefined)
      updateData.totalConsultas = cliente.totalConsultas;
    if (cliente.active !== undefined) updateData.active = cliente.active;

    return updateData;
  }
}
