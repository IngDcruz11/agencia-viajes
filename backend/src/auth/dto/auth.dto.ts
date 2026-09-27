import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'nombreUsuario debe ser texto.' })
  @IsNotEmpty({ message: 'nombreUsuario es obligatorio.' })
  nombreUsuario: string;

  @IsString({ message: 'contrasena debe ser texto.' })
  @IsNotEmpty({ message: 'contrasena es obligatoria.' })
  contrasena: string;
}

export class RefreshDto {
  @IsString({ message: 'refreshToken debe ser texto.' })
  @IsNotEmpty({ message: 'refreshToken es obligatorio.' })
  refreshToken: string;
}

export class RegistroDto {
  @IsString()
  @MinLength(3, { message: 'nombreUsuario debe tener al menos 3 caracteres.' })
  nombreUsuario: string;

  @IsString()
  @MinLength(6, { message: 'contrasena debe tener al menos 6 caracteres.' })
  contrasena: string;

  @IsString()
  @IsNotEmpty({ message: 'nombreCompleto es obligatorio.' })
  nombreCompleto: string;
}
