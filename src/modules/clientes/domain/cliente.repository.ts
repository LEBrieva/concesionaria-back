import { IBaseRepository } from '../../shared/interfaces/base';
import { Cliente } from './cliente.entity';
import { ClienteFilters } from './interfaces/cliente.interface';

export const CLIENTE_REPOSITORY = 'CLIENTE_REPOSITORY';

export interface ClienteRepository extends IBaseRepository<Cliente> {
  create(cliente: Cliente): Promise<Cliente>;
  update(id: string, cliente: Cliente): Promise<Cliente>;
  findById(id: string): Promise<Cliente | null>;
  findAll(): Promise<Cliente[]>;
  delete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  findByEmail(email: string): Promise<Cliente | null>;
  findByFilters(filters: ClienteFilters): Promise<Cliente[]>;
  verificarEmail(clienteId: string, token: string): Promise<boolean>;
  actualizarUltimaActividad(clienteId: string): Promise<Cliente>;
  incrementarVistas(clienteId: string): Promise<Cliente>;
  incrementarClicks(clienteId: string): Promise<Cliente>;
  incrementarConsultas(clienteId: string): Promise<Cliente>;
}
