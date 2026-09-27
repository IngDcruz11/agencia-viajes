'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, login, obtenerSesion } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState('admin');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (obtenerSesion()) router.replace('/destinos');
  }, [router]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await login(usuario, contrasena);
      router.replace('/destinos');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error inesperado.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="login-fondo">
      <form className="login-tarjeta" onSubmit={enviar}>
        <div className="marca">
          <span className="marca-icono" aria-hidden>✈</span>
          <div>
            <h1>Agencia de Viajes</h1>
            <p>Turismo Multisucursal · Destinos</p>
          </div>
        </div>

        <label>
          Usuario
          <input value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" required />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <div className="alerta alerta-error">{error}</div>}

        <button className="btn btn-primario btn-ancho" disabled={cargando}>
          {cargando ? 'Ingresando…' : 'Iniciar sesión'}
        </button>
        <p className="pista">Usuario de prueba: <b>admin</b> / <b>Admin123</b></p>
      </form>
    </main>
  );
}
