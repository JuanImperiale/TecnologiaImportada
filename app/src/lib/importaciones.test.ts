import { describe, expect, it } from 'vitest';
import type { Producto } from '@/models';
import { buscarProductosImportacion } from './importaciones';

function producto(id: string, negocio: Producto['negocio']): Producto {
  return {
    id, negocio, nombre: `Cable USB ${negocio} ${id}`, slug: id, categoriaId: 'cat',
    descripcion: '', monedaVenta: 'ARS', precioVenta: 100, costo: 50,
    stock: 0, stockMinimo: 0, imagenes: [], activo: true, destacado: false,
    creado: {} as Producto['creado'], actualizado: {} as Producto['actualizado'],
  };
}

describe('buscarProductosImportacion', () => {
  it('returns matching active catalog products from both business units, excluding items already added', () => {
    const productos = [producto('1', 'productos'), producto('2', 'accesorios')];

    expect(buscarProductosImportacion(productos, 'usb', [], new Map())).toEqual(productos);
    expect(buscarProductosImportacion(productos, 'usb', ['1'], new Map())).toEqual([productos[1]]);
    expect(buscarProductosImportacion(productos, '  ', [], new Map())).toEqual([]);
  });
});