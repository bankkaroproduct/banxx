import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

/**
 * jsdom does not implement matchMedia. Navigation reads
 * prefers-reduced-motion through it, so without this the component tests fail
 * on the environment rather than on behaviour.
 *
 * Defaults to "does not match", i.e. motion is allowed, which is the branch the
 * existing assertions were written against.
 */
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}
