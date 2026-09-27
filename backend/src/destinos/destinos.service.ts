import { Injectable } from '@nestjs/common';
import { construirRespuesta } from '../common/respuesta';
import { DestinosRepository } from './destinos.repository';
import { DestinoDto } from './dto/destino.dto';

@Injectable()
export class DestinosService {
  constructor(private readonly repo: DestinosRepository) {}

  async consultar() {
    return construirRespuesta(await this.repo.consultar());
  }

  async buscar(codigo: number) {
    return construirRespuesta(await this.repo.buscar(codigo));
  }

  async agregar(dto: DestinoDto) {
    return construirRespuesta(await this.repo.agregar(dto));
  }

  async editar(codigo: number, dto: DestinoDto) {
    return construirRespuesta(await this.repo.editar(codigo, dto));
  }

  async eliminar(codigo: number) {
    return construirRespuesta(await this.repo.eliminar(codigo));
  }
}
