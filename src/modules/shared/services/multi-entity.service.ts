import { Injectable } from '@nestjs/common';
import { RepositoryFactory } from '../factories/repository.factory';
import { Auto } from '../../autos/domain/auto.entity';
import { Usuario } from '../../usuarios/domain/usuario.entity';
import { BaseEntity } from '../entities/base.entity';

export interface EntitySummary {
  entityType: string;
  total: number;
  active: number;
  inactive: number;
}

@Injectable()
export class MultiEntityService {
  constructor(private readonly repositoryFactory: RepositoryFactory) {}

  /**
   * Obtiene un resumen de todas las entidades del sistema
   */
  async getSystemSummary(): Promise<EntitySummary[]> {
    const summaries: EntitySummary[] = [];

    // Resumen de Autos
    const autoRepo = this.repositoryFactory.getRepository<Auto>('IAutoRepository');
    const todosLosAutos = await autoRepo.findAll();
    const autosActivos = await autoRepo.findAllActive();
    
    summaries.push({
      entityType: 'autos',
      total: todosLosAutos.length,
      active: autosActivos.length,
      inactive: todosLosAutos.length - autosActivos.length,
    });

    // Resumen de Usuarios
    const usuarioRepo = this.repositoryFactory.getRepository<Usuario>('IUsuarioRepository');
    const todosLosUsuarios = await usuarioRepo.findAll();
    const usuariosActivos = await usuarioRepo.findAllActive();
    
    summaries.push({
      entityType: 'usuarios',
      total: todosLosUsuarios.length,
      active: usuariosActivos.length,
      inactive: todosLosUsuarios.length - usuariosActivos.length,
    });

    return summaries;
  }

  /**
   * Busca una entidad por ID dinámicamente según el tipo
   */
  async findEntityById<T extends BaseEntity>(
    entityType: 'auto' | 'usuario',
    id: string
  ): Promise<T | null> {
    switch (entityType) {
      case 'auto':
        const autoRepo = this.repositoryFactory.getRepository<Auto>('IAutoRepository');
        return autoRepo.findOneById(id) as Promise<T | null>;
      
      case 'usuario':
        const usuarioRepo = this.repositoryFactory.getRepository<Usuario>('IUsuarioRepository');
        return usuarioRepo.findOneById(id) as Promise<T | null>;
      
      default:
        throw new Error(`Tipo de entidad no soportado: ${entityType}`);
    }
  }

  /**
   * Obtiene todas las entidades activas de un tipo específico
   */
  async getAllActiveByType(
    entityType: 'auto' | 'usuario'
  ): Promise<BaseEntity[]> {
    switch (entityType) {
      case 'auto':
        const autoRepo = this.repositoryFactory.getRepository<Auto>('IAutoRepository');
        return autoRepo.findAllActive();
      
      case 'usuario':
        const usuarioRepo = this.repositoryFactory.getRepository<Usuario>('IUsuarioRepository');
        return usuarioRepo.findAllActive();
      
      default:
        throw new Error(`Tipo de entidad no soportado: ${entityType}`);
    }
  }

  /**
   * Método genérico que puede trabajar con cualquier repositorio
   */
  private async getRepositoryStats<T extends BaseEntity>(
    repositoryToken: string
  ): Promise<{ total: number; active: number }> {
    const repo = this.repositoryFactory.getRepository<T>(repositoryToken);
    const [total, active] = await Promise.all([
      repo.findAll(),
      repo.findAllActive(),
    ]);
    
    return {
      total: total.length,
      active: active.length,
    };
  }
} 