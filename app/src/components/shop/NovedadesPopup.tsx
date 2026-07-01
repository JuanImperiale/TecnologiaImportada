import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useNovedadesDestacadas } from '@/hooks/useNovedades';

export function NovedadesPopup() {
  const navigate = useNavigate();
  const { novedades } = useNovedadesDestacadas();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // Solo mostrar si hay novedades destacadas y no se mostró antes en esta sesión.
    if (novedades.length > 0) {
      const hasShownInSession = sessionStorage.getItem('novedades_popup_shown');
      if (!hasShownInSession) {
        setShown(true);
        sessionStorage.setItem('novedades_popup_shown', 'true');
      }
    }
  }, [novedades]);

  if (!shown) return null;

  return (
    <Modal open={shown} onClose={() => setShown(false)} title="Novedades">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-2">
          <p className="text-text-soft">Mira los últimos contenidos y promociones.</p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={() => setShown(false)}
            className="flex-1"
          >
            Cerrar
          </Button>
          <Button
            onClick={() => {
              navigate('/novedades');
              setShown(false);
            }}
            className="flex-1"
          >
            Ver novedades
          </Button>
        </div>
      </div>
    </Modal>
  );
}
