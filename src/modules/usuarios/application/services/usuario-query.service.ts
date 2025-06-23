import { Injectable, Inject } from '@nestjs/common';
import { Usuario } from '../../domain/usuario.entity';
import { IUsuarioRepository } from '../../domain/usuario.repository';

@Injectable()
export class UsuarioQueryService {
  constructor(
    @Inject('IUsuarioRepository') private readonly usuarioRepo: IUsuarioRepository,
  ) {}

  async findAll(): Promise<Usuario[]> {
    return this.usuarioRepo.findAll();
  }

  async findAllActive(): Promise<Usuario[]> {
    return this.usuarioRepo.findAllActive();
  }

  async findById(id: string): Promise<Usuario | null> {
    return this.usuarioRepo.findOneById(id);
  }
} 