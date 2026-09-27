'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import BarraSesion from '@/components/BarraSesion';
import FormularioDestino from '@/components/FormularioDestino';
import { ApiError, Destino, DestinoEntrada, destinosApi, EVENTO_SESION, logout, obtenerSesion } from '@/lib/api';

type Aviso = { ok: boolean; msg: string } | null;

const quetzales = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' });

export default function DestinosPage() {
  const router = useRouter();
  const [listo, setListo] = useState(false);
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState<Aviso>(null);
  const [codigoBuscar, setCodigoBuscar] = useState('');
  const [resultadoBusqueda, setResultadoBusqueda] = useState<Destino | null>(null);
  const [filtro, setFiltro] = useState('');
  const [formulario, setFormulario] = useState<{ abierto: boolean; destino: Destino | null }>({ abierto: false, destino: null });
  const [guardando, setGuardando] = useState(false);

  const mostrar = useCallback((ok: boolean, msg: string) => {
    setAviso({ ok, msg });
    window.setTimeout(() => setAviso((a) => (a?.msg === msg ? null : a)), 5000);
  }, []);

  const manejarError = useCallback(
    (e: unknown) => mostrar(false, e instanceof ApiError ? `${e.statusCode ? `[${e.statusCode}] ` : ''}${e.message}` : 'Error inesperado.'),
    [mostrar],
  );

  // ------------------------------ CONSULTAR ----------------------------------
  const consultar = useCallback(async (silencioso = false) => {
    setCargando(true);
    try {
      const r = await destinosApi.consultar();
      setDestinos(r.data ?? []);
      if (!silencioso) mostrar(true, r.message);
    } catch (e) {
      manejarError(e);
    } finally {
      setCargando(false);
    }
  }, [mostrar, manejarError]);

  // Protección de ruta + redirección si la sesión se cierra (refresh expirado)
  useEffect(() => {
    if (!obtenerSesion()) {
      router.replace('/login');
      return;
    }
    setListo(true);
    consultar(true);
    const vigilar = () => { if (!obtenerSesion()) router.replace('/login'); };
    window.addEventListener(EVENTO_SESION, vigilar);
    return () => window.removeEventListener(EVENTO_SESION, vigilar);
  }, [router, consultar]);

  // ------------------------------- BUSCAR ------------------------------------
  async function buscar(e: FormEvent) {
    e.preventDefault();
    const codigo = Number(codigoBuscar);
    if (!Number.isInteger(codigo) || codigo <= 0) {
      mostrar(false, 'Ingrese un código de destino válido (entero mayor a cero).');
      return;
    }
    try {
      const r = await destinosApi.buscar(codigo);
      setResultadoBusqueda(r.data);
      mostrar(true, r.message);
    } catch (err) {
      setResultadoBusqueda(null);
      manejarError(err);
    }
  }

  // -------------------------- AGREGAR / EDITAR -------------------------------
  async function guardar(datos: DestinoEntrada) {
    setGuardando(true);
    try {
      const r = formulario.destino
        ? await destinosApi.editar(formulario.destino.codigoDestino, datos)
        : await destinosApi.agregar(datos);
      mostrar(true, r.message);
      setFormulario({ abierto: false, destino: null });
      setResultadoBusqueda(null);
      await consultar(true);
    } catch (e) {
      manejarError(e);
    } finally {
      setGuardando(false);
    }
  }

  // ------------------------------ ELIMINAR -----------------------------------
  async function eliminar(d: Destino) {
    if (!window.confirm(`¿Eliminar el destino #${d.codigoDestino} "${d.nombreDestino}"?`)) return;
    try {
      const r = await destinosApi.eliminar(d.codigoDestino);
      mostrar(true, r.message);
      setResultadoBusqueda(null);
      await consultar(true);
    } catch (e) {
      manejarError(e);
    }
  }

  async function salir() {
    await logout();
    router.replace('/login');
  }

  const filas = useMemo(() => {
    if (resultadoBusqueda) return [resultadoBusqueda];
    const t = filtro.trim().toLowerCase();
    if (!t) return destinos;
    return destinos.filter((d) =>
      [d.nombreDestino, d.ciudad, d.pais, d.continente, d.idiomaPrincipal].some((v) => v.toLowerCase().includes(t)),
    );
  }, [destinos, filtro, resultadoBusqueda]);

  if (!listo) return null;

  return (
    <main className="contenedor">
      <header className="encabezado">
        <div className="marca">
          <span className="marca-icono" aria-hidden>✈</span>
          <div>
            <h1>Destinos</h1>
            <p>Agencia de Viajes y Turismo Multisucursal · Tbl_Destinos</p>
          </div>
        </div>
        <BarraSesion onSalir={salir} onAviso={mostrar} />
      </header>

      {aviso && (
        <div className={`alerta ${aviso.ok ? 'alerta-ok' : 'alerta-error'}`} role="status">
          {aviso.msg}
          <button className="cerrar" onClick={() => setAviso(null)} aria-label="Cerrar">×</button>
        </div>
      )}

      <section className="herramientas">
        <form className="buscar" onSubmit={buscar}>
          <input
            type="number" min={1} placeholder="Buscar por código"
            value={codigoBuscar} onChange={(e) => setCodigoBuscar(e.target.value)}
          />
          <button className="btn btn-suave">Buscar</button>
          {resultadoBusqueda && (
            <button type="button" className="btn btn-suave" onClick={() => { setResultadoBusqueda(null); setCodigoBuscar(''); }}>
              Ver todos
            </button>
          )}
        </form>
        <input
          className="filtro" placeholder="Filtrar por nombre, ciudad, país…"
          value={filtro} onChange={(e) => setFiltro(e.target.value)} disabled={!!resultadoBusqueda}
        />
        <button className="btn btn-suave" onClick={() => consultar()} disabled={cargando}>
          {cargando ? 'Consultando…' : 'Consultar'}
        </button>
        <button className="btn btn-primario" onClick={() => setFormulario({ abierto: true, destino: null })}>
          + Agregar destino
        </button>
      </section>

      <div className="tabla-envoltura">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Destino</th>
              <th>Continente</th>
              <th>Moneda / Idioma</th>
              <th>Visa</th>
              <th className="num">Costo diario</th>
              <th>Registro</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 && (
              <tr><td colSpan={9} className="vacio">{cargando ? 'Cargando…' : 'No hay destinos para mostrar.'}</td></tr>
            )}
            {filas.map((d) => (
              <tr key={d.codigoDestino}>
                <td className="codigo">#{d.codigoDestino}</td>
                <td>
                  <b>{d.nombreDestino}</b>
                  <small>{d.ciudad}, {d.pais}{d.clima ? ` · ${d.clima}` : ''}</small>
                </td>
                <td>{d.continente}</td>
                <td>{d.moneda}<small>{d.idiomaPrincipal}</small></td>
                <td>{d.requiereVisa ? <span className="chip chip-aviso">Sí</span> : <span className="chip">No</span>}</td>
                <td className="num">{quetzales.format(Number(d.costoPromedioDiario))}</td>
                <td>{d.fechaRegistro}</td>
                <td>{d.estado ? <span className="chip chip-ok">Activo</span> : <span className="chip chip-off">Inactivo</span>}</td>
                <td className="acciones">
                  <button className="btn btn-mini" onClick={() => setFormulario({ abierto: true, destino: d })}>Editar</button>
                  <button className="btn btn-mini btn-peligro" onClick={() => eliminar(d)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {formulario.abierto && (
        <FormularioDestino
          destino={formulario.destino}
          guardando={guardando}
          onGuardar={guardar}
          onCancelar={() => setFormulario({ abierto: false, destino: null })}
        />
      )}
    </main>
  );
}
