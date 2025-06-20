import { BaseEntity } from 'src/modules/shared/entities/base.entity';
import { Color, EstadoAuto, Transmision, Marca } from './auto.enum';
import { AutoProps } from './auto.interfaces';
import { BaseProps } from 'src/modules/shared/interfaces/base-props.interface';

export class Auto extends BaseEntity {
  private readonly props: AutoProps;

  public readonly nombre: string;
  public readonly descripcion: string;
  public readonly observaciones: string;
  public readonly matricula: string;
  public readonly marca: Marca;
  public readonly modelo: string;
  public readonly version: string;
  public readonly ano: number;
  public readonly kilometraje: number;
  public readonly precio: number;
  public readonly costo: number;
  public readonly transmision: Transmision;
  public readonly estado: EstadoAuto;
  public readonly color: Color;
  public readonly imagenes: string[];
  public readonly equipamientoDestacado: string[];
  public readonly caracteristicasGenerales: string[];
  public readonly exterior: string[];
  public readonly confort: string[];
  public readonly seguridad: string[];
  public readonly interior: string[];
  public readonly entretenimiento: string[];

  constructor(props: AutoProps) {
    const {
      nombre,
      descripcion,
      observaciones,
      matricula,
      marca,
      modelo,
      version,
      ano,
      kilometraje,
      precio,
      costo,
      transmision,
      estado,
      color,
      imagenes,
      equipamientoDestacado,
      caracteristicasGenerales,
      exterior,
      confort,
      seguridad,
      interior,
      entretenimiento,
    } = props;
    super(props);
    this.props = props;

    this.nombre = nombre;
    this.descripcion = descripcion;
    this.observaciones = observaciones;
    this.matricula = matricula;
    this.marca = marca;
    this.modelo = modelo;
    this.version = version;
    this.ano = ano;
    this.kilometraje = kilometraje;
    this.precio = precio;
    this.costo = costo;
    this.transmision = transmision;
    this.estado = estado;
    this.color = color;
    this.imagenes = imagenes;
    this.equipamientoDestacado = equipamientoDestacado;
    this.caracteristicasGenerales = caracteristicasGenerales;
    this.exterior = exterior;
    this.confort = confort;
    this.seguridad = seguridad;
    this.interior = interior;
    this.entretenimiento = entretenimiento;

    this.validarDominio();
  }

  private validarDominio(): void {
    const currentYear = new Date().getFullYear();

    if (this.precio < 0 || this.costo < 0) {
      throw new Error('El precio y costo no pueden ser negativos');
    }

    if (this.ano > currentYear) {
      throw new Error('El año no puede ser mayor al año actual');
    }

    if (this.kilometraje < 0) {
      throw new Error('El kilometraje no puede ser negativo');
    }
  }

  actualizarCon(props: Partial<AutoProps>): Auto {
    return new Auto({
      ...this.props,
      ...props,
      updatedAt: new Date(), // si querés actualizar la fecha automáticamente
    });
  }
}
