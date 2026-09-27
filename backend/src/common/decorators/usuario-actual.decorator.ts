import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UsuarioToken {
  sub: number;
  nombreUsuario: string;
  rol: string;
}

/** Inyecta en el controlador el usuario que viene dentro del access token. */
export const UsuarioActual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioToken => ctx.switchToHttp().getRequest().usuario,
);
