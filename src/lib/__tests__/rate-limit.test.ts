import { describe, expect, it } from 'vitest';
import { createRateLimiter } from '../rate-limit';

describe('createRateLimiter', () => {
  it('allows up to the limit per client per window, then resets', () => {
    let time = 0;
    const allow = createRateLimiter({ limit: 2, windowMs: 1000, now: () => time });

    const firstWindow = [allow('a'), allow('a'), allow('a'), allow('b')];
    time = 1000;
    const nextWindow = allow('a');

    expect(firstWindow).toEqual([true, true, false, true]);
    expect(nextWindow).toBe(true);
  });
});
