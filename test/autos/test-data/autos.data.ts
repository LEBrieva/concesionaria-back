import { v4 as uuidv4 } from 'uuid';
import { Marca } from '../../../src/modules/autos/domain/auto.enum';

export const validCar = {
  nombre: 'Toyota Corolla',
  descripcion: 'Sedán compacto',
  observaciones: 'En excelente estado',
  matricula: `TEST-${uuidv4()}`,
  marca: Marca.TOYOTA,
  modelo: 'Corolla',
  version: 'XLI',
  ano: 2022, // Confirmado que está correcto
  kilometraje: 10000, // Asegúrate de que cumple con las validaciones del DTO
  precio: 20000, // Asegúrate de que cumple con las validaciones del DTO
  costo: 15000,
  transmision: 'MANUAL',
  estado: 'DISPONIBLE',
  color: 'BLANCO',
  imagenes: ['https://example.com/image1.jpg'], // Agregado un elemento para cumplir con @ArrayNotEmpty()
  equipamientoDestacado: [],
  caracteristicasGenerales: [],
  exterior: [],
  confort: [],
  seguridad: [],
  interior: [],
  entretenimiento: [],
};

export const invalidCars = {
  missingFields: {
    marca: Marca.TOYOTA,
  },
  negativePrice: {
    ...validCar,
    precio: -100,
  },
  futureYear: {
    ...validCar,
    ano: new Date().getFullYear() + 1,
  },
  negativeMileage: {
    ...validCar,
    kilometraje: -100,
  },
  zeroPrice: {
    ...validCar,
    matricula: `TEST-${uuidv4()}`,
    precio: 0,
  },
};
