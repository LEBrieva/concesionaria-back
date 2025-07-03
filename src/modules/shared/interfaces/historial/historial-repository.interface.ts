import { Historial, TipoAccion, TipoEntidad } from "@shared/entities/historial.entity";
import { IBaseRepository } from "../base";

export interface IHistorialRepository extends IBaseRepository<Historial> {
  crear(historial: Historial): Promise<Historial>;
  obtenerPorEntidad(entidadId: string, tipoEntidad: TipoEntidad): Promise<Historial[]>;
  obtenerPorEntidadYTipoAccion(
    entidadId: string, 
    tipoEntidad: TipoEntidad, 
    tipoAccion: TipoAccion
  ): Promise<Historial[]>;
  obtenerHistorialCompleto(
    entidadId: string, 
    tipoEntidad: TipoEntidad,
    limite?: number
  ): Promise<Historial[]>;
}   