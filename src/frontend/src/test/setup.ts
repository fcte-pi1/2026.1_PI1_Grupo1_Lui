import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Limpa o DOM apos cada teste
afterEach(() => {
  cleanup();
});
