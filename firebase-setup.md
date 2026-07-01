# Configuración de Firebase — Tecnología Importada

Proyecto Firebase: **`tecnologiaimportada`**. Config ya creada por el dueño.
Documentos relacionados: `architecture.md`, `admin-modules.md`.

## Archivos

- `.env.local` — variables reales (NO se commitea). Ya cargado con la config.
- `.env.example` — plantilla con las claves vacías (sí se commitea).

## Variables (Vite)

Vite expone al cliente solo las variables con prefijo `VITE_`. Mapeo:

| Variable | Valor |
|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSyAXaSfco5fdH6NzKlWcMFDBCuJUmWgVygQ` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `tecnologiaimportada.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `tecnologiaimportada` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `tecnologiaimportada.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `946457419036` |
| `VITE_FIREBASE_APP_ID` | `1:946457419036:web:8c504d8396a9a7b1a9aed9` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-TQVX9YJTDS` |

## Init recomendado (`src/lib/firebase.ts`)

Cuando armemos el proyecto, este es el punto único de inicialización. Lee de las env vars (no hardcodea la config):

```ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics solo si el entorno lo soporta (evita errores en dev/SSR)
export const analyticsPromise = isSupported().then((ok) => (ok ? getAnalytics(app) : null));
```

Los `services/` importan `db`, `auth` y `storage` desde acá. Ningún componente inicializa Firebase por su cuenta.

## Seguridad — recordatorios

- La **apiKey de Firebase Web no es secreta**: identifica el proyecto, no da acceso. Es normal y seguro que viaje al cliente. Por eso, aunque la pongamos en `.env.local`, igual va a quedar embebida en el bundle.
- La protección real es: **Firestore Security Rules + App Check**. No hay roles: cualquier usuario autenticado accede. Ver `architecture.md` §5.
- Activar **App Check (reCAPTCHA)** para proteger la creación anónima de pedidos.
- Restringir la API key en Google Cloud Console (por dominio/HTTP referrer y por APIs habilitadas) como capa extra.

## `.gitignore` (cuando creemos el repo)

```
node_modules
dist
.env.local
.env.*.local
```

## Pendiente de habilitar en la consola de Firebase (verificar)

- **Firestore Database** creada (modo producción) con las reglas de `architecture.md`.
- **Authentication**: proveedor Email/Password para el equipo. (El público no inicia sesión.) Cada usuario creado acá tiene acceso completo al panel; no hay roles.
- **Storage** habilitado para imágenes de producto.
- **Hosting** inicializado (`firebase init hosting`) apuntando a `dist/`.
- **App Check** con reCAPTCHA.
- (Sin roles ni custom claims: el acceso lo define la lista de usuarios de Auth.)
