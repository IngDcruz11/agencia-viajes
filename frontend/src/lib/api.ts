// =============================================================================
// Cliente HTTP del frontend
// - Guarda accessToken y refreshToken en localStorage
// - Envía "Authorization: Bearer <accessToken>" en cada petición protegida
// - Si el API responde 401 (token expirado) llama a /auth/refresh UNA vez,
//   guarda los tokens nuevos y reintenta la petición automáticamente.
// =============================================================================

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export interface RespuestaApi<T = any> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T | null;
}

export interface Usuario {
  codigoUsuario: number;
  nombreUsuario: string;
  nombreCompleto: string;
  rol: string;
}

export interface Sesion {
  accessToken: string;
  accessTokenExpiraEn: string;
  refreshToken: string;
  refreshTokenExpiraEn: string;
  usuario: Usuario;
}

export interface Destino {
  codigoDestino: number;
  nombreDestino: string;
  ciudad: string;
  pais: string;
  continente: string;
  descripcion: string | null;
  clima: string | null;
  moneda: string;
  idiomaPrincipal: string;
  requiereVisa: number;
  costoPromedioDiario: number;
  fechaRegistro: string;
  estado: number;
}

export type DestinoEntrada = Omit<Destino, 'codigoDestino' | 'fechaRegistro'>;

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

// ----------------------------- sesión ----------------------------------------
const CLAVE = 'agencia_sesion';
export const EVENTO_SESION = 'agencia-sesion-cambio';

export function obtenerSesion(): Sesion | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CLAVE);
    return raw ? (JSON.parse(raw) as Sesion) : null;
  } catch {
    return null;
  }
}

function guardarSesion(sesion: Sesion | null) {
  if (sesion) localStorage.setItem(CLAVE, JSON.stringify(sesion));
  else localStorage.removeItem(CLAVE);
  window.dispatchEvent(new Event(EVENTO_SESION));
}

// --------------------------- petición base -----------------------------------
async function peticion<T>(ruta: string, opciones: RequestInit = {}, token?: string): Promise<RespuestaApi<T>> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${ruta}`, {
      ...opciones,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opciones.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el API. ¿Está corriendo el backend en ' + API_URL + '?');
  }

  let cuerpo: RespuestaApi<T>;
  try {
    cuerpo = await res.json();
  } catch {
    throw new ApiError(res.status, `Respuesta inválida del servidor (HTTP ${res.status}).`);
  }
  if (!res.ok || !cuerpo.success) {
    throw new ApiError(cuerpo.statusCode ?? res.status, cuerpo.message ?? 'Error desconocido.');
  }
  return cuerpo;
}

// --------------------------- refresh token -----------------------------------
let refreshEnCurso: Promise<Sesion> | null = null;

/** Renueva los tokens. Si hay varias peticiones a la vez, comparten un solo refresh. */
export function renovarSesion(): Promise<Sesion> {
  if (!refreshEnCurso) {
    refreshEnCurso = (async () => {
      const actual = obtenerSesion();
      if (!actual) throw new ApiError(401, 'No hay sesión activa.');
      try {
        const r = await peticion<Sesion>('/auth/refresh', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: actual.refreshToken }),
        });
        guardarSesion(r.data!);
        return r.data!;
      } catch (e) {
        guardarSesion(null); // refresh inválido/expirado -> cerrar sesión
        throw e;
      }
    })().finally(() => {
      refreshEnCurso = null;
    });
  }
  return refreshEnCurso;
}

/** Petición protegida con reintento automático tras refrescar el token. */
export async function apiProtegida<T>(ruta: string, opciones: RequestInit = {}): Promise<RespuestaApi<T>> {
  const sesion = obtenerSesion();
  if (!sesion) throw new ApiError(401, 'Sesión no iniciada.');
  try {
    return await peticion<T>(ruta, opciones, sesion.accessToken);
  } catch (e) {
    if (e instanceof ApiError && e.statusCode === 401) {
      const nueva = await renovarSesion();
      return peticion<T>(ruta, opciones, nueva.accessToken);
    }
    throw e;
  }
}

// ------------------------------ auth -----------------------------------------
export async function login(nombreUsuario: string, contrasena: string) {
  const r = await peticion<Sesion>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ nombreUsuario, contrasena }),
  });
  guardarSesion(r.data!);
  return r;
}

export async function logout() {
  const sesion = obtenerSesion();
  try {
    if (sesion) {
      await peticion('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: sesion.refreshToken }),
      });
    }
  } finally {
    guardarSesion(null);
  }
}

// ----------------------------- destinos --------------------------------------
export const destinosApi = {
  consultar: () => apiProtegida<Destino[]>('/destinos'),
  buscar: (codigo: number) => apiProtegida<Destino>(`/destinos/${codigo}`),
  agregar: (d: DestinoEntrada) =>
    apiProtegida<Destino>('/destinos', { method: 'POST', body: JSON.stringify(d) }),
  editar: (codigo: number, d: DestinoEntrada) =>
    apiProtegida<Destino>(`/destinos/${codigo}`, { method: 'PUT', body: JSON.stringify(d) }),
  eliminar: (codigo: number) => apiProtegida<Destino>(`/destinos/${codigo}`, { method: 'DELETE' }),
};
