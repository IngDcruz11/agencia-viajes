'use client';

import { useEffect, useState } from 'react';
import { ApiError, EVENTO_SESION, obtenerSesion, renovarSesion, Sesion } from '@/lib/api';

/** Muestra el usuario, el tiempo restante del access token y botones de sesión. */
export default function BarraSesion({ onSalir, onAviso }: { onSalir: () => void; onAviso: (ok: boolean, msg: string) => void }) {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [ahora, setAhora] = useState(Date.now());

  useEffect(() => {
    const actualizar = () => setSesion(obtenerSesion());
    actualizar();
    window.addEventListener(EVENTO_SESION, actualizar);
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => {
      window.removeEventListener(EVENTO_SESION, actualizar);
      clearInterval(t);
    };
  }, []);

  if (!sesion) return null;

  const restante = Math.max(0, Math.floor((new Date(sesion.accessTokenExpiraEn).getTime() - ahora) / 1000));
  const mm = String(Math.floor(restante / 60)).padStart(2, '0');
  const ss = String(restante % 60).padStart(2, '0');

  async function renovar() {
    try {
      await renovarSesion();
      onAviso(true, 'Token renovado exitosamente.');
    } catch (e) {
      onAviso(false, e instanceof ApiError ? e.message : 'No se pudo renovar el token.');
    }
  }

  return (
    <div className="barra-sesion">
      <div className="usuario">
        <span className="avatar">{sesion.usuario.nombreCompleto.charAt(0)}</span>
        <div>
          <b>{sesion.usuario.nombreCompleto}</b>
          <small>@{sesion.usuario.nombreUsuario} · {sesion.usuario.rol}</small>
        </div>
      </div>
      <div className={`token ${restante === 0 ? 'token-expirado' : ''}`} title="Tiempo de vida del access token">
        <small>Access token</small>
        <b>{restante === 0 ? 'expirado · se renovará solo' : `${mm}:${ss}`}</b>
      </div>
      <button className="btn btn-suave" onClick={renovar}>Renovar token</button>
      <button className="btn btn-suave" onClick={onSalir}>Cerrar sesión</button>
    </div>
  );
}
