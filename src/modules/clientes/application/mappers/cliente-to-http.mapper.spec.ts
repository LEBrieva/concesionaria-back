import { ClienteToHttpMapper } from './cliente-to-http.mapper';
import { Cliente } from '../../domain/cliente.entity';
import { PreferenciaContacto, Marca, TipoAuto } from '@prisma/client';

describe('ClienteToHttpMapper', () => {
  const clienteMock = new Cliente({
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
  });

  describe('toHttp', () => {
    it('debe mapear cliente a respuesta HTTP con información sensible', () => {
      const result = ClienteToHttpMapper.toHttp(clienteMock);

      expect(result).toEqual({
        id: clienteMock.id,
        nombre: clienteMock.nombre,
        apellido: clienteMock.apellido,
        nombreCompleto: clienteMock.nombreCompleto,
        email: clienteMock.email,
        telefono: clienteMock.telefono,
        fechaNacimiento: clienteMock.fechaNacimiento,
        emailVerificado: clienteMock.emailVerificado,
        rangoPresupuestoMin: clienteMock.rangoPresupuestoMin,
        rangoPresupuestoMax: clienteMock.rangoPresupuestoMax,
        marcasInteres: clienteMock.marcasInteres,
        tipoAutoInteres: clienteMock.tipoAutoInteres,
        suscritoNewsletter: clienteMock.suscritoNewsletter,
        aceptaMarketing: clienteMock.aceptaMarketing,
        preferenciaContacto: clienteMock.preferenciaContacto,
        ultimaActividad: clienteMock.ultimaActividad,
        totalVistasAutos: clienteMock.totalVistasAutos,
        totalClicksAutos: clienteMock.totalClicksAutos,
        totalConsultas: clienteMock.totalConsultas,
        createdAt: clienteMock.createdAt,
        updatedAt: clienteMock.updatedAt,
        active: clienteMock.active,
      });
    });

    it('debe incluir el nombre completo correctamente', () => {
      const result = ClienteToHttpMapper.toHttp(clienteMock);
      expect(result.nombreCompleto).toBe('Juan Pérez');
    });

    it('debe manejar valores null y undefined correctamente', () => {
      const clienteSinDatosOpcionales = new Cliente({
        id: '456',
        nombre: 'María',
        apellido: 'González',
        email: 'maria@example.com',
        telefono: null,
        fechaNacimiento: null,
        rangoPresupuestoMin: null,
        rangoPresupuestoMax: null,
        marcasInteres: [],
        tipoAutoInteres: [],
        suscritoNewsletter: false,
        aceptaMarketing: false,
        preferenciaContacto: PreferenciaContacto.EMAIL,
        ultimaActividad: new Date(),
        totalVistasAutos: 0,
        totalClicksAutos: 0,
        totalConsultas: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        active: true,
      });

      const result = ClienteToHttpMapper.toHttp(clienteSinDatosOpcionales);

      expect(result.telefono).toBeNull();
      expect(result.fechaNacimiento).toBeNull();
      expect(result.rangoPresupuestoMin).toBeNull();
      expect(result.rangoPresupuestoMax).toBeNull();
      expect(result.marcasInteres).toEqual([]);
      expect(result.tipoAutoInteres).toEqual([]);
    });
  });

  describe('toHttpWithoutSensitive', () => {
    it('debe mapear cliente a respuesta HTTP sin información sensible', () => {
      const result = ClienteToHttpMapper.toHttpWithoutSensitive(clienteMock);

      expect(result).toEqual({
        id: clienteMock.id,
        nombre: clienteMock.nombre,
        apellido: clienteMock.apellido,
        nombreCompleto: clienteMock.nombreCompleto,
        email: clienteMock.email,
        telefono: clienteMock.telefono,
        fechaNacimiento: clienteMock.fechaNacimiento,
        emailVerificado: clienteMock.emailVerificado,
        rangoPresupuestoMin: clienteMock.rangoPresupuestoMin,
        rangoPresupuestoMax: clienteMock.rangoPresupuestoMax,
        marcasInteres: clienteMock.marcasInteres,
        tipoAutoInteres: clienteMock.tipoAutoInteres,
        suscritoNewsletter: clienteMock.suscritoNewsletter,
        aceptaMarketing: clienteMock.aceptaMarketing,
        preferenciaContacto: clienteMock.preferenciaContacto,
        ultimaActividad: clienteMock.ultimaActividad,
        totalVistasAutos: clienteMock.totalVistasAutos,
        totalClicksAutos: clienteMock.totalClicksAutos,
        totalConsultas: clienteMock.totalConsultas,
        createdAt: clienteMock.createdAt,
        updatedAt: clienteMock.updatedAt,
        active: clienteMock.active,
      });
    });

    it('no debe incluir campos sensibles (si se agregan en el futuro)', () => {
      const result = ClienteToHttpMapper.toHttpWithoutSensitive(clienteMock);

      // Verificar que no incluye password o token
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('tokenVerificacion');
    });
  });

  describe('toHttpList', () => {
    it('debe mapear una lista de clientes a respuestas HTTP sin información sensible', () => {
      const clientes = [
        clienteMock,
        new Cliente({
          id: '456',
          nombre: 'María',
          apellido: 'González',
          email: 'maria@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
          active: true,
        }),
        new Cliente({
          id: '789',
          nombre: 'Pedro',
          apellido: 'Rodríguez',
          email: 'pedro@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
          active: false,
        }),
      ];

      const result = ClienteToHttpMapper.toHttpList(clientes);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('123');
      expect(result[0].nombre).toBe('Juan');
      expect(result[1].id).toBe('456');
      expect(result[1].nombre).toBe('María');
      expect(result[2].id).toBe('789');
      expect(result[2].nombre).toBe('Pedro');
      expect(result[2].active).toBe(false);
    });

    it('debe devolver un array vacío si se pasa una lista vacía', () => {
      const result = ClienteToHttpMapper.toHttpList([]);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('debe aplicar toHttpWithoutSensitive a cada elemento', () => {
      const spyToHttpWithoutSensitive = jest.spyOn(
        ClienteToHttpMapper,
        'toHttpWithoutSensitive',
      );

      const clientes = [clienteMock];
      ClienteToHttpMapper.toHttpList(clientes);

      expect(spyToHttpWithoutSensitive).toHaveBeenCalledTimes(1);
      expect(spyToHttpWithoutSensitive).toHaveBeenCalledWith(clienteMock);

      spyToHttpWithoutSensitive.mockRestore();
    });

    it('debe manejar clientes con diferentes configuraciones', () => {
      const clientes = [
        new Cliente({
          id: '1',
          nombre: 'Cliente',
          apellido: 'Con Todo',
          email: 'completo@example.com',
          telefono: '111111',
          fechaNacimiento: new Date('1985-05-15'),
          rangoPresupuestoMin: 20000,
          rangoPresupuestoMax: 40000,
          marcasInteres: [Marca.FORD],
          tipoAutoInteres: [TipoAuto.PICKUP],
          suscritoNewsletter: true,
          aceptaMarketing: true,
          preferenciaContacto: PreferenciaContacto.TELEFONO,
          createdAt: new Date(),
          updatedAt: new Date(),
          active: true,
        }),
        new Cliente({
          id: '2',
          nombre: 'Cliente',
          apellido: 'Mínimo',
          email: 'minimo@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
          active: true,
        }),
      ];

      const result = ClienteToHttpMapper.toHttpList(clientes);

      expect(result[0].telefono).toBe('111111');
      expect(result[0].marcasInteres).toContain(Marca.FORD);
      expect(result[0].tipoAutoInteres).toContain(TipoAuto.PICKUP);
      expect(result[0].preferenciaContacto).toBe(PreferenciaContacto.TELEFONO);

      expect(result[1].telefono).toBeNull();
      expect(result[1].marcasInteres).toEqual([]);
      expect(result[1].tipoAutoInteres).toEqual([]);
    });
  });
});
