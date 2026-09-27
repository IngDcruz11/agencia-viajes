import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/** Body para Agregar y Editar destino (llaves iguales al JSON que devuelve el API). */
export class DestinoDto {
  @IsString({ message: 'nombreDestino debe ser texto.' })
  @IsNotEmpty({ message: 'nombreDestino es obligatorio.' })
  @MaxLength(120, { message: 'nombreDestino admite máximo 120 caracteres.' })
  nombreDestino: string;

  @IsString({ message: 'ciudad debe ser texto.' })
  @IsNotEmpty({ message: 'ciudad es obligatoria.' })
  @MaxLength(100, { message: 'ciudad admite máximo 100 caracteres.' })
  ciudad: string;

  @IsString({ message: 'pais debe ser texto.' })
  @IsNotEmpty({ message: 'pais es obligatorio.' })
  @MaxLength(100, { message: 'pais admite máximo 100 caracteres.' })
  pais: string;

  @IsString({ message: 'continente debe ser texto.' })
  @IsNotEmpty({ message: 'continente es obligatorio.' })
  @MaxLength(50, { message: 'continente admite máximo 50 caracteres.' })
  continente: string;

  @IsOptional()
  @IsString({ message: 'descripcion debe ser texto.' })
  @MaxLength(350, { message: 'descripcion admite máximo 350 caracteres.' })
  descripcion?: string;

  @IsOptional()
  @IsString({ message: 'clima debe ser texto.' })
  @MaxLength(80, { message: 'clima admite máximo 80 caracteres.' })
  clima?: string;

  @IsString({ message: 'moneda debe ser texto.' })
  @IsNotEmpty({ message: 'moneda es obligatoria.' })
  @MaxLength(50, { message: 'moneda admite máximo 50 caracteres.' })
  moneda: string;

  @IsString({ message: 'idiomaPrincipal debe ser texto.' })
  @IsNotEmpty({ message: 'idiomaPrincipal es obligatorio.' })
  @MaxLength(80, { message: 'idiomaPrincipal admite máximo 80 caracteres.' })
  idiomaPrincipal: string;

  @Type(() => Number)
  @IsInt({ message: 'requiereVisa debe ser 0 o 1.' })
  @IsIn([0, 1], { message: 'requiereVisa debe ser 0 (no) o 1 (sí).' })
  requiereVisa: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'costoPromedioDiario debe ser un número con máximo 2 decimales.' })
  @Min(0, { message: 'costoPromedioDiario no puede ser negativo.' })
  costoPromedioDiario: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'estado debe ser 0 o 1.' })
  @IsIn([0, 1], { message: 'estado debe ser 0 (inactivo) o 1 (activo).' })
  estado?: number;
}
