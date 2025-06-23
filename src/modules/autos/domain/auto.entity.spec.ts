import { Auto } from './auto.entity';
import { Marca, EstadoAuto, Transmision, Color } from './auto.enum';
import { AutoProps } from './auto.interfaces';

describe('Auto Entity', () => {
  const validAutoProps: AutoProps = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    nombre: 'Toyota Corolla',
    descripcion: 'Sedán compacto',
    observaciones: 'En excelente estado',
    matricula: 'ABC-123',
    marca: Marca.TOYOTA,
    modelo: 'Corolla',
    version: 'XLI',
    ano: 2022,
    kilometraje: 10000,
    precio: 20000,
    costo: 15000,
    transmision: Transmision.MANUAL,
    estado: EstadoAuto.DISPONIBLE,
    color: Color.BLANCO,
    imagenes: ['https://example.com/image1.jpg'],
    equipamientoDestacado: ['GPS', 'Bluetooth'],
    caracteristicasGenerales: ['4 puertas'],
    exterior: ['Espejos eléctricos'],
    confort: ['Aire acondicionado'],
    seguridad: ['ABS', 'Airbags'],
    interior: ['Tapizado de cuero'],
    entretenimiento: ['Radio AM/FM'],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-123',
    updatedBy: 'user-123',
  };

  describe('constructor', () => {
    it('debería crear un auto válido con todas las propiedades', () => {
      const auto = new Auto(validAutoProps);

      expect(auto.id).toBe(validAutoProps.id);
      expect(auto.nombre).toBe(validAutoProps.nombre);
      expect(auto.marca).toBe(validAutoProps.marca);
      expect(auto.precio).toBe(validAutoProps.precio);
      expect(auto.ano).toBe(validAutoProps.ano);
      expect(auto.kilometraje).toBe(validAutoProps.kilometraje);
    });

    it('debería asignar correctamente todas las propiedades de arrays', () => {
      const auto = new Auto(validAutoProps);

      expect(auto.imagenes).toEqual(validAutoProps.imagenes);
      expect(auto.equipamientoDestacado).toEqual(validAutoProps.equipamientoDestacado);
      expect(auto.seguridad).toEqual(validAutoProps.seguridad);
    });
  });

  describe('validación de dominio', () => {
    it('debería lanzar error si el precio es negativo', () => {
      const invalidProps = { ...validAutoProps, precio: -1000 };

      expect(() => new Auto(invalidProps)).toThrow('El precio y costo no pueden ser negativos');
    });

    it('debería lanzar error si el costo es negativo', () => {
      const invalidProps = { ...validAutoProps, costo: -500 };

      expect(() => new Auto(invalidProps)).toThrow('El precio y costo no pueden ser negativos');
    });

    it('debería lanzar error si el año es mayor al actual', () => {
      const futureYear = new Date().getFullYear() + 1;
      const invalidProps = { ...validAutoProps, ano: futureYear };

      expect(() => new Auto(invalidProps)).toThrow('El año no puede ser mayor al año actual');
    });

    it('debería lanzar error si el kilometraje es negativo', () => {
      const invalidProps = { ...validAutoProps, kilometraje: -1000 };

      expect(() => new Auto(invalidProps)).toThrow('El kilometraje no puede ser negativo');
    });

    it('debería permitir precio y costo de 0', () => {
      const validProps = { ...validAutoProps, precio: 0, costo: 0 };

      expect(() => new Auto(validProps)).not.toThrow();
      const auto = new Auto(validProps);
      expect(auto.precio).toBe(0);
      expect(auto.costo).toBe(0);
    });

    it('debería permitir año igual al actual', () => {
      const currentYear = new Date().getFullYear();
      const validProps = { ...validAutoProps, ano: currentYear };

      expect(() => new Auto(validProps)).not.toThrow();
      const auto = new Auto(validProps);
      expect(auto.ano).toBe(currentYear);
    });
  });

  describe('actualizarCon', () => {
    it('debería actualizar propiedades específicas manteniendo las demás', () => {
      const auto = new Auto(validAutoProps);
      const nuevoPrecio = 25000;
      const nuevoKilometraje = 15000;

      const autoActualizado = auto.actualizarCon({
        precio: nuevoPrecio,
        kilometraje: nuevoKilometraje,
        updatedBy: 'user-456',
      });

      expect(autoActualizado.precio).toBe(nuevoPrecio);
      expect(autoActualizado.kilometraje).toBe(nuevoKilometraje);
      expect(autoActualizado.updatedBy).toBe('user-456');
      // Propiedades no actualizadas deben mantenerse
      expect(autoActualizado.nombre).toBe(validAutoProps.nombre);
      expect(autoActualizado.marca).toBe(validAutoProps.marca);
      expect(autoActualizado.id).toBe(validAutoProps.id);
    });

    it('debería validar las nuevas propiedades al actualizar', () => {
      const auto = new Auto(validAutoProps);

      expect(() => auto.actualizarCon({ precio: -1000 })).toThrow(
        'El precio y costo no pueden ser negativos'
      );
    });

    it('debería actualizar la fecha de updatedAt automáticamente', () => {
      const auto = new Auto(validAutoProps);
      const fechaOriginal = auto.updatedAt;

      // Pequeña pausa para asegurar diferencia en timestamp
      const autoActualizado = auto.actualizarCon({ precio: 25000 });

      expect(autoActualizado.updatedAt).toBeInstanceOf(Date);
      expect(autoActualizado.updatedAt.getTime()).toBeGreaterThanOrEqual(fechaOriginal.getTime());
    });
  });
}); 