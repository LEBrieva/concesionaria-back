import { ClienteToPrismaMapper } from './cliente-to-prisma.mapper';
import { Cliente } from '../../domain/cliente.entity';
import { PreferenciaContacto, Marca, TipoAuto } from '@prisma/client';

describe('ClienteToPrismaMapper', () => {
  const prismaMockData = {
    id: '123',
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan@example.com',
    telefono: '123456789',
    fechaNacimiento: new Date('1990-01-01'),
    password: 'hashedPassword',
    emailVerificado: true,
    tokenVerificacion: 'token123',
    rangoPresupuestoMin: 10000,
    rangoPresupuestoMax: 50000,
    marcasInteres: [Marca.TOYOTA, Marca.HONDA],
    tipoAutoInteres: [TipoAuto.SEDAN, TipoAuto.SUV],
    suscritoNewsletter: true,
    aceptaMarketing: true,
    preferenciaContacto: PreferenciaContacto.EMAIL,
    ultimaActividad: new Date('2024-01-01'),
    totalVistasAutos: 10,
    totalClicksAutos: 5,
    totalConsultas: 2,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-12-31'),
    active: true,
  };

  describe('toDomain', () => {
    it('debe mapear un cliente de Prisma a entidad de dominio', () => {
      const result = ClienteToPrismaMapper.toDomain(prismaMockData);

      expect(result).toBeInstanceOf(Cliente);
      expect(result.id).toBe(prismaMockData.id);
      expect(result.nombre).toBe(prismaMockData.nombre);
      expect(result.apellido).toBe(prismaMockData.apellido);
      expect(result.email).toBe(prismaMockData.email);
      expect(result.telefono).toBe(prismaMockData.telefono);
      expect(result.fechaNacimiento).toEqual(prismaMockData.fechaNacimiento);
      expect(result.password).toBe(prismaMockData.password);
      expect(result.emailVerificado).toBe(prismaMockData.emailVerificado);
      expect(result.tokenVerificacion).toBe(prismaMockData.tokenVerificacion);
      expect(result.rangoPresupuestoMin).toBe(
        prismaMockData.rangoPresupuestoMin,
      );
      expect(result.rangoPresupuestoMax).toBe(
        prismaMockData.rangoPresupuestoMax,
      );
      expect(result.marcasInteres).toEqual(prismaMockData.marcasInteres);
      expect(result.tipoAutoInteres).toEqual(prismaMockData.tipoAutoInteres);
      expect(result.suscritoNewsletter).toBe(prismaMockData.suscritoNewsletter);
      expect(result.aceptaMarketing).toBe(prismaMockData.aceptaMarketing);
      expect(result.preferenciaContacto).toBe(
        prismaMockData.preferenciaContacto,
      );
      expect(result.ultimaActividad).toEqual(prismaMockData.ultimaActividad);
      expect(result.totalVistasAutos).toBe(prismaMockData.totalVistasAutos);
      expect(result.totalClicksAutos).toBe(prismaMockData.totalClicksAutos);
      expect(result.totalConsultas).toBe(prismaMockData.totalConsultas);
      expect(result.createdAt).toEqual(prismaMockData.createdAt);
      expect(result.updatedAt).toEqual(prismaMockData.updatedAt);
      expect(result.active).toBe(prismaMockData.active);
    });

    it('debe manejar valores null correctamente', () => {
      const prismaDataConNulls = {
        ...prismaMockData,
        telefono: null,
        fechaNacimiento: null,
        password: null,
        tokenVerificacion: null,
        rangoPresupuestoMin: null,
        rangoPresupuestoMax: null,
      };

      const result = ClienteToPrismaMapper.toDomain(prismaDataConNulls);

      expect(result.telefono).toBeNull();
      expect(result.fechaNacimiento).toBeNull();
      expect(result.password).toBeNull();
      expect(result.tokenVerificacion).toBeNull();
      expect(result.rangoPresupuestoMin).toBeNull();
      expect(result.rangoPresupuestoMax).toBeNull();
    });

    it('debe calcular el nombre completo correctamente', () => {
      const result = ClienteToPrismaMapper.toDomain(prismaMockData);
      expect(result.nombreCompleto).toBe('Juan Pérez');
    });
  });

  describe('toPrisma', () => {
    it('debe mapear una entidad de dominio a datos de Prisma para crear', () => {
      const cliente = new Cliente(prismaMockData);
      const result = ClienteToPrismaMapper.toPrisma(cliente);

      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('updatedAt');

      expect(result.nombre).toBe(cliente.nombre);
      expect(result.apellido).toBe(cliente.apellido);
      expect(result.email).toBe(cliente.email);
      expect(result.telefono).toBe(cliente.telefono);
      expect(result.fechaNacimiento).toEqual(cliente.fechaNacimiento);
      expect(result.password).toBe(cliente.password);
      expect(result.emailVerificado).toBe(cliente.emailVerificado);
      expect(result.tokenVerificacion).toBe(cliente.tokenVerificacion);
      expect(result.rangoPresupuestoMin).toBe(cliente.rangoPresupuestoMin);
      expect(result.rangoPresupuestoMax).toBe(cliente.rangoPresupuestoMax);
      expect(result.marcasInteres).toEqual(cliente.marcasInteres);
      expect(result.tipoAutoInteres).toEqual(cliente.tipoAutoInteres);
      expect(result.suscritoNewsletter).toBe(cliente.suscritoNewsletter);
      expect(result.aceptaMarketing).toBe(cliente.aceptaMarketing);
      expect(result.preferenciaContacto).toBe(cliente.preferenciaContacto);
      expect(result.ultimaActividad).toEqual(cliente.ultimaActividad);
      expect(result.totalVistasAutos).toBe(cliente.totalVistasAutos);
      expect(result.totalClicksAutos).toBe(cliente.totalClicksAutos);
      expect(result.totalConsultas).toBe(cliente.totalConsultas);
      expect(result.active).toBe(cliente.active);
    });

    it('debe convertir undefined a null para campos opcionales', () => {
      const cliente = new Cliente({
        id: '456',
        nombre: 'María',
        apellido: 'González',
        email: 'maria@example.com',
        telefono: undefined,
        fechaNacimiento: undefined,
        password: undefined,
        tokenVerificacion: undefined,
        rangoPresupuestoMin: undefined,
        rangoPresupuestoMax: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        active: true,
      });

      const result = ClienteToPrismaMapper.toPrisma(cliente);

      expect(result.telefono).toBeNull();
      expect(result.fechaNacimiento).toBeNull();
      expect(result.password).toBeNull();
      expect(result.tokenVerificacion).toBeNull();
      expect(result.rangoPresupuestoMin).toBeNull();
      expect(result.rangoPresupuestoMax).toBeNull();
    });
  });

  describe('toPrismaUpdate', () => {
    it('debe mapear solo campos definidos para actualización', () => {
      const clienteParcial = {
        nombre: 'Juan Carlos',
        apellido: 'Pérez García',
        telefono: '987654321',
        suscritoNewsletter: false,
      };

      const result = ClienteToPrismaMapper.toPrismaUpdate(clienteParcial);

      expect(result).toEqual({
        nombre: 'Juan Carlos',
        apellido: 'Pérez García',
        telefono: '987654321',
        suscritoNewsletter: false,
      });

      expect(result).not.toHaveProperty('email');
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('fechaNacimiento');
    });

    it('debe excluir campos con valor undefined no definidos', () => {
      const clienteParcial = {
        telefono: undefined,
        fechaNacimiento: undefined,
        rangoPresupuestoMin: undefined,
      };

      const result = ClienteToPrismaMapper.toPrismaUpdate(clienteParcial);

      // El mapper no incluye campos undefined, por lo que el resultado debe ser un objeto vacío
      expect(result).toEqual({});
      expect(result).not.toHaveProperty('telefono');
      expect(result).not.toHaveProperty('fechaNacimiento');
      expect(result).not.toHaveProperty('rangoPresupuestoMin');
    });

    it('debe manejar actualización completa de todos los campos', () => {
      const clienteCompleto = new Cliente(prismaMockData);
      const result = ClienteToPrismaMapper.toPrismaUpdate(clienteCompleto);

      expect(Object.keys(result)).toContain('nombre');
      expect(Object.keys(result)).toContain('apellido');
      expect(Object.keys(result)).toContain('email');
      expect(Object.keys(result)).toContain('telefono');
      expect(Object.keys(result)).toContain('fechaNacimiento');
      expect(Object.keys(result)).toContain('password');
      expect(Object.keys(result)).toContain('emailVerificado');
      expect(Object.keys(result)).toContain('tokenVerificacion');
      expect(Object.keys(result)).toContain('rangoPresupuestoMin');
      expect(Object.keys(result)).toContain('rangoPresupuestoMax');
      expect(Object.keys(result)).toContain('marcasInteres');
      expect(Object.keys(result)).toContain('tipoAutoInteres');
      expect(Object.keys(result)).toContain('suscritoNewsletter');
      expect(Object.keys(result)).toContain('aceptaMarketing');
      expect(Object.keys(result)).toContain('preferenciaContacto');
      expect(Object.keys(result)).toContain('ultimaActividad');
      expect(Object.keys(result)).toContain('totalVistasAutos');
      expect(Object.keys(result)).toContain('totalClicksAutos');
      expect(Object.keys(result)).toContain('totalConsultas');
      expect(Object.keys(result)).toContain('active');
    });

    it('debe devolver objeto vacío si no hay campos definidos', () => {
      const result = ClienteToPrismaMapper.toPrismaUpdate({});
      expect(result).toEqual({});
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('debe manejar campos de tipo array correctamente', () => {
      const clienteParcial = {
        marcasInteres: [Marca.FORD, Marca.CHEVROLET],
        tipoAutoInteres: [TipoAuto.COUPE],
      };

      const result = ClienteToPrismaMapper.toPrismaUpdate(clienteParcial);

      expect(result.marcasInteres).toEqual([Marca.FORD, Marca.CHEVROLET]);
      expect(result.tipoAutoInteres).toEqual([TipoAuto.COUPE]);
    });

    it('debe manejar campos booleanos correctamente', () => {
      const clienteParcial = {
        emailVerificado: false,
        suscritoNewsletter: true,
        aceptaMarketing: false,
        active: true,
      };

      const result = ClienteToPrismaMapper.toPrismaUpdate(clienteParcial);

      expect(result.emailVerificado).toBe(false);
      expect(result.suscritoNewsletter).toBe(true);
      expect(result.aceptaMarketing).toBe(false);
      expect(result.active).toBe(true);
    });

    it('debe manejar campos de fecha correctamente', () => {
      const fecha = new Date('2024-06-15');
      const clienteParcial = {
        fechaNacimiento: fecha,
        ultimaActividad: fecha,
      };

      const result = ClienteToPrismaMapper.toPrismaUpdate(clienteParcial);

      expect(result.fechaNacimiento).toEqual(fecha);
      expect(result.ultimaActividad).toEqual(fecha);
    });
  });
});
