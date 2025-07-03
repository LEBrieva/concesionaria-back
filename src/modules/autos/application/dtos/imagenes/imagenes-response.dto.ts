export class ImagenSubidaResponseDto {
  url: string;
  fileName: string;
}

export class SubirImagenesResponseDto {
  imagenes: ImagenSubidaResponseDto[];
  total: number;
  mensaje: string;
}

export class EliminarImagenDto {
  fileName: string;
} 