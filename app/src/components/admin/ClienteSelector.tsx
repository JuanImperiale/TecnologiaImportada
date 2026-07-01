import { useMemo, useState, useEffect } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { usePedidos } from '@/hooks/usePedidos';
import { useVentas } from '@/hooks/useVentas';
import { contactoAdminService } from '@/services/contactoAdminService';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Contacto {
  celular: string;
  nombre: string;
  cuitDni?: string;
}

interface ClienteSelectorProps {
  cliente: Contacto;
  onChange: (cliente: Contacto) => void;
}

export function ClienteSelector({ cliente, onChange }: ClienteSelectorProps) {
  const { pedidos } = usePedidos();
  const { ventas } = useVentas();
  const [busqueda, setBusqueda] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCelular, setNuevoCelular] = useState('');
  const [customNames, setCustomNames] = useState<Map<string, string>>(new Map());
  const [contactosEliminados, setContactosEliminados] = useState<Set<string>>(new Set());

  // Cargar ediciones y eliminaciones guardadas de Firestore al montar
  useEffect(() => {
    const cargarEdiciones = async () => {
      const res = await contactoAdminService.getAllEdiciones();
      if (res.ok) {
        const nombres = new Map<string, string>();
        const eliminados = new Set<string>();
        
        res.data.forEach((edicion, celular) => {
          if (edicion.eliminado) {
            eliminados.add(celular);
          } else if (edicion.nombre) {
            nombres.set(celular, edicion.nombre);
          }
        });
        
        setCustomNames(nombres);
        setContactosEliminados(eliminados);
      }
    };
    
    cargarEdiciones();
  }, []);

  const contactos = useMemo(() => {
    const map = new Map<string, Contacto>();
    const add = (nombre: string, celular: string) => {
      const key = celular.replace(/\D/g, '');
      if (!key) return;
      const c = map.get(key) ?? { celular, nombre };
      if (nombre && !c.nombre) c.nombre = nombre;
      map.set(key, c);
    };
    pedidos.forEach((p) => add(p.nombre, p.celular));
    ventas.forEach((v) => v.cliente?.celular && add(v.cliente.nombre ?? '', v.cliente.celular));
    
    // Aplicar nombres editados y filtrar eliminados
    const contactosConEdiciones = [...map.values()]
      .filter((c) => !contactosEliminados.has(c.celular.replace(/\D/g, '')))
      .map((c) => ({
        ...c,
        nombre: customNames.get(c.celular.replace(/\D/g, '')) ?? c.nombre,
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    return contactosConEdiciones;
  }, [pedidos, ventas, customNames, contactosEliminados]);

  const candidatos = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return [];
    return contactos.filter((c) => c.nombre.toLowerCase().includes(term) || c.celular.includes(term)).slice(0, 8);
  }, [busqueda, contactos]);

  const onSelectContacto = (contacto: Contacto) => {
    onChange(contacto);
    setBusqueda('');
  };

  const onNuevoContacto = () => {
    if (!nuevoNombre.trim() || !nuevoCelular.trim()) return;
    onChange({
      nombre: nuevoNombre.trim(),
      celular: nuevoCelular.trim(),
    });
    setNuevoNombre('');
    setNuevoCelular('');
    setShowNew(false);
    setBusqueda('');
  };

  const onLimpiar = () => {
    onChange({ nombre: '', celular: '' });
    setBusqueda('');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Estado actual */}
      {cliente.nombre || cliente.celular ? (
        <div className="flex items-center justify-between rounded-lg border border-line bg-surface-2 p-3">
          <div className="flex-1">
            <p className="font-medium">{cliente.nombre || 'Sin nombre'}</p>
            <p className="text-sm text-text-soft">{cliente.celular}</p>
          </div>
          <button
            type="button"
            onClick={onLimpiar}
            className="flex h-8 w-8 items-center justify-center rounded text-text-soft hover:bg-surface"
            aria-label="Limpiar"
          >
            <X size={18} />
          </button>
        </div>
      ) : null}

      {/* Búsqueda */}
      <div className="relative">
        <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-soft" aria-hidden="true" />
        <Input
          placeholder="Buscar contacto por nombre o celular…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Sugerencias */}
      {busqueda.trim() && candidatos.length > 0 ? (
        <Card className="flex flex-col gap-1 p-2">
          {candidatos.map((c) => (
            <button
              key={c.celular}
              type="button"
              onClick={() => onSelectContacto(c)}
              className="flex flex-col rounded px-3 py-2 text-left hover:bg-surface-2"
            >
              <p className="font-medium text-sm">{c.nombre}</p>
              <p className="text-xs text-text-soft">{c.celular}</p>
            </button>
          ))}
        </Card>
      ) : null}

      {/* Crear nuevo */}
      {!showNew ? (
        <Button variant="ghost" size="sm" onClick={() => setShowNew(true)} className="w-full justify-center">
          <Plus size={16} className="mr-2" />
          Crear nuevo contacto
        </Button>
      ) : (
        <Card className="flex flex-col gap-3 p-4">
          <Input
            label="Nombre"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            placeholder="Ej: Juan García"
          />
          <Input
            label="Celular"
            value={nuevoCelular}
            onChange={(e) => setNuevoCelular(e.target.value)}
            placeholder="Ej: +54 9 2657 123456"
          />
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setShowNew(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={onNuevoContacto} disabled={!nuevoNombre.trim() || !nuevoCelular.trim()} className="flex-1">
              Guardar
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
