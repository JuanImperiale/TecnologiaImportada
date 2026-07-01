import { useEffect, useState } from 'react';
import { settingsService } from '@/services/settingsService';
import type { Settings } from '@/models';

export function useBusinessSettings() {
  const [settings, setSettings] = useState<Partial<Settings>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    settingsService
      .get()
      .then((data) => {
        if (active) setSettings(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { settings, loading };
}