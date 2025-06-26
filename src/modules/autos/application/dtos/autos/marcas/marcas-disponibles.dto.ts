export class MarcasDisponiblesResponseDto {
  marcas: string[];
  total: number;

  constructor(marcas: string[]) {
    this.marcas = marcas.sort();
    this.total = marcas.length;
  }
} 