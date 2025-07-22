import { ActualizarAutoDTO } from '@autos/application/dtos/actualizar/actualizar-auto.dto';
import { Auto } from '@autos/domain/auto.entity';
import { IAutoRepository } from '@autos/domain/auto.repository';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { HistorialService } from '@shared/services/historial.service';
import { TipoEntidad, TipoAccion } from '@shared/entities/historial.entity';

@Injectable()
export class ActualizarAutoUseCase {
  constructor(
    @Inject('IAutoRepository') private readonly autoRepo: IAutoRepository,
    private readonly historialService: HistorialService,
  ) {}

  async execute(id: string, dto: ActualizarAutoDTO, userId: string): Promise<Auto> {
    const auto = await this.autoRepo.findOneById(id);
    if (!auto) throw new NotFoundException('Auto no encontrado');

    // Detectar cambios antes de actualizar
    const cambios = this.detectarCambios(auto, dto);

    const updatedAuto = auto.actualizarCon({ ...dto, updatedBy: userId }); 
    await this.autoRepo.update(id, updatedAuto);

    // Registrar cada cambio en el historial
    await this.registrarCambiosEnHistorial(id, cambios, userId, auto);

    return updatedAuto;
  }

  private detectarCambios(autoActual: Auto, dto: ActualizarAutoDTO): Array<{
    campo: string;
    valorAnterior: any;
    valorNuevo: any;
  }> {
    const cambios: Array<{ campo: string; valorAnterior: any; valorNuevo: any }> = [];

    // Lista de campos que pueden cambiar
    const camposAComparar = [
      'nombre', 'descripcion', 'observaciones', 'matricula', 'marca', 'modelo', 
      'version', 'ano', 'kilometraje', 'precio', 'costo', 'transmision', 
      'color', 'imagenes', 'equipamientoDestacado', 'caracteristicasGenerales',
      'exterior', 'confort', 'seguridad', 'interior', 'entretenimiento'
    ];

    camposAComparar.forEach(campo => {
      if (dto[campo] !== undefined) {
        const valorActual = autoActual[campo];
        const valorNuevo = dto[campo];

        // Comparar valores (arrays requieren comparación especial)
        if (Array.isArray(valorActual) && Array.isArray(valorNuevo)) {
          if (JSON.stringify(valorActual) !== JSON.stringify(valorNuevo)) {
            cambios.push({
              campo,
              valorAnterior: valorActual,
              valorNuevo: valorNuevo,
            });
          }
        } else if (valorActual !== valorNuevo) {
          cambios.push({
            campo,
            valorAnterior: valorActual,
            valorNuevo: valorNuevo,
          });
        }
      }
    });

    return cambios;
  }

  private async registrarCambiosEnHistorial(
    autoId: string,
    cambios: Array<{ campo: string; valorAnterior: any; valorNuevo: any }>,
    usuarioId: string,
    autoOriginal: Auto
  ): Promise<void> {
    // Si no hay cambios, no registrar nada
    if (cambios.length === 0) return;

    // Registrar todos los cambios en paralelo para mejor performance
    const promesasHistorial = cambios.map(cambio =>
      this.historialService.registrarCambio({
        entidadId: autoId,
        tipoEntidad: TipoEntidad.AUTO,
        tipoAccion: TipoAccion.ACTUALIZAR,
        campoAfectado: cambio.campo,
        valorAnterior: this.formatearValor(cambio.valorAnterior),
        valorNuevo: this.formatearValor(cambio.valorNuevo),
        observaciones: `Campo '${cambio.campo}' actualizado`,
        usuarioId,
        metadata: {
          autoNombre: autoOriginal.nombre,
          autoMatricula: autoOriginal.matricula,
          tipoActualizacion: 'campo_individual',
          campo: cambio.campo,
        },
      })
    );

    await Promise.all(promesasHistorial);
  }

  private formatearValor(valor: any): string {
    if (valor === null || valor === undefined) return 'null';
    if (Array.isArray(valor)) return JSON.stringify(valor);
    if (typeof valor === 'object') return JSON.stringify(valor);
    return String(valor);
  }
}
