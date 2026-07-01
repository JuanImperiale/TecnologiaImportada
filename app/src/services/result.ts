/**
 * Resultado tipado para los services. Evita try/catch sueltos en la UI:
 * cada service devuelve { ok: true, data } | { ok: false, error }.
 */
export type Result<T> = { ok: true; data: T } | { ok: false; error: AppError };

export interface AppError {
  /** Código corto para distinguir el tipo de error. */
  code: string;
  /** Mensaje legible para mostrar al usuario (en español). */
  message: string;
  /** Error original, para logging. */
  cause?: unknown;
}

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail(code: string, message: string, cause?: unknown): Result<never> {
  return { ok: false, error: { code, message, cause } };
}

/** Mapea errores de Firebase a mensajes claros en español. */
function messageFromError(error: unknown): { code: string; message: string } {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : 'unknown';

  const map: Record<string, string> = {
    'permission-denied': 'No tenés permisos para esta acción.',
    unauthenticated: 'Necesitás iniciar sesión.',
    'auth/invalid-credential': 'Email o contraseña incorrectos.',
    'auth/invalid-email': 'El email no es válido.',
    'auth/user-not-found': 'No existe un usuario con ese email.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/too-many-requests': 'Demasiados intentos. Probá más tarde.',
    unavailable: 'Sin conexión con el servidor. Revisá tu internet.',
  };

  return { code, message: map[code] ?? 'Ocurrió un error inesperado. Intentá de nuevo.' };
}

/**
 * Envuelve una operación async y la convierte en Result.
 * Loguea el error original y devuelve un mensaje amigable.
 */
export async function run<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return ok(await fn());
  } catch (error) {
    const { code, message } = messageFromError(error);
    console.error(`[service:${code}]`, error);
    return fail(code, message, error);
  }
}
