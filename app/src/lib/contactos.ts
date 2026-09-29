export function normalizarCelular(celular: string): string {
  return celular.replace(/\D/g, '');
}

export function nombreContactoBusqueda(nombre: string): string {
  return nombre.trim().toLocaleLowerCase();
}