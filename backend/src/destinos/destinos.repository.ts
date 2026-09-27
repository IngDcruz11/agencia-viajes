import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { DestinoDto } from './dto/destino.dto';

/** Acceso a datos de Tbl_Destinos: ÚNICAMENTE por stored procedures. */
@Injectable()
export class DestinosRepository {
  constructor(private readonly db: DatabaseService) {}

  consultar() {
    return this.db.ejecutarSp('SELECT * FROM sp_destinos_consultar()');
  }

  buscar(codigo: number) {
    return this.db.ejecutarSp('SELECT * FROM sp_destinos_buscar($1::int)', [codigo]);
  }

  agregar(d: DestinoDto) {
    return this.db.ejecutarSp(
      `SELECT * FROM sp_destinos_agregar(
         $1::varchar, $2::varchar, $3::varchar, $4::varchar, $5::varchar, $6::varchar,
         $7::varchar, $8::varchar, $9::smallint, $10::numeric, $11::smallint)`,
      [
        d.nombreDestino, d.ciudad, d.pais, d.continente, d.descripcion ?? null, d.clima ?? null,
        d.moneda, d.idiomaPrincipal, d.requiereVisa, d.costoPromedioDiario, d.estado ?? 1,
      ],
    );
  }

  editar(codigo: number, d: DestinoDto) {
    return this.db.ejecutarSp(
      `SELECT * FROM sp_destinos_editar(
         $1::int, $2::varchar, $3::varchar, $4::varchar, $5::varchar, $6::varchar, $7::varchar,
         $8::varchar, $9::varchar, $10::smallint, $11::numeric, $12::smallint)`,
      [
        codigo, d.nombreDestino, d.ciudad, d.pais, d.continente, d.descripcion ?? null, d.clima ?? null,
        d.moneda, d.idiomaPrincipal, d.requiereVisa, d.costoPromedioDiario, d.estado ?? 1,
      ],
    );
  }

  eliminar(codigo: number) {
    return this.db.ejecutarSp('SELECT * FROM sp_destinos_eliminar($1::int)', [codigo]);
  }
}
