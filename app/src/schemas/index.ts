import { z } from 'zod';

/**
 * Schemas Zod para validar entrada del usuario antes de escribir en Firestore.
 * Espejan las reglas de seguridad: si algo no valida acá, tampoco debería pasar
 * las Firestore Rules. Se irán completando a medida que avancen las fases.
 */

export const negocioSchema = z.enum(['productos', 'accesorios']);

export const varianteSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  sku: z.string().optional(),
  stock: z.number().int().min(0),
  costo: z.number().min(0),
  precioVenta: z.number().min(0),
});

export const productoFormSchema = z.object({
  nombre: z.string().min(2, 'El nombre es muy corto'),
  negocio: negocioSchema,
  categoriaId: z.string().min(1, 'Elegí una categoría'),
  descripcion: z.string().default(''),
  // Moneda única del producto (costo, precio y ganancia en esta moneda).
  monedaVenta: z.enum(['ARS', 'USD']).default('USD'),
  // Costo y precio en la moneda elegida (sin conversión).
  costo: z.number({ invalid_type_error: 'Costo inválido' }).min(0),
  // Cómo calcular la ganancia sugerida sobre el costo.
  gananciaModo: z.enum(['porcentaje', 'monto']).default('porcentaje'),
  gananciaValor: z.number().min(0).optional(),
  precioVenta: z.number({ invalid_type_error: 'Precio inválido' }).min(0),
  precioAnterior: z.number().min(0).optional(),
  sku: z.string().optional(),
  stock: z.number({ invalid_type_error: 'Stock inválido' }).int().min(0),
  stockMinimo: z.number().int().min(0).default(0),
  activo: z.boolean().default(true),
  destacado: z.boolean().default(false),
  variantes: z.array(varianteSchema).default([]),
});

export type ProductoForm = z.infer<typeof productoFormSchema>;

/** Validación del formulario de confirmación de carrito (nombre + teléfono en partes). */
export const confirmarPedidoSchema = z.object({
  nombre: z.string().min(2, 'Ingresá tu nombre'),
  caracteristica: z
    .string()
    .min(2, 'Mínimo 2 dígitos')
    .max(5, 'Máximo 5 dígitos')
    .regex(/^\d+$/, 'Solo dígitos'),
  numero: z
    .string()
    .length(6, 'Ingresá los 6 dígitos del celular')
    .regex(/^\d+$/, 'Solo dígitos'),
});

export type ConfirmarPedidoForm = z.infer<typeof confirmarPedidoSchema>;

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export type LoginForm = z.infer<typeof loginSchema>;
