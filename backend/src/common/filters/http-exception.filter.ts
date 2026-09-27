import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

/**
 * Todas las respuestas de error salen con el mismo formato:
 * { statusCode, success: false, message, data: null }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body: any = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (Array.isArray(body?.message)) {
        message = body.message.join(' | '); // errores de class-validator
      } else if (body?.message) {
        message = body.message;
      }
      if (status === 404 && message.startsWith('Cannot')) {
        message = 'La ruta solicitada no existe.';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    res.status(status).json({ statusCode: status, success: false, message, data: null });
  }
}
