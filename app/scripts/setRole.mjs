/**
 * (Sin uso) — El proyecto NO maneja roles.
 *
 * Decisión de negocio: cualquier usuario habilitado en Firebase Authentication
 * (Email/Password) que pueda iniciar sesión tiene acceso completo al panel.
 * El control de acceso es la propia lista de usuarios de Firebase Auth:
 * para dar de alta o de baja a alguien, se gestiona desde la consola de Firebase
 * (Authentication → Usuarios), no con custom claims.
 *
 * Este archivo queda solo como referencia; no se ejecuta.
 */
console.log('Este proyecto no usa roles. Gestioná los accesos en Firebase Auth → Usuarios.');
