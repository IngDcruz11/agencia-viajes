import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DestinosService } from './destinos.service';
import { DestinoDto } from './dto/destino.dto';

const codigoPipe = new ParseIntPipe({
  exceptionFactory: () => new BadRequestException('El código del destino debe ser un número entero.'),
});

@Controller('destinos')
@UseGuards(JwtAuthGuard) // todas las rutas requieren access token
export class DestinosController {
  constructor(private readonly destinosService: DestinosService) {}

  // CONSULTAR  GET /api/destinos
  @Get()
  consultar() {
    return this.destinosService.consultar();
  }

  // BUSCAR  GET /api/destinos/:codigo
  @Get(':codigo')
  buscar(@Param('codigo', codigoPipe) codigo: number) {
    return this.destinosService.buscar(codigo);
  }

  // AGREGAR  POST /api/destinos
  @Post()
  @HttpCode(201)
  agregar(@Body() dto: DestinoDto) {
    return this.destinosService.agregar(dto);
  }

  // EDITAR  PUT /api/destinos/:codigo
  @Put(':codigo')
  editar(@Param('codigo', codigoPipe) codigo: number, @Body() dto: DestinoDto) {
    return this.destinosService.editar(codigo, dto);
  }

  // ELIMINAR  DELETE /api/destinos/:codigo
  @Delete(':codigo')
  eliminar(@Param('codigo', codigoPipe) codigo: number) {
    return this.destinosService.eliminar(codigo);
  }
}
