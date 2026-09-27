import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface UsuarioBd {
  codigoUsuario: number;
  nombreUsuario: string;
  nombreCompleto: string;
  rol: string;
}

/** Acceso a datos de usuarios: SOLO stored procedures. */
@Injectable()
export class AuthRepository {
  constructor(private readonly db: DatabaseService) {}

  registrar(nombreUsuario: string, contrasena: string, nombreCompleto: string) {
    return this.db.ejecutarSp<UsuarioBd>(
      'SELECT * FROM sp_usuarios_registrar($1::varchar, $2::varchar, $3::varchar)',
      [nombreUsuario, contrasena, nombreCompleto],
    );
  }

  login(nombreUsuario: string, contrasena: string, refreshToken: string, minutosRefresh: number) {
    return this.db.ejecutarSp<UsuarioBd>(
      'SELECT * FROM sp_usuarios_login($1::varchar, $2::varchar, $3::varchar, $4::int)',
      [nombreUsuario, contrasena, refreshToken, minutosRefresh],
    );
  }

  refresh(refreshActual: string, refreshNuevo: string, minutosRefresh: number) {
    return this.db.ejecutarSp<UsuarioBd>(
      'SELECT * FROM sp_usuarios_refresh($1::varchar, $2::varchar, $3::int)',
      [refreshActual, refreshNuevo, minutosRefresh],
    );
  }

  logout(refreshToken: string) {
    return this.db.ejecutarSp('SELECT * FROM sp_usuarios_logout($1::varchar)', [refreshToken]);
  }

  perfil(codigoUsuario: number) {
    return this.db.ejecutarSp<UsuarioBd>('SELECT * FROM sp_usuarios_perfil($1::int)', [codigoUsuario]);
  }
}
