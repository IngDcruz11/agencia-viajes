import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { construirRespuesta } from '../common/respuesta';
import { AuthRepository, UsuarioBd } from './auth.repository';
import { LoginDto, RegistroDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly minutosRefresh: number;

  constructor(
    private readonly repo: AuthRepository,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.minutosRefresh = Number(config.get<string>('REFRESH_TOKEN_MINUTES', '10080'));
  }

  /** Refresh token: cadena aleatoria segura (en BD solo se guarda su hash). */
  private generarRefreshToken(): string {
    return randomBytes(48).toString('hex');
  }

  /** Arma el paquete de tokens que se devuelve al cliente. */
  private async emitirTokens(usuario: UsuarioBd, refreshToken: string) {
    const accessToken = await this.jwt.signAsync({
      sub: usuario.codigoUsuario,
      nombreUsuario: usuario.nombreUsuario,
      rol: usuario.rol,
    });
    const { exp } = this.jwt.decode(accessToken) as { exp: number };

    return {
      tokenType: 'Bearer',
      accessToken,
      accessTokenExpiraEn: new Date(exp * 1000).toISOString(),
      refreshToken,
      refreshTokenExpiraEn: new Date(Date.now() + this.minutosRefresh * 60_000).toISOString(),
      usuario,
    };
  }

  async registrar(dto: RegistroDto) {
    const r = await this.repo.registrar(dto.nombreUsuario, dto.contrasena, dto.nombreCompleto);
    return construirRespuesta(r);
  }

  async login(dto: LoginDto) {
    const refreshToken = this.generarRefreshToken();
    const r = await this.repo.login(dto.nombreUsuario, dto.contrasena, refreshToken, this.minutosRefresh);
    const respuesta = construirRespuesta(r); // lanza 400/401/403/500 si falla
    return { ...respuesta, data: await this.emitirTokens(respuesta.data!, refreshToken) };
  }

  async refresh(refreshActual: string) {
    const refreshNuevo = this.generarRefreshToken(); // rotación de refresh token
    const r = await this.repo.refresh(refreshActual, refreshNuevo, this.minutosRefresh);
    const respuesta = construirRespuesta(r);
    return { ...respuesta, data: await this.emitirTokens(respuesta.data!, refreshNuevo) };
  }

  async logout(refreshToken: string) {
    return construirRespuesta(await this.repo.logout(refreshToken));
  }

  async perfil(codigoUsuario: number) {
    return construirRespuesta(await this.repo.perfil(codigoUsuario));
  }
}
