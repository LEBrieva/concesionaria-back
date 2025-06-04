import { Auto } from './auto.entity';

export interface IAutoRepository {
  save(auto: Auto): Promise<void>;
  update(id: string, auto: Auto): Promise<void>;
  findById(id: string): Promise<Auto | null>;
  findAll(): Promise<Auto[]>;
}
