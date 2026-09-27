import { Module } from '@nestjs/common';
import { DestinosController } from './destinos.controller';
import { DestinosRepository } from './destinos.repository';
import { DestinosService } from './destinos.service';

@Module({
  controllers: [DestinosController],
  providers: [DestinosService, DestinosRepository],
})
export class DestinosModule {}
