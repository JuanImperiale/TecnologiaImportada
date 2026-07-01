import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { run, type Result } from './result';

export interface SessionUser {
  uid: string;
  email: string | null;
}

/**
 * Modelo de acceso: NO hay roles. Cualquier usuario creado en Firebase Auth
 * (Email/Password) que pueda iniciar sesión tiene acceso completo al panel.
 * El "portero" es el login: solo entran usuarios habilitados en la consola.
 */
export const authService = {
  /** Inicia sesión con email y contraseña. */
  login(email: string, password: string): Promise<Result<void>> {
    return run(async () => {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    });
  },

  /** Cierra la sesión. */
  logout(): Promise<Result<void>> {
    return run(async () => {
      await signOut(auth);
    });
  },

  /** Observa la sesión. Devuelve la función para desuscribirse. */
  observe(callback: (user: SessionUser | null) => void): () => void {
    return onAuthStateChanged(auth, (u: User | null) => {
      callback(u ? { uid: u.uid, email: u.email } : null);
    });
  },
};
