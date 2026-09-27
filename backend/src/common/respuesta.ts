import { HttpException } from '@nestjs/common';
import { ResultadoSp } from '../database/database.service';

/** Formato JSON estándar de todas las respuestas del API. */
export interface RespuestaApi<T = any> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T | null;
}

/**
 * Convierte el resultado del SP en la respuesta del API.
 * Si el SP devolvió un código >= 400 se lanza la excepción HTTP con ese código
 * (404 no existe, 409 relacionado/duplicado, 400 datos inválidos, 500 error).
 */
export function construirRespuesta<T>(resultado: ResultadoSp<T>): RespuestaApi<T> {
  const respuesta: RespuestaApi<T> = {
    statusCode: resultado.p_codigo,
    success: resultado.p_codigo < 400,
    message: resultado.p_mensaje,
    data: resultado.p_datos ?? null,
  };

  if (!respuesta.success) {
    throw new HttpException(respuesta, respuesta.statusCode);
  }
  return respuesta;
}
