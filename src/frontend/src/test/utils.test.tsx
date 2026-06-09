import { describe, it, expect } from 'vitest';
import { cn } from '../app/lib/utils';

describe('cn (class name merger)', () => {
  it('concatena strings simples', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
  });

  it('remove falsy values (null, undefined, false)', () => {
    expect(cn('base', null, undefined, false, 'extra')).toBe('base extra');
  });

  it('resolve conflitos Tailwind — última classe vence', () => {
    // p-4 e p-2 conflitam → p-2 deve prevalecer
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('resolve conflitos com condicionais', () => {
    expect(cn('px-4 py-2', true && 'px-2')).toBe('py-2 px-2');
    expect(cn('px-4 py-2', false && 'px-2')).toBe('px-4 py-2');
  });

  it('suporta arrays aninhados', () => {
    expect(cn('base', ['nested-1', ['nested-2']])).toBe('base nested-1 nested-2');
  });

  it('remove duplicatas de classes utilitárias', () => {
    // twMerge deve colapsar classes conflitantes
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('retorna string vazia sem argumentos', () => {
    expect(cn()).toBe('');
  });

  it('mantém classes não-Tailwind intactas', () => {
    expect(cn('custom-class', 'another-custom')).toBe('custom-class another-custom');
  });

  it('lida com objetos de classe (clsx)', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
  });

  it('lida com margens e padding conflitantes', () => {
    expect(cn('m-2 p-4', 'm-4')).toBe('p-4 m-4');
  });
});
