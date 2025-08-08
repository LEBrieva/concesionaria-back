import { BaseEntity } from '../../shared/entities/base.entity';
import { Marca } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { PreferenciaContacto, TipoAuto } from '@prisma/client';
import { ClienteProps } from './interfaces/cliente.interface';

export class Cliente extends BaseEntity {
  private _nombre: string;
  private _apellido: string;
  private _email: string;
  private _telefono?: string | null;
  private _fechaNacimiento?: Date | null;
  private _password?: string | null;
  private _emailVerificado: boolean;
  private _tokenVerificacion?: string | null;
  private _rangoPresupuestoMin?: number | null;
  private _rangoPresupuestoMax?: number | null;
  private _marcasInteres: Marca[];
  private _tipoAutoInteres: TipoAuto[];
  private _suscritoNewsletter: boolean;
  private _aceptaMarketing: boolean;
  private _preferenciaContacto: PreferenciaContacto;
  private _ultimaActividad: Date;
  private _totalVistasAutos: number;
  private _totalClicksAutos: number;
  private _totalConsultas: number;

  constructor(props: ClienteProps) {
    super({
      id: props.id || uuidv4(),
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      active: props.active,
    });
    this._nombre = props.nombre;
    this._apellido = props.apellido;
    this._email = props.email;
    this._telefono = props.telefono || null;
    this._fechaNacimiento = props.fechaNacimiento || null;
    this._password = props.password || null;
    this._emailVerificado = props.emailVerificado || false;
    this._tokenVerificacion = props.tokenVerificacion || null;
    this._rangoPresupuestoMin = props.rangoPresupuestoMin || null;
    this._rangoPresupuestoMax = props.rangoPresupuestoMax || null;
    this._marcasInteres = props.marcasInteres || [];
    this._tipoAutoInteres = props.tipoAutoInteres || [];
    this._suscritoNewsletter = props.suscritoNewsletter || false;
    this._aceptaMarketing = props.aceptaMarketing || false;
    this._preferenciaContacto =
      props.preferenciaContacto || PreferenciaContacto.EMAIL;
    this._ultimaActividad = props.ultimaActividad || new Date();
    this._totalVistasAutos = props.totalVistasAutos || 0;
    this._totalClicksAutos = props.totalClicksAutos || 0;
    this._totalConsultas = props.totalConsultas || 0;
  }

  // Getters
  get nombre(): string {
    return this._nombre;
  }

  get apellido(): string {
    return this._apellido;
  }

  get nombreCompleto(): string {
    return `${this._nombre} ${this._apellido}`;
  }

  get email(): string {
    return this._email;
  }

  get telefono(): string | null | undefined {
    return this._telefono;
  }

  get fechaNacimiento(): Date | null | undefined {
    return this._fechaNacimiento;
  }

  get password(): string | null | undefined {
    return this._password;
  }

  get emailVerificado(): boolean {
    return this._emailVerificado;
  }

  get tokenVerificacion(): string | null | undefined {
    return this._tokenVerificacion;
  }

  get rangoPresupuestoMin(): number | null | undefined {
    return this._rangoPresupuestoMin;
  }

  get rangoPresupuestoMax(): number | null | undefined {
    return this._rangoPresupuestoMax;
  }

  get marcasInteres(): Marca[] {
    return this._marcasInteres;
  }

  get tipoAutoInteres(): TipoAuto[] {
    return this._tipoAutoInteres;
  }

  get suscritoNewsletter(): boolean {
    return this._suscritoNewsletter;
  }

  get aceptaMarketing(): boolean {
    return this._aceptaMarketing;
  }

  get preferenciaContacto(): PreferenciaContacto {
    return this._preferenciaContacto;
  }

  get ultimaActividad(): Date {
    return this._ultimaActividad;
  }

  get totalVistasAutos(): number {
    return this._totalVistasAutos;
  }

  get totalClicksAutos(): number {
    return this._totalClicksAutos;
  }

  get totalConsultas(): number {
    return this._totalConsultas;
  }

  // Setters con validación
  set nombre(value: string) {
    if (!value || value.trim().length < 2) {
      throw new Error('El nombre debe tener al menos 2 caracteres');
    }
    this._nombre = value.trim();
  }

  set apellido(value: string) {
    if (!value || value.trim().length < 2) {
      throw new Error('El apellido debe tener al menos 2 caracteres');
    }
    this._apellido = value.trim();
  }

  set email(value: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error('El email no es válido');
    }
    this._email = value.toLowerCase().trim();
  }

  set telefono(value: string | null | undefined) {
    this._telefono = value;
  }

  set fechaNacimiento(value: Date | null | undefined) {
    if (value && value > new Date()) {
      throw new Error('La fecha de nacimiento no puede ser futura');
    }
    this._fechaNacimiento = value;
  }

  set password(value: string | null | undefined) {
    this._password = value;
  }

  set emailVerificado(value: boolean) {
    this._emailVerificado = value;
  }

  set tokenVerificacion(value: string | null | undefined) {
    this._tokenVerificacion = value;
  }

  set rangoPresupuestoMin(value: number | null | undefined) {
    if (value !== null && value !== undefined && value < 0) {
      throw new Error('El presupuesto mínimo no puede ser negativo');
    }
    this._rangoPresupuestoMin = value;
  }

  set rangoPresupuestoMax(value: number | null | undefined) {
    if (value !== null && value !== undefined && value < 0) {
      throw new Error('El presupuesto máximo no puede ser negativo');
    }
    if (
      this._rangoPresupuestoMin &&
      value &&
      value < this._rangoPresupuestoMin
    ) {
      throw new Error('El presupuesto máximo no puede ser menor al mínimo');
    }
    this._rangoPresupuestoMax = value;
  }

  set marcasInteres(value: Marca[]) {
    this._marcasInteres = value;
  }

  set tipoAutoInteres(value: TipoAuto[]) {
    this._tipoAutoInteres = value;
  }

  set suscritoNewsletter(value: boolean) {
    this._suscritoNewsletter = value;
  }

  set aceptaMarketing(value: boolean) {
    this._aceptaMarketing = value;
  }

  set preferenciaContacto(value: PreferenciaContacto) {
    this._preferenciaContacto = value;
  }

  set ultimaActividad(value: Date) {
    this._ultimaActividad = value;
  }

  set totalVistasAutos(value: number) {
    if (value < 0) {
      throw new Error('El total de vistas no puede ser negativo');
    }
    this._totalVistasAutos = value;
  }

  set totalClicksAutos(value: number) {
    if (value < 0) {
      throw new Error('El total de clicks no puede ser negativo');
    }
    this._totalClicksAutos = value;
  }

  set totalConsultas(value: number) {
    if (value < 0) {
      throw new Error('El total de consultas no puede ser negativo');
    }
    this._totalConsultas = value;
  }

  // Métodos de negocio
  actualizarUltimaActividad(): void {
    this._ultimaActividad = new Date();
  }

  incrementarVistas(): void {
    this._totalVistasAutos++;
    this.actualizarUltimaActividad();
  }

  incrementarClicks(): void {
    this._totalClicksAutos++;
    this.actualizarUltimaActividad();
  }

  incrementarConsultas(): void {
    this._totalConsultas++;
    this.actualizarUltimaActividad();
  }

  verificarEmail(token: string): boolean {
    if (this._tokenVerificacion === token) {
      this._emailVerificado = true;
      this._tokenVerificacion = null;
      return true;
    }
    return false;
  }

  puedeRecibirMarketing(): boolean {
    return (
      this._aceptaMarketing &&
      this._emailVerificado &&
      this._preferenciaContacto !== PreferenciaContacto.NO_CONTACTAR
    );
  }

  estaActivo(): boolean {
    const diasInactivo = 30;
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - diasInactivo);
    return this._ultimaActividad > fechaLimite;
  }

  toObject(): ClienteProps {
    return {
      id: this.id,
      nombre: this._nombre,
      apellido: this._apellido,
      email: this._email,
      telefono: this._telefono,
      fechaNacimiento: this._fechaNacimiento,
      password: this._password,
      emailVerificado: this._emailVerificado,
      tokenVerificacion: this._tokenVerificacion,
      rangoPresupuestoMin: this._rangoPresupuestoMin,
      rangoPresupuestoMax: this._rangoPresupuestoMax,
      marcasInteres: this._marcasInteres,
      tipoAutoInteres: this._tipoAutoInteres,
      suscritoNewsletter: this._suscritoNewsletter,
      aceptaMarketing: this._aceptaMarketing,
      preferenciaContacto: this._preferenciaContacto,
      ultimaActividad: this._ultimaActividad,
      totalVistasAutos: this._totalVistasAutos,
      totalClicksAutos: this._totalClicksAutos,
      totalConsultas: this._totalConsultas,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      active: this.active,
    };
  }
}
