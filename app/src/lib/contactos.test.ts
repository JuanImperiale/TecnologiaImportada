import { describe, expect, it } from 'vitest';
import { nombreContactoBusqueda, normalizarCelular } from './contactos';

describe('contactos', () => {
  it('normaliza el celular para usarlo como ID', () => {
    expect(normalizarCelular('+54 9 11-5555-1234')).toBe('5491155551234');
  });

  it('prepara el nombre para búsquedas por prefijo', () => {
    expect(nombreContactoBusqueda('  María López ')).toBe('maría lópez');
  });
});