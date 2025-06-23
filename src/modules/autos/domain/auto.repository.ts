import { Auto } from './auto.entity';
import { IBaseRepository } from '../../shared/interfaces/base-repository.interface';

export interface IAutoRepository extends IBaseRepository<Auto> {
  save(auto: Auto): Promise<void>;
  update(id: string, auto: Auto): Promise<void>;
  findByMatricula(matricula: string): Promise<Auto | null>;
  findFavoritos(): Promise<Auto[]>;
  countFavoritos(): Promise<number>;
}
