import { describe, expect, it } from 'vitest';
import { chunk, matchesSearch, PUBLIC_SITE_URL, productPublicUrl } from './utils';

describe('productPublicUrl', () => {
  it('builds the public product link on the production domain', () => {
    expect(productPublicUrl('92i3FIefch1qfdL99qCR')).toBe(
      `${PUBLIC_SITE_URL}/producto/92i3FIefch1qfdL99qCR`,
    );
    expect(PUBLIC_SITE_URL).not.toMatch(/\/$/);
  });

  it('encodes unsafe characters in the id', () => {
    expect(productPublicUrl('a/b c')).toBe(`${PUBLIC_SITE_URL}/producto/a%2Fb%20c`);
  });
});

describe('chunk', () => {
  it('splits into groups of the given size', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns no groups for an empty list', () => {
    expect(chunk([], 30)).toEqual([]);
  });

  it('keeps 30 labels per page', () => {
    const pages = chunk(Array.from({ length: 61 }, (_, i) => i), 30);
    expect(pages.map((p) => p.length)).toEqual([30, 30, 1]);
  });
});

describe('matchesSearch', () => {
  it('matches every word in any order, case and accent insensitive', () => {
    expect(matchesSearch('PRO airpods', 'AirPods Pro 3')).toBe(true);
    expect(matchesSearch('cafe', 'Café')).toBe(true);
  });

  it('requires all words to be present across fields', () => {
    expect(matchesSearch('cable micro', 'Cable Silicone Color', 'USB to Micro')).toBe(true);
    expect(matchesSearch('cable lightning', 'Cable Silicone USB to Micro')).toBe(false);
  });

  it('matches everything for an empty query and ignores missing fields', () => {
    expect(matchesSearch('   ', 'x')).toBe(true);
    expect(matchesSearch('sku1', undefined, null, 'SKU1')).toBe(true);
  });
});
