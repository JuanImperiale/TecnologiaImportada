import { useContext } from 'react';
import { ThemeContext } from '@/providers/ThemeProvider';

/** Acceso al tema actual y al setter. Debe usarse dentro de <ThemeProvider>. */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return ctx;
}
