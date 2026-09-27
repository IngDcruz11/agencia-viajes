'use client';

import { FormEvent, useState } from 'react';
import { Destino, DestinoEntrada } from '@/lib/api';

const VACIO: DestinoEntrada = {
  nombreDestino: '',
  ciudad: '',
  pais: '',
  continente: 'América',
  descripcion: '',
  clima: '',
  moneda: '',
  idiomaPrincipal: '',
  requiereVisa: 0,
  costoPromedioDiario: 0,
  estado: 1,
};

const CONTINENTES = ['América', 'Europa', 'Asia', 'África', 'Oceanía', 'Antártida'];

interface Props {
  destino: Destino | null; // null = agregar
  guardando: boolean;
  onGuardar: (datos: DestinoEntrada) => void;
  onCancelar: () => void;
}

export default function FormularioDestino({ destino, guardando, onGuardar, onCancelar }: Props) {
  const [f, setF] = useState<DestinoEntrada>(() => {
    if (!destino) return VACIO;
    const { codigoDestino: _c, fechaRegistro: _f, ...resto } = destino;
    return { ...resto, descripcion: resto.descripcion ?? '', clima: resto.clima ?? '' };
  });

  const cambiar = <K extends keyof DestinoEntrada>(k: K, v: DestinoEntrada[K]) => setF((p) => ({ ...p, [k]: v }));

  function enviar(e: FormEvent) {
    e.preventDefault();
    onGuardar({ ...f, costoPromedioDiario: Number(f.costoPromedioDiario) });
  }

  return (
    <div className="modal-fondo" onClick={onCancelar}>
      <form className="modal" onSubmit={enviar} onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>{destino ? `Editar destino #${destino.codigoDestino}` : 'Agregar destino'}</h2>
          <button type="button" className="cerrar" onClick={onCancelar} aria-label="Cerrar">×</button>
        </header>

        <div className="rejilla">
          <label className="col-2">
            Nombre del destino *
            <input value={f.nombreDestino} maxLength={120} required onChange={(e) => cambiar('nombreDestino', e.target.value)} />
          </label>
          <label>
            Ciudad *
            <input value={f.ciudad} maxLength={100} required onChange={(e) => cambiar('ciudad', e.target.value)} />
          </label>
          <label>
            País *
            <input value={f.pais} maxLength={100} required onChange={(e) => cambiar('pais', e.target.value)} />
          </label>
          <label>
            Continente *
            <select value={f.continente} onChange={(e) => cambiar('continente', e.target.value)}>
              {CONTINENTES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label>
            Clima
            <input value={f.clima ?? ''} maxLength={80} onChange={(e) => cambiar('clima', e.target.value)} />
          </label>
          <label>
            Moneda *
            <input value={f.moneda} maxLength={50} required onChange={(e) => cambiar('moneda', e.target.value)} />
          </label>
          <label>
            Idioma principal *
            <input value={f.idiomaPrincipal} maxLength={80} required onChange={(e) => cambiar('idiomaPrincipal', e.target.value)} />
          </label>
          <label>
            Costo promedio diario (Q) *
            <input
              type="number" min={0} step="0.01" required
              value={f.costoPromedioDiario}
              onChange={(e) => cambiar('costoPromedioDiario', e.target.value as unknown as number)}
            />
          </label>
          <label>
            ¿Requiere visa?
            <select value={f.requiereVisa} onChange={(e) => cambiar('requiereVisa', Number(e.target.value))}>
              <option value={0}>No</option>
              <option value={1}>Sí</option>
            </select>
          </label>
          <label>
            Estado
            <select value={f.estado} onChange={(e) => cambiar('estado', Number(e.target.value))}>
              <option value={1}>Activo</option>
              <option value={0}>Inactivo</option>
            </select>
          </label>
          <label className="col-2">
            Descripción
            <textarea rows={3} maxLength={350} value={f.descripcion ?? ''} onChange={(e) => cambiar('descripcion', e.target.value)} />
          </label>
        </div>

        <footer>
          <button type="button" className="btn btn-suave" onClick={onCancelar}>Cancelar</button>
          <button className="btn btn-primario" disabled={guardando}>
            {guardando ? 'Guardando…' : destino ? 'Guardar cambios' : 'Agregar destino'}
          </button>
        </footer>
      </form>
    </div>
  );
}
