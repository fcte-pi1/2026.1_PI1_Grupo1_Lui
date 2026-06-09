import { describe, it, expect } from 'vitest';
import { criarGridVazio } from './historyUtils';

describe('criarGridVazio', () => {
  it('cria grid 4x4 com bordas externas', () => {
    const grid = criarGridVazio(4, 4);

    expect(grid.length).toBe(4);
    expect(grid[0].length).toBe(4);

    expect(grid[0][0].sul).toBe(true);
    expect(grid[0][0].oeste).toBe(true);

    expect(grid[3][3].norte).toBe(true);
    expect(grid[3][3].leste).toBe(true);
  });
});

it('cria grid 16x16 corretamente', () => {
  const grid = criarGridVazio(16,16);

  expect(grid.length).toBe(16);
  expect(grid[0].length).toBe(16);

  expect(grid[0][15].oeste).toBe(true);
  expect(grid[15][0].leste).toBe(true);
});

import { detectarTamanho } from './historyUtils';

it('arredonda para 4', () => {
  const passos = [
    {
      x: 3,
      y: 3,
      orientacao: 'NORTE',
      paredes: []
    }
  ];

  expect(detectarTamanho(passos))
    .toEqual({ larg: 4, alt: 4 });
});

it('arredonda para 16', () => {
  const passos = [
    {
      x: 12,
      y: 13,
      orientacao: 'NORTE',
      paredes: []
    }
  ];

  expect(detectarTamanho(passos))
    .toEqual({ larg: 16, alt: 16 });
});

import {
  aplicarParede
} from './historyUtils';

it('espelha parede no vizinho', () => {
  const grid = criarGridVazio(4,4);

  aplicarParede(grid,4,4,{
    x:1,
    y:1,
    dir:'LESTE'
  });

  expect(grid[1][1].leste).toBe(true);

  expect(grid[2][1].oeste).toBe(true);
});

import { reconstruirAteStep } from './historyUtils';

it('marca apenas primeira célula visitada', () => {
  const passos = [
    {
      x:0,
      y:0,
      orientacao:'NORTE',
      paredes:[]
    },
    {
      x:1,
      y:0,
      orientacao:'LESTE',
      paredes:[]
    }
  ];

  const grid = reconstruirAteStep(
    passos,
    0,
    4,
    4
  );

  expect(grid[0][0].visitada).toBe(true);
  expect(grid[1][0].visitada).toBe(false);
});

it('marca todas as células visitadas até o final', () => {
  const passos = [
    {
      x:0,
      y:0,
      orientacao:'NORTE',
      paredes:[]
    },
    {
      x:1,
      y:0,
      orientacao:'LESTE',
      paredes:[]
    },
    {
      x:2,
      y:0,
      orientacao:'LESTE',
      paredes:[]
    }
  ];

  const grid =
    reconstruirAteStep(passos,2,4,4);

  expect(grid[0][0].visitada).toBe(true);
  expect(grid[1][0].visitada).toBe(true);
  expect(grid[2][0].visitada).toBe(true);
});

import { extrairPassos } from './historyUtils';

it('retorna array direto', () => {
  const dados = [
    {
      x:0,
      y:0,
      orientacao:'NORTE',
      paredes:[]
    }
  ];

  expect(extrairPassos(dados))
    .toEqual(dados);
});

it('retorna historico', () => {
  const historico = [
    {
      x:0,
      y:0,
      orientacao:'NORTE',
      paredes:[]
    }
  ];

  expect(
    extrairPassos({ historico })
  ).toEqual(historico);
});

it('lança erro para formato inválido', () => {
  expect(() =>
    extrairPassos({})
  ).toThrow(
    'Formato JSON não reconhecido'
  );
});

import { formatarTimestamp } from './historyUtils';

it('formata timestamp pt-BR', () => {
  const resultado =
    formatarTimestamp(
      '1780358830195'
    );

  expect(typeof resultado)
    .toBe('string');

  expect(resultado.length)
    .toBeGreaterThan(0);
});

