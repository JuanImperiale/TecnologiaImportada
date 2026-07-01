import { useEffect } from 'react';

interface PageMetaInput {
  title?: string;
  robots?: string;
}

export function usePageMeta({ title, robots }: PageMetaInput) {
  useEffect(() => {
    if (title) document.title = title;

    if (!robots) return;
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', robots);
  }, [title, robots]);
}