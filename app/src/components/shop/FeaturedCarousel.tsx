import { useCallback, useEffect, useMemo, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ProductCard } from '@/components/shop/ProductCard';
import { cn } from '@/lib/utils';
import type { Producto } from '@/models';

interface Props {
  products: Producto[];
}

function distanceToCenter(index: number, center: number, total: number) {
  if (total <= 1) return 0;
  const direct = Math.abs(index - center);
  return Math.min(direct, total - direct);
}

export function FeaturedCarousel({ products }: Props) {
  const autoplay = useMemo(
    () =>
      Autoplay({
        delay: 3000,
        stopOnInteraction: true,
        stopOnMouseEnter: true,
      }),
    [],
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: products.length > 2,
      align: 'center',
      skipSnaps: false,
      dragFree: false,
      duration: 28,
    },
    [autoplay],
  );

  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {products.map((product, index) => {
            const distance = distanceToCenter(index, selected, products.length);
            const emphasisClass =
              distance === 0
                ? 'opacity-100 scale-100 blur-0'
                : distance === 1
                  ? 'opacity-45 scale-[0.9] blur-[1px]'
                  : 'opacity-20 scale-[0.84] blur-[1.6px]';

            return (
              <div
                key={product.id}
                className="min-w-0 shrink-0 basis-[86%] px-2 sm:basis-[60%] lg:basis-[36%]"
              >
                <div
                  className={cn(
                    'origin-center transition-[transform,opacity,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
                    emphasisClass,
                  )}
                  onClick={() => emblaApi?.scrollTo(index)}
                >
                  <ProductCard product={product} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
