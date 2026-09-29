import { afterEach, describe, expect, it, vi } from 'vitest';
import { run } from './result';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('run Firebase error messages', () => {
  it('explains exhausted quotas without blaming the selected payment method', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = Object.assign(new Error('Quota exceeded.'), { code: 'resource-exhausted' });

    const result = await run(async () => { throw error; });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('cuota o límite de Firebase');
  });

  it('explains Firestore missing-index errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = Object.assign(new Error('The query requires an index.'), { code: 'failed-precondition' });

    const result = await run(async () => { throw error; });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('índice de Firestore');
  });
});
