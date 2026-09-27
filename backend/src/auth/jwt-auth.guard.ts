import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * Protege las rutas: exige "Authorization: Bearer <accessToken>".
 * Si el token expiró responde 401 con mensaje claro para que el cliente
 * llame a /api/auth/refresh y reintente.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const [tipo, token] = (req.headers['authorization'] ?? '').split(' ');

    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('No se envió el access token. Use el encabezado Authorization: Bearer <token>.');
    }

    try {
      req.usuario = await this.jwt.verifyAsync(token);
      return true;
    } catch (error: any) {
      if (error?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('El access token expiró. Renueve la sesión con el refresh token.');
      }
      throw new UnauthorizedException('Access token inválido.');
    }
  }
}
