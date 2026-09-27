import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

/** Lo que devuelven TODOS los stored procedures (parámetros OUT). */
export interface ResultadoSp<T = any> {
  p_codigo: number;
  p_mensaje: string;
  p_datos: T | null;
}

/**
 * Capa de acceso a datos genérica.
 * La API SOLO se comunica con PostgreSQL llamando stored procedures.
 */
@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;

  constructor(private readonly config: ConfigService) {
    this.pool = new Pool({
      host: this.config.get<string>('DB_HOST', 'localhost'),
      port: Number(this.config.get<string>('DB_PORT', '5433')),
      user: this.config.get<string>('DB_USER', 'postgres'),
      password: this.config.get<string>('DB_PASSWORD', ''),
      database: this.config.get<string>('DB_NAME', 'agencia_viajes_db'),
      max: 10,
    });
  }

  async onModuleInit() {
    try {
      const client = await this.pool.connect();
      client.release();
      this.logger.log('Conexión a PostgreSQL establecida');
    } catch (error: any) {
      this.logger.error(`No se pudo conectar a PostgreSQL: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  /**
   * Ejecuta un stored procedure y devuelve { p_codigo, p_mensaje, p_datos }.
   * @param sql  ej. 'SELECT * FROM sp_destinos_buscar($1::int)'
   */
  async ejecutarSp<T = any>(sql: string, parametros: unknown[] = []): Promise<ResultadoSp<T>> {
    try {
      const resultado = await this.pool.query(sql, parametros);
      return resultado.rows[0] as ResultadoSp<T>;
    } catch (error: any) {
      this.logger.error(`Error ejecutando SP: ${error.message}`);
      throw new InternalServerErrorException({
        statusCode: 500,
        success: false,
        message: 'Error de comunicación con la base de datos: ' + error.message,
        data: null,
      });
    }
  }
}
