import { Historial, TipoAccion, TipoEntidad } from './historial.entity';

describe('Historial Entity', () => {
  const validProps = {
    id: 'historial-123',
    entidadId: 'auto-456',
    tipoEntidad: TipoEntidad.AUTO,
    tipoAccion: TipoAccion.CAMBIO_ESTADO,
    campoAfectado: 'estado',
    valorAnterior: 'DISPONIBLE',
    valorNuevo: 'RESERVADO',
    observaciones: 'Cliente interesado, reserva por 48 horas',
    createdBy: 'user-789',
    updatedBy: 'user-789',
  };

  describe('constructor', () => {
    it('debería crear un historial válido', () => {
      const historial = new Historial(validProps);

      expect(historial.id).toBe(validProps.id);
      expect(historial.entidadId).toBe(validProps.entidadId);
      expect(historial.tipoEntidad).toBe(validProps.tipoEntidad);
      expect(historial.tipoAccion).toBe(validProps.tipoAccion);
      expect(historial.campoAfectado).toBe(validProps.campoAfectado);
      expect(historial.valorAnterior).toBe(validProps.valorAnterior);
      expect(historial.valorNuevo).toBe(validProps.valorNuevo);
      expect(historial.observaciones).toBe(validProps.observaciones);
      expect(historial.createdBy).toBe(validProps.createdBy);
    });

    it('debería fallar si el entidadId está vacío', () => {
      expect(() => {
        new Historial({
          ...validProps,
          entidadId: '',
        });
      }).toThrow('El ID de la entidad es requerido');
    });

    it('debería fallar si el tipo de entidad no es válido', () => {
      expect(() => {
        new Historial({
          ...validProps,
          tipoEntidad: 'INVALIDO' as TipoEntidad,
        });
      }).toThrow('El tipo de entidad debe ser válido');
    });

    it('debería fallar si el tipo de acción no es válido', () => {
      expect(() => {
        new Historial({
          ...validProps,
          tipoAccion: 'INVALIDO' as TipoAccion,
        });
      }).toThrow('El tipo de acción debe ser válido');
    });

    it('debería fallar para cambio de estado sin campo afectado', () => {
      expect(() => {
        new Historial({
          ...validProps,
          tipoAccion: TipoAccion.CAMBIO_ESTADO,
          campoAfectado: undefined,
        });
      }).toThrow('Para cambios de estado, el campo afectado es requerido');
    });

    it('debería fallar para cambio de estado sin observaciones', () => {
      expect(() => {
        new Historial({
          ...validProps,
          tipoAccion: TipoAccion.CAMBIO_ESTADO,
          observaciones: '',
        });
      }).toThrow('Para cambios de estado, las observaciones son requeridas');
    });
  });

  describe('esCambioEstado', () => {
    it('debería retornar true para cambios de estado', () => {
      const historial = new Historial({
        ...validProps,
        tipoAccion: TipoAccion.CAMBIO_ESTADO,
      });

      expect(historial.esCambioEstado()).toBe(true);
    });

    it('debería retornar false para otros tipos de acción', () => {
      const historial = new Historial({
        ...validProps,
        tipoAccion: TipoAccion.CREAR,
        campoAfectado: undefined,
        observaciones: undefined,
      });

      expect(historial.esCambioEstado()).toBe(false);
    });
  });

  describe('obtenerResumenCambio', () => {
    it('debería retornar resumen correcto para cambio de estado', () => {
      const historial = new Historial(validProps);

      expect(historial.obtenerResumenCambio()).toBe(
        'Estado cambiado de "DISPONIBLE" a "RESERVADO"'
      );
    });

    it('debería retornar resumen correcto para creación', () => {
      const historial = new Historial({
        ...validProps,
        tipoAccion: TipoAccion.CREAR,
        campoAfectado: undefined,
        valorAnterior: undefined,
        valorNuevo: undefined,
        observaciones: undefined,
      });

      expect(historial.obtenerResumenCambio()).toBe('AUTO creado');
    });

    it('debería retornar resumen correcto para actualización con campo', () => {
      const historial = new Historial({
        ...validProps,
        tipoAccion: TipoAccion.ACTUALIZAR,
        campoAfectado: 'precio',
        observaciones: undefined,
      });

      expect(historial.obtenerResumenCambio()).toBe('Campo "precio" actualizado');
    });

    it('debería retornar resumen correcto para actualización sin campo', () => {
      const historial = new Historial({
        ...validProps,
        tipoAccion: TipoAccion.ACTUALIZAR,
        campoAfectado: undefined,
        observaciones: undefined,
      });

      expect(historial.obtenerResumenCambio()).toBe('AUTO actualizado');
    });
  });

  describe('crear - cambio de estado', () => {
    it('debería crear historial para cambio de estado usando método genérico', () => {
      const historial = Historial.crear({
        entidadId: 'auto-123',
        tipoEntidad: TipoEntidad.AUTO,
        tipoAccion: TipoAccion.CAMBIO_ESTADO,
        campoAfectado: 'estado',
        valorAnterior: 'DISPONIBLE',
        valorNuevo: 'RESERVADO',
        observaciones: 'Reservado por cliente',
        createdBy: 'user-456',
      });

      expect(historial.tipoAccion).toBe(TipoAccion.CAMBIO_ESTADO);
      expect(historial.entidadId).toBe('auto-123');
      expect(historial.esCambioEstado()).toBe(true);
      expect(historial.observaciones).toBe('Reservado por cliente');
    });
  });

  describe('crear', () => {
    it('debería crear historial genérico', () => {
      const historial = Historial.crear({
        entidadId: 'auto-123',
        tipoEntidad: TipoEntidad.AUTO,
        tipoAccion: TipoAccion.CREAR,
        createdBy: 'user-456',
      });

      expect(historial.tipoAccion).toBe(TipoAccion.CREAR);
      expect(historial.entidadId).toBe('auto-123');
      expect(historial.esCambioEstado()).toBe(false);
    });
  });
}); 