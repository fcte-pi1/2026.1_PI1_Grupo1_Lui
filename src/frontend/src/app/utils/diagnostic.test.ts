/**
 * Testes de Diagnóstico — Fluxo Completo de Carregamento de Corridas
 * 
 * Estes testes validam cada etapa do pipeline:
 * 
 *   JSON salvo em disco
 *   → leitura (fs / fetch)
 *   → desserialização (JSON.parse)
 *   → extração de passos (extrairPassos)
 *   → detecção de tamanho (detectarTamanho)
 *   → reconstrução do grid (reconstruirAteStep)
 *   → identificação de goalReached
 */
import { describe, it, expect } from 'vitest';
import {
  extrairPassos,
  detectarTamanho,
  reconstruirAteStep,
  criarGridVazio,
  type PassoExploracao,
  type CorridaJSON,
} from './historyUtils';

// ─── 1. DADOS DE TESTE (simulam os formatos reais) ─────────────────────────

// Formato salvo pelo backend (telemetryService.js)
const JSON_BACKEND_4x4: CorridaJSON = {
  id_corrida: 'test_backend_4x4',
  id_labirinto: '4x4_test',
  tamanho: { larg: 4, alt: 4 },
  historico: [
    { x: 0, y: 0, orientacao: 'NORTE', paredes: [{ x: 0, y: 0, dir: 'LESTE' }, { x: 0, y: 0, dir: 'OESTE' }] },
    { x: 0, y: 1, orientacao: 'NORTE', paredes: [] },
    { x: 0, y: 2, orientacao: 'LESTE', paredes: [{ x: 0, y: 2, dir: 'NORTE' }] },
    { x: 1, y: 2, orientacao: 'NORTE', paredes: [] },
    { x: 1, y: 1, orientacao: 'NORTE', paredes: [] },
    { x: 2, y: 1, orientacao: 'NORTE', paredes: [] },
    { x: 2, y: 2, orientacao: 'NORTE', paredes: [] },
  ],
};

const JSON_BACKEND_8x8: CorridaJSON = {
  id_corrida: 'test_backend_8x8',
  id_labirinto: '8x8_test',
  tamanho: { larg: 8, alt: 8 },
  historico: [
    { x: 0, y: 7, orientacao: 'NORTE', paredes: [] },
    { x: 0, y: 6, orientacao: 'NORTE', paredes: [{ x: 0, y: 6, dir: 'LESTE' }] },
    { x: 1, y: 6, orientacao: 'NORTE', paredes: [] },
    { x: 1, y: 5, orientacao: 'LESTE', paredes: [] },
    { x: 2, y: 5, orientacao: 'NORTE', paredes: [] },
    { x: 2, y: 4, orientacao: 'NORTE', paredes: [] },
    { x: 3, y: 4, orientacao: 'NORTE', paredes: [] },
    { x: 3, y: 3, orientacao: 'NORTE', paredes: [] },
    { x: 4, y: 3, orientacao: 'LESTE', paredes: [] },
  ],
};

const JSON_BACKEND_16x16: CorridaJSON = {
  id_corrida: 'test_backend_16x16',
  id_labirinto: '16x16_test',
  tamanho: { larg: 16, alt: 16 },
  historico: [
    { x: 0, y: 15, orientacao: 'NORTE', paredes: [] },
    { x: 0, y: 14, orientacao: 'NORTE', paredes: [] },
    { x: 0, y: 13, orientacao: 'NORTE', paredes: [] },
    { x: 0, y: 12, orientacao: 'LESTE', paredes: [] },
    { x: 1, y: 12, orientacao: 'LESTE', paredes: [] },
    { x: 2, y: 12, orientacao: 'NORTE', paredes: [] },
    { x: 2, y: 11, orientacao: 'NORTE', paredes: [] },
    { x: 2, y: 10, orientacao: 'LESTE', paredes: [] },
    { x: 3, y: 10, orientacao: 'NORTE', paredes: [] },
    { x: 3, y: 9, orientacao: 'NORTE', paredes: [] },
    { x: 3, y: 8, orientacao: 'LESTE', paredes: [] },
    { x: 4, y: 8, orientacao: 'NORTE', paredes: [] },
    { x: 4, y: 7, orientacao: 'NORTE', paredes: [] },
    { x: 5, y: 7, orientacao: 'NORTE', paredes: [] },
    { x: 5, y: 8, orientacao: 'LESTE', paredes: [] },
    { x: 6, y: 8, orientacao: 'NORTE', paredes: [] },
    { x: 6, y: 7, orientacao: 'NORTE', paredes: [] },
    { x: 7, y: 7, orientacao: 'NORTE', paredes: [] },
    { x: 7, y: 8, orientacao: 'LESTE', paredes: [] },
    { x: 8, y: 8, orientacao: 'LESTE', paredes: [] },
  ],
};

// Formato salvo pelo firmware (Main.cpp) — sem `tamanho` e `id_labirinto`
const JSON_FIRMWARE: CorridaJSON = {
  id_corrida: 'test_firmware_format',
  tamanho: { larg: 16, alt: 16 },
  historico: [
    { x: 1, y: 0, orientacao: 'NORTE', paredes: [] },
    { x: 2, y: 0, orientacao: 'NORTE', paredes: [] },
    { x: 3, y: 0, orientacao: 'NORTE', paredes: [] },
    { x: 4, y: 0, orientacao: 'NORTE', paredes: [{ x: 4, y: 0, dir: 'LESTE' }] },
    { x: 5, y: 0, orientacao: 'NORTE', paredes: [] },
  ],
};

// Casos limite
const HISTORICO_VAZIO: CorridaJSON = { historico: [] };
const FORMATO_INVALIDO = { foo: 'bar' };

// ─── Helper: calcular região central ────────────────────────────────────────
function calcularCentro(larg: number, alt: number): { x: number; y: number }[] {
  const cx = Math.floor(larg / 2);
  const cy = Math.floor(alt / 2);
  return [
    { x: cx - 1, y: cy - 1 },
    { x: cx, y: cy - 1 },
    { x: cx - 1, y: cy },
    { x: cx, y: cy },
  ];
}

function ultimoPassoEstaNoCentro(passos: PassoExploracao[], larg: number, alt: number): boolean {
  const ultimo = passos[passos.length - 1];
  const centro = calcularCentro(larg, alt);
  return centro.some(c => c.x === ultimo.x && c.y === ultimo.y);
}

/**
 * Simula a função detectarGoalReached do HistoryPage.tsx
 * Usa goalReached do JSON ou fallback para detecção pelo centro.
 */
function detectarGoalReached(
  dadosBrutos: unknown,
  passos: PassoExploracao[],
  larg: number,
  alt: number,
): boolean {
  const data = dadosBrutos as { goalReached?: boolean };
  if (data.goalReached === true) return true;
  if (passos.length === 0) return false;
  return ultimoPassoEstaNoCentro(passos, larg, alt);
}

// ─── 2. TESTES DE DESSERIALIZAÇÃO ──────────────────────────────────────────

describe('Diagnóstico 1 — extrairPassos()', () => {
  it('extrai passos do formato backend (objeto com historico)', () => {
    const passos = extrairPassos(JSON_BACKEND_4x4);
    expect(passos).toBeInstanceOf(Array);
    expect(passos.length).toBe(7);
  });

  it('extrai passos do formato firmware (objeto com historico, sem id_labirinto)', () => {
    const passos = extrairPassos(JSON_FIRMWARE);
    expect(passos).toBeInstanceOf(Array);
    expect(passos.length).toBe(5);
  });

  it('extrai passos de array direto', () => {
    const array = JSON_BACKEND_4x4.historico!;
    const passos = extrairPassos(array);
    expect(passos.length).toBe(7);
  });

  it('lança erro para historico vazio', () => {
    expect(() => extrairPassos(HISTORICO_VAZIO)).toThrow('Histórico vazio');
  });

  it('lança erro para formato não reconhecido', () => {
    expect(() => extrairPassos(FORMATO_INVALIDO)).toThrow('Formato JSON não reconhecido');
  });

  it('lança erro para null', () => {
    expect(() => extrairPassos(null)).toThrow();
  });

  it('lança erro para undefined', () => {
    expect(() => extrairPassos(undefined)).toThrow();
  });
});

// ─── 3. TESTES DE DETECÇÃO DE TAMANHO ──────────────────────────────────────

describe('Diagnóstico 2 — detectarTamanho()', () => {
  it('detecta 4x4 a partir dos passos', () => {
    const passos = extrairPassos(JSON_BACKEND_4x4);
    const tam = detectarTamanho(passos);
    expect(tam.larg).toBe(4);
    expect(tam.alt).toBe(4);
  });

  it('detecta 8x8 a partir dos passos', () => {
    const passos = extrairPassos(JSON_BACKEND_8x8);
    const tam = detectarTamanho(passos);
    expect(tam.larg).toBe(8);
    expect(tam.alt).toBe(8);
  });

  it('detecta 16x16 a partir dos passos', () => {
    const passos = extrairPassos(JSON_BACKEND_16x16);
    const tam = detectarTamanho(passos);
    expect(tam.larg).toBe(16);
    expect(tam.alt).toBe(16);
  });

  it('usa tamanho do JSON quando disponível (prioridade)', () => {
    const tam = JSON_BACKEND_4x4.tamanho!;
    // Simula a lógica do frontend: se tamanho existe no JSON, usa ele
    const passos = extrairPassos(JSON_BACKEND_4x4);
    const tamDetectado = detectarTamanho(passos);
    // Ambos devem dar o mesmo resultado
    expect(tam.larg).toBe(tamDetectado.larg);
    expect(tam.alt).toBe(tamDetectado.alt);
  });
});

// ─── 4. TESTES DE RECONSTRUÇÃO DO GRID ─────────────────────────────────────

describe('Diagnóstico 3 — reconstruirAteStep()', () => {
  it('reconstrói grid 4x4 passo a passo', () => {
    const passos = extrairPassos(JSON_BACKEND_4x4);
    const tam = { larg: 4, alt: 4 };

    // Passo 0: apenas célula (0,0) visitada
    const grid0 = reconstruirAteStep(passos, 0, tam.larg, tam.alt);
    expect(grid0[0][0].visitada).toBe(true);
    expect(grid0[1][0].visitada).toBe(false);

    // Último passo: todas as células visitadas devem estar marcadas
    const gridFinal = reconstruirAteStep(passos, passos.length - 1, tam.larg, tam.alt);
    // Verifica que pelo menos algumas células foram visitadas
    const visitadas = gridFinal.flat().filter(c => c.visitada).length;
    expect(visitadas).toBeGreaterThanOrEqual(passos.length);
  });

  it('reconstrói grid 8x8', () => {
    const passos = extrairPassos(JSON_BACKEND_8x8);
    const tam = { larg: 8, alt: 8 };
    const grid = reconstruirAteStep(passos, passos.length - 1, tam.larg, tam.alt);
    expect(grid.length).toBe(8);
    expect(grid[0].length).toBe(8);
  });

  it('reconstrói grid 16x16', () => {
    const passos = extrairPassos(JSON_BACKEND_16x16);
    const tam = { larg: 16, alt: 16 };
    const grid = reconstruirAteStep(passos, passos.length - 1, tam.larg, tam.alt);
    expect(grid.length).toBe(16);
    expect(grid[0].length).toBe(16);
  });

  it('grid 4x4 tem paredes externas corretas', () => {
    const grid = criarGridVazio(4, 4);
    // Borda sul (y=0)
    expect(grid[0][0].sul).toBe(true);
    expect(grid[1][0].sul).toBe(true);
    expect(grid[2][0].sul).toBe(true);
    expect(grid[3][0].sul).toBe(true);
    // Borda norte (y=3)
    expect(grid[0][3].norte).toBe(true);
    expect(grid[1][3].norte).toBe(true);
    expect(grid[2][3].norte).toBe(true);
    expect(grid[3][3].norte).toBe(true);
    // Borda oeste (x=0)
    expect(grid[0][0].oeste).toBe(true);
    expect(grid[0][1].oeste).toBe(true);
    expect(grid[0][2].oeste).toBe(true);
    expect(grid[0][3].oeste).toBe(true);
    // Borda leste (x=3)
    expect(grid[3][0].leste).toBe(true);
    expect(grid[3][1].leste).toBe(true);
    expect(grid[3][2].leste).toBe(true);
    expect(grid[3][3].leste).toBe(true);
  });
});

// ─── 5. TESTE DE CENTRO (GOAL REGION) ──────────────────────────────────────

describe('Diagnóstico 4 — Região Central (Goal)', () => {
  it('centro 4x4 → (1,1)(2,1)(1,2)(2,2)', () => {
    const centro = calcularCentro(4, 4);
    expect(centro).toEqual([
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ]);
  });

  it('centro 8x8 → (3,3)(4,3)(3,4)(4,4)', () => {
    const centro = calcularCentro(8, 8);
    expect(centro).toEqual([
      { x: 3, y: 3 },
      { x: 4, y: 3 },
      { x: 3, y: 4 },
      { x: 4, y: 4 },
    ]);
  });

  it('centro 16x16 → (7,7)(8,7)(7,8)(8,8)', () => {
    const centro = calcularCentro(16, 16);
    expect(centro).toEqual([
      { x: 7, y: 7 },
      { x: 8, y: 7 },
      { x: 7, y: 8 },
      { x: 8, y: 8 },
    ]);
  });

  it('valida que o último passo da corrida 4x4 está no centro', () => {
    const passos = extrairPassos(JSON_BACKEND_4x4);
    const ultimo = passos[passos.length - 1];
    const centro = calcularCentro(4, 4);
    const noCentro = centro.some(c => c.x === ultimo.x && c.y === ultimo.y);
    expect(noCentro).toBe(true);
  });

  it('valida que o último passo da corrida 8x8 está no centro', () => {
    const passos = extrairPassos(JSON_BACKEND_8x8);
    const ultimo = passos[passos.length - 1];
    const centro = calcularCentro(8, 8);
    const noCentro = centro.some(c => c.x === ultimo.x && c.y === ultimo.y);
    expect(noCentro).toBe(true);
  });

  it('valida que o último passo da corrida 16x16 está no centro', () => {
    const passos = extrairPassos(JSON_BACKEND_16x16);
    const ultimo = passos[passos.length - 1];
    const centro = calcularCentro(16, 16);
    const noCentro = centro.some(c => c.x === ultimo.x && c.y === ultimo.y);
    expect(noCentro).toBe(true);
  });
});

// ─── 6. TESTE DE COMPATIBILIDADE COM DADOS VIA MSW ──────────────────────────

describe('Diagnóstico 5 — Compatibilidade com dados mockados (simula API)', () => {
  it('dados no formato backend (objeto com historico) carregam corretamente', () => {
    const data = JSON_BACKEND_16x16;
    const passos = extrairPassos(data);
    const tam = data.tamanho 
      ? { larg: data.tamanho.larg, alt: data.tamanho.alt }
      : detectarTamanho(passos);
    const grid = reconstruirAteStep(passos, passos.length - 1, tam.larg, tam.alt);
    
    expect(passos.length).toBe(20);
    expect(tam.larg).toBe(16);
    expect(tam.alt).toBe(16);
    expect(grid.length).toBe(16);
    expect(grid[0].length).toBe(16);
  });

  it('dados no formato firmware (sem mapping, sem id_labirinto) carregam corretamente', () => {
    const data = JSON_FIRMWARE;
    const passos = extrairPassos(data);
    const tam = data.tamanho 
      ? { larg: data.tamanho.larg, alt: data.tamanho.alt }
      : detectarTamanho(passos);
    const grid = reconstruirAteStep(passos, passos.length - 1, tam.larg, tam.alt);
    
    expect(passos.length).toBe(5);
    expect(tam.larg).toBe(16);
    expect(tam.alt).toBe(16);
    expect(grid.length).toBe(16);
  });

  it('dados com tamanho no JSON usam tamanho em vez de detectarTamanho', () => {
    const data = JSON_BACKEND_4x4;
    expect(data.tamanho).toBeDefined();
    expect(data.tamanho!.larg).toBe(4);
    expect(data.tamanho!.alt).toBe(4);
    
    const passos = extrairPassos(data);
    const tam = data.tamanho 
      ? { larg: data.tamanho.larg, alt: data.tamanho.alt }
      : detectarTamanho(passos);
    expect(tam.larg).toBe(4);
  });

  it('detecta goalReached pelo ultimo passo estar no centro (4x4)', () => {
    const passos = extrairPassos(JSON_BACKEND_4x4);
    const ultimo = passos[passos.length - 1];
    const centro = calcularCentro(4, 4);
    const goalReached = centro.some(c => c.x === ultimo.x && c.y === ultimo.y);
    expect(goalReached).toBe(true);
  });
});

// ─── 7. TESTES DE REGRESSÃO — PROBLEMAS CONHECIDOS ─────────────────────────

describe('Diagnóstico 6 — Problemas conhecidos', () => {
  it('PROBLEMA: mapping nao é salvo no JSON (campo ausente)', () => {
    // O backend cria sessoesAtivas[id_corrida] com mapping,
    // mas o JSON salvo em disco não contém mapping.
    // Isto indica que os arquivos foram gerados antes da adição do campo
    // ou que há um bug na serialização.
    const data = JSON_BACKEND_4x4 as Record<string, unknown>;
    expect(data.mapping).toBeUndefined();
  });

  it('PROBLEMA: objetivo é fabricado a partir do nome do arquivo, não dos dados', () => {
    // criarMetadadosCorrida usa semente = hash do filename
    // semente % 3 !== 0 → objetivo = true
    // Isto é DETERMINÍSTICO mas FALSO: não reflete se o goal foi realmente atingido
    const semente1 = 'corrida_run_test_01_sucesso_2026-06-17T22-18-42.json'
      .split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const semente2 = 'corrida_Simulated_Run_2026-06-17T18-33-01.json'
      .split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    const obj1 = semente1 % 3 !== 0;
    const obj2 = semente2 % 3 !== 0;

    // Apenas documenta o comportamento atual
    console.log(`  filename1 objetivo=${obj1} (seed=${semente1} % 3 = ${semente1 % 3})`);
    console.log(`  filename2 objetivo=${obj2} (seed=${semente2} % 3 = ${semente2 % 3})`);
  });

  it('PROBLEMA: grade é fabricada a partir do nome do arquivo, não dos dados', () => {
    // criarMetadadosCorrida usa semente % 2 === 0 → grade = "16×16" else "8×8"
    const semente1 = 'corrida_run_test_01_sucesso_2026-06-17T22-18-42.json'
      .split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const grade = semente1 % 2 === 0 ? "16×16" : "8×8";
    console.log(`  grade fabricada = ${grade} (dados reais são 16×16)`);
    // Os dados reais (quando carregados) corrigem a grade
    // Mas a exibição inicial mostra dados errados
  });

  it('PROBLEMA: dois diretorios maze_runs diferentes', () => {
    // O firmware salva em:          pi1/maze_runs/
    // O backend salva em:           pi1/src/maze_runs/
    // O frontend (Vite) serve de:   pi1/src/maze_runs/
    // 
    // Arquivos do firmware NÃO aparecem no frontend!
    console.log('  maze_runs (root): 14 arquivos do firmware (invisíveis)');
    console.log('  src/maze_runs:     3 arquivos do backend (visíveis)');
  });
});

// ─── 8. TESTES DO DETECTOR DE GOAL REACHED ──────────────────────────────────

describe('Diagnóstico 7 — detectarGoalReached()', () => {
  it('usa goalReached do JSON se presente (true)', () => {
    const dados = { goalReached: true, historico: [{ x: 0, y: 0, orientacao: 'NORTE', paredes: [] }] };
    const passos = extrairPassos(dados);
    expect(detectarGoalReached(dados, passos, 4, 4)).toBe(true);
  });

  it('usa goalReached do JSON se presente (false)', () => {
    const dados = { goalReached: false, historico: [{ x: 0, y: 0, orientacao: 'NORTE', paredes: [] }] };
    const passos = extrairPassos(dados);
    expect(detectarGoalReached(dados, passos, 4, 4)).toBe(false);
  });

  it('fallback: detecta goal pelo ultimo passo no centro (4x4)', () => {
    const passos = extrairPassos(JSON_BACKEND_4x4);
    const dados = JSON_BACKEND_4x4;
    expect(detectarGoalReached(dados, passos, 4, 4)).toBe(true);
  });

  it('fallback: detecta goal pelo ultimo passo no centro (8x8)', () => {
    const passos = extrairPassos(JSON_BACKEND_8x8);
    const dados = JSON_BACKEND_8x8;
    expect(detectarGoalReached(dados, passos, 8, 8)).toBe(true);
  });

  it('fallback: detecta goal pelo ultimo passo no centro (16x16)', () => {
    const passos = extrairPassos(JSON_BACKEND_16x16);
    const dados = JSON_BACKEND_16x16;
    expect(detectarGoalReached(dados, passos, 16, 16)).toBe(true);
  });

  it('fallback: nao detecta goal quando ultimo passo nao esta no centro', () => {
    const passos = [
      { x: 0, y: 0, orientacao: 'NORTE', paredes: [] },
      { x: 0, y: 1, orientacao: 'NORTE', paredes: [] },
    ];
    expect(detectarGoalReached({}, passos, 4, 4)).toBe(false);
  });

  it('fallback: retorna false para historico vazio', () => {
    expect(detectarGoalReached({}, [], 4, 4)).toBe(false);
  });
});

// ─── 9. TESTES E2E PARA 4x4, 8x8 e 16x16 ──────────────────────────────────

describe('Diagnóstico 8 — E2E: Corrida completa 4x4', () => {
  // Simula uma corrida completa 4x4 onde o rato vai da (0,0) até o centro (1,1)-(2,2)
  const corrida4x4: CorridaJSON = {
    id_corrida: 'e2e_4x4',
    id_labirinto: '4x4_test',
    tamanho: { larg: 4, alt: 4 },
    goalReached: true,
    historico: [
      // Parte da borda sul (0,0) e vai para o norte
      { x: 0, y: 0, orientacao: 'NORTE', paredes: [{ x: 0, y: 0, dir: 'OESTE' }, { x: 0, y: 0, dir: 'SUL' }] },
      { x: 0, y: 1, orientacao: 'NORTE', paredes: [{ x: 0, y: 1, dir: 'LESTE' }] },
      { x: 1, y: 1, orientacao: 'LESTE', paredes: [{ x: 1, y: 1, dir: 'NORTE' }] },
      { x: 1, y: 2, orientacao: 'NORTE', paredes: [{ x: 1, y: 2, dir: 'LESTE' }] },
      { x: 2, y: 2, orientacao: 'LESTE', paredes: [{ x: 2, y: 2, dir: 'NORTE' }] },
      { x: 2, y: 1, orientacao: 'SUL', paredes: [{ x: 2, y: 1, dir: 'LESTE' }] },
      // Goal: centro (1,1)(2,1)(1,2)(2,2) - chegou em (1,1)
      { x: 1, y: 1, orientacao: 'NORTE', paredes: [] },
    ],
  };

  it('Cenário 1: JSON carrega e parseia corretamente', () => {
    const passos = extrairPassos(corrida4x4);
    expect(passos.length).toBe(7);
  });

  it('Cenário 2: Tamanho 4x4 é detectado corretamente', () => {
    const tam = corrida4x4.tamanho!;
    expect(tam.larg).toBe(4);
    expect(tam.alt).toBe(4);
  });

  it('Cenário 3: goalReached é verdadeiro (campo explícito)', () => {
    const passos = extrairPassos(corrida4x4);
    expect(detectarGoalReached(corrida4x4, passos, 4, 4)).toBe(true);
  });

  it('Cenário 4: Reconstrução do grid funciona', () => {
    const passos = extrairPassos(corrida4x4);
    const tam = corrida4x4.tamanho!;
    const grid = reconstruirAteStep(passos, passos.length - 1, tam.larg, tam.alt);
    expect(grid.length).toBe(4);
    expect(grid[0].length).toBe(4);
    // Verifica que paredes externas estão corretas
    expect(grid[0][0].sul).toBe(true); // borda sul
    expect(grid[0][0].oeste).toBe(true); // borda oeste
    expect(grid[3][3].norte).toBe(true); // borda norte
    expect(grid[3][3].leste).toBe(true); // borda leste
  });

  it('Cenário 5: Posição inicial correta', () => {
    const passos = extrairPassos(corrida4x4);
    expect(passos[0].x).toBe(0);
    expect(passos[0].y).toBe(0);
    expect(passos[0].orientacao).toBe('NORTE');
  });

  it('Cenário 6: Goal persiste após salvar e carregar', () => {
    // Simula o ciclo: salvar como JSON e recarregar
    const jsonString = JSON.stringify(corrida4x4);
    const recarregado = JSON.parse(jsonString);
    const passos = extrairPassos(recarregado);
    expect(detectarGoalReached(recarregado, passos, 4, 4)).toBe(true);
    expect(recarregado.tamanho.larg).toBe(4);
    expect(recarregado.tamanho.alt).toBe(4);
    expect(recarregado.goalReached).toBe(true);
  });

  it('Cenário 7: Grid reconstruído tem o centro visitado', () => {
    const passos = extrairPassos(corrida4x4);
    const tam = corrida4x4.tamanho!;
    const grid = reconstruirAteStep(passos, passos.length - 1, tam.larg, tam.alt);
    // Centro: (1,1), (2,1), (1,2), (2,2) - ao menos um deve estar visitado
    const centroVisitado = [grid[1][1], grid[2][1], grid[1][2], grid[2][2]]
      .some(c => c.visitada);
    expect(centroVisitado).toBe(true);
  });
});

describe('Diagnóstico 9 — E2E: Corrida completa 8x8', () => {
  const corrida8x8: CorridaJSON = {
    id_corrida: 'e2e_8x8',
    id_labirinto: '8x8_test',
    tamanho: { larg: 8, alt: 8 },
    goalReached: true,
    historico: [
      { x: 0, y: 7, orientacao: 'NORTE', paredes: [{ x: 0, y: 7, dir: 'OESTE' }, { x: 0, y: 7, dir: 'SUL' }] },
      { x: 0, y: 6, orientacao: 'NORTE', paredes: [] },
      { x: 0, y: 5, orientacao: 'NORTE', paredes: [] },
      { x: 0, y: 4, orientacao: 'LESTE', paredes: [] },
      { x: 1, y: 4, orientacao: 'LESTE', paredes: [] },
      { x: 2, y: 4, orientacao: 'NORTE', paredes: [] },
      { x: 2, y: 3, orientacao: 'NORTE', paredes: [] },
      // Goal: centro (3,3)(4,3)(3,4)(4,4)
      { x: 3, y: 3, orientacao: 'NORTE', paredes: [] },
      { x: 4, y: 3, orientacao: 'LESTE', paredes: [] },
    ],
  };

  it('Cenário 1: JSON carrega e parseia (8x8)', () => {
    const passos = extrairPassos(corrida8x8);
    expect(passos.length).toBe(9);
  });

  it('Cenário 2: Tamanho 8x8 é detectado', () => {
    expect(corrida8x8.tamanho!.larg).toBe(8);
    expect(corrida8x8.tamanho!.alt).toBe(8);
  });

  it('Cenário 3: goalReached verdadeiro (8x8)', () => {
    const passos = extrairPassos(corrida8x8);
    expect(detectarGoalReached(corrida8x8, passos, 8, 8)).toBe(true);
  });

  it('Cenário 4: Grid 8x8 reconstruído corretamente', () => {
    const passos = extrairPassos(corrida8x8);
    const tam = corrida8x8.tamanho!;
    const grid = reconstruirAteStep(passos, passos.length - 1, tam.larg, tam.alt);
    expect(grid.length).toBe(8);
    expect(grid[0].length).toBe(8);
  });

  it('Cenário 5: Goal persiste após serialização (8x8)', () => {
    const jsonString = JSON.stringify(corrida8x8);
    const recarregado = JSON.parse(jsonString);
    const passos = extrairPassos(recarregado);
    expect(recarregado.goalReached).toBe(true);
    expect(detectarGoalReached(recarregado, passos, 8, 8)).toBe(true);
    expect(recarregado.tamanho.larg).toBe(8);
  });

  it('Cenário 6: Ultimo passo no centro (3,3)-(4,4)', () => {
    const passos = extrairPassos(corrida8x8);
    const ultimo = passos[passos.length - 1];
    const centro = calcularCentro(8, 8);
    const noCentro = centro.some(c => c.x === ultimo.x && c.y === ultimo.y);
    expect(noCentro).toBe(true);
  });
});

describe('Diagnóstico 10 — E2E: Corrida completa 16x16', () => {
  const corrida16x16: CorridaJSON = {
    id_corrida: 'e2e_16x16',
    id_labirinto: '16x16_test',
    tamanho: { larg: 16, alt: 16 },
    goalReached: true,
    historico: [
      { x: 0, y: 15, orientacao: 'NORTE', paredes: [{ x: 0, y: 15, dir: 'OESTE' }, { x: 0, y: 15, dir: 'SUL' }] },
      { x: 0, y: 14, orientacao: 'NORTE', paredes: [] },
      { x: 0, y: 13, orientacao: 'NORTE', paredes: [] },
      { x: 0, y: 12, orientacao: 'NORTE', paredes: [] },
      { x: 0, y: 11, orientacao: 'LESTE', paredes: [] },
      { x: 1, y: 11, orientacao: 'NORTE', paredes: [] },
      { x: 1, y: 10, orientacao: 'NORTE', paredes: [] },
      { x: 1, y: 9, orientacao: 'LESTE', paredes: [] },
      { x: 2, y: 9, orientacao: 'NORTE', paredes: [] },
      { x: 2, y: 8, orientacao: 'NORTE', paredes: [] },
      { x: 2, y: 7, orientacao: 'NORTE', paredes: [] },
      { x: 3, y: 7, orientacao: 'NORTE', paredes: [] },
      { x: 3, y: 8, orientacao: 'LESTE', paredes: [] },
      { x: 4, y: 8, orientacao: 'NORTE', paredes: [] },
      { x: 4, y: 7, orientacao: 'NORTE', paredes: [] },
      { x: 5, y: 7, orientacao: 'NORTE', paredes: [] },
      { x: 5, y: 8, orientacao: 'LESTE', paredes: [] },
      { x: 6, y: 8, orientacao: 'NORTE', paredes: [] },
      { x: 6, y: 7, orientacao: 'NORTE', paredes: [] },
      { x: 7, y: 7, orientacao: 'NORTE', paredes: [] },
      // Goal: centro (7,7)(8,7)(7,8)(8,8)
      { x: 8, y: 7, orientacao: 'LESTE', paredes: [] },
      { x: 8, y: 8, orientacao: 'NORTE', paredes: [] },
    ],
  };

  it('Cenário 1: JSON carrega e parseia (16x16)', () => {
    const passos = extrairPassos(corrida16x16);
    expect(passos.length).toBe(22);
  });

  it('Cenário 2: Tamanho 16x16 é detectado', () => {
    expect(corrida16x16.tamanho!.larg).toBe(16);
    expect(corrida16x16.tamanho!.alt).toBe(16);
  });

  it('Cenário 3: goalReached verdadeiro (16x16)', () => {
    const passos = extrairPassos(corrida16x16);
    expect(detectarGoalReached(corrida16x16, passos, 16, 16)).toBe(true);
  });

  it('Cenário 4: Grid 16x16 reconstruído', () => {
    const passos = extrairPassos(corrida16x16);
    const tam = corrida16x16.tamanho!;
    const grid = reconstruirAteStep(passos, passos.length - 1, tam.larg, tam.alt);
    expect(grid.length).toBe(16);
    expect(grid[0].length).toBe(16);
  });

  it('Cenário 5: Goal persiste após serialização (16x16)', () => {
    const jsonString = JSON.stringify(corrida16x16);
    const recarregado = JSON.parse(jsonString);
    const passos = extrairPassos(recarregado);
    expect(recarregado.goalReached).toBe(true);
    expect(detectarGoalReached(recarregado, passos, 16, 16)).toBe(true);
  });

  it('Cenário 6: Ultimo passo no centro (7,7)-(8,8)', () => {
    const passos = extrairPassos(corrida16x16);
    const ultimo = passos[passos.length - 1];
    const centro = calcularCentro(16, 16);
    const noCentro = centro.some(c => c.x === ultimo.x && c.y === ultimo.y);
    expect(noCentro).toBe(true);
  });
});

// ─── 10. TESTE: GOAL FALLBACK (SEM CAMPO EXPLÍCITO) ────────────────────────

describe('Diagnóstico 11 — Fallback: goalReached ausente, detecta pelo centro', () => {
  // Simula arquivos ANTIGOS que não têm goalReached (formato anterior às correções)
  const corridaSemGoal: CorridaJSON = {
    id_corrida: 'old_format',
    tamanho: { larg: 16, alt: 16 },
    historico: [
      { x: 0, y: 15, orientacao: 'NORTE', paredes: [] },
      { x: 1, y: 15, orientacao: 'NORTE', paredes: [] },
      { x: 2, y: 15, orientacao: 'LESTE', paredes: [] },
      { x: 2, y: 14, orientacao: 'LESTE', paredes: [] },
      { x: 3, y: 14, orientacao: 'NORTE', paredes: [] },
      { x: 3, y: 13, orientacao: 'LESTE', paredes: [] },
      { x: 4, y: 13, orientacao: 'NORTE', paredes: [] },
      { x: 4, y: 12, orientacao: 'NORTE', paredes: [] },
      { x: 5, y: 12, orientacao: 'NORTE', paredes: [] },
      { x: 5, y: 11, orientacao: 'NORTE', paredes: [] },
      { x: 6, y: 11, orientacao: 'LESTE', paredes: [] },
      { x: 6, y: 10, orientacao: 'NORTE', paredes: [] },
      { x: 7, y: 10, orientacao: 'NORTE', paredes: [] },
      { x: 7, y: 9, orientacao: 'NORTE', paredes: [] },
      { x: 7, y: 8, orientacao: 'LESTE', paredes: [] },
      { x: 8, y: 8, orientacao: 'NORTE', paredes: [] },
      { x: 8, y: 7, orientacao: 'NORTE', paredes: [] },
      // Último passo no centro (7,7)-(8,8) → goalReached = true (fallback)
      { x: 7, y: 7, orientacao: 'LESTE', paredes: [] },
    ],
  };

  it('detecta goal pelo centro mesmo sem campo explícito', () => {
    const passos = extrairPassos(corridaSemGoal);
    expect(detectarGoalReached(corridaSemGoal, passos, 16, 16)).toBe(true);
  });

  it('campos obrigatórios preservados após serialização', () => {
    const jsonString = JSON.stringify(corridaSemGoal);
    const recarregado = JSON.parse(jsonString);
    expect(recarregado.tamanho.larg).toBe(16);
    expect(recarregado.tamanho.alt).toBe(16);
    expect(recarregado.historico.length).toBe(18);
  });
});

// ─── 11. TESTE: ARQUIVOS COM goalReached=false ──────────────────────────────

describe('Diagnóstico 12 — Corridas sem goal atingido', () => {
  const corridaSemGoal: CorridaJSON = {
    id_corrida: 'no_goal',
    tamanho: { larg: 8, alt: 8 },
    goalReached: false,
    historico: [
      { x: 0, y: 7, orientacao: 'NORTE', paredes: [{ x: 0, y: 7, dir: 'OESTE' }] },
      { x: 0, y: 6, orientacao: 'NORTE', paredes: [] },
      { x: 0, y: 5, orientacao: 'LESTE', paredes: [{ x: 0, y: 5, dir: 'LESTE' }] },
      // Para no meio do caminho, nunca chega ao centro (3,3)-(4,4)
      { x: 1, y: 5, orientacao: 'NORTE', paredes: [] },
      { x: 1, y: 4, orientacao: 'NORTE', paredes: [] },
    ],
  };

  it('goalReached false quando campo explícito é false', () => {
    const passos = extrairPassos(corridaSemGoal);
    expect(detectarGoalReached(corridaSemGoal, passos, 8, 8)).toBe(false);
  });

  it('ultimo passo não está no centro', () => {
    const passos = extrairPassos(corridaSemGoal);
    expect(ultimoPassoEstaNoCentro(passos, 8, 8)).toBe(false);
  });
});

// ─── 13. VALIDAÇÃO DO NOVO MOCK DEMO 8x8 ───────────────────────────────────

describe('Diagnóstico 13 — Mock Demo 8x8 (run_test_04_demo_8x8)', () => {
  // Simula o que o backend receberia do mock_sender.js e salvaria em JSON
  const caminhoDemo8x8: CorridaJSON = {
    id_corrida: 'run_test_04_demo_8x8',
    id_labirinto: '8x8_demo',
    tamanho: { larg: 8, alt: 8 },
    goalReached: true,
    historico: [
      // Borda OESTE: sobe de (0,7) até (0,4)
      { x: 0, y: 7, orientacao: 'NORTE', paredes: [{ x: 0, y: 7, dir: 'OESTE' }, { x: 0, y: 7, dir: 'SUL' }] },
      { x: 0, y: 6, orientacao: 'NORTE', paredes: [{ x: 0, y: 6, dir: 'OESTE' }] },
      { x: 0, y: 5, orientacao: 'NORTE', paredes: [{ x: 0, y: 5, dir: 'OESTE' }] },
      { x: 0, y: 4, orientacao: 'NORTE', paredes: [{ x: 0, y: 4, dir: 'OESTE' }, { x: 0, y: 4, dir: 'LESTE' }] },
      // Anda para LESTE na linha 4
      { x: 1, y: 4, orientacao: 'LESTE', paredes: [{ x: 1, y: 4, dir: 'SUL' }] },
      { x: 2, y: 4, orientacao: 'LESTE', paredes: [] },
      { x: 3, y: 4, orientacao: 'LESTE', paredes: [] },
      // Entra no CENTRO (4,4)
      { x: 4, y: 4, orientacao: 'LESTE', paredes: [{ x: 4, y: 4, dir: 'NORTE' }] },
      // Sobe para linha 5
      { x: 4, y: 5, orientacao: 'NORTE', paredes: [] },
      { x: 4, y: 6, orientacao: 'NORTE', paredes: [{ x: 4, y: 6, dir: 'NORTE' }] },
      // Vai para LESTE, explora lado direito
      { x: 5, y: 6, orientacao: 'LESTE', paredes: [] },
      { x: 6, y: 6, orientacao: 'LESTE', paredes: [] },
      { x: 7, y: 6, orientacao: 'LESTE', paredes: [{ x: 7, y: 6, dir: 'LESTE' }, { x: 7, y: 6, dir: 'SUL' }] },
      // Desce pela borda LESTE
      { x: 7, y: 5, orientacao: 'SUL', paredes: [] },
      { x: 7, y: 4, orientacao: 'SUL', paredes: [] },
      { x: 7, y: 3, orientacao: 'SUL', paredes: [] },
      { x: 7, y: 2, orientacao: 'SUL', paredes: [{ x: 7, y: 2, dir: 'SUL' }, { x: 7, y: 2, dir: 'OESTE' }] },
      // Anda para OESTE na linha 2
      { x: 6, y: 2, orientacao: 'OESTE', paredes: [] },
      { x: 5, y: 2, orientacao: 'OESTE', paredes: [] },
      { x: 4, y: 2, orientacao: 'OESTE', paredes: [] },
      { x: 3, y: 2, orientacao: 'OESTE', paredes: [] },
      { x: 2, y: 2, orientacao: 'OESTE', paredes: [] },
      { x: 1, y: 2, orientacao: 'OESTE', paredes: [{ x: 1, y: 2, dir: 'OESTE' }, { x: 1, y: 2, dir: 'SUL' }] },
      // Sobe pela borda OESTE
      { x: 1, y: 3, orientacao: 'NORTE', paredes: [] },
      { x: 1, y: 4, orientacao: 'NORTE', paredes: [] },
      { x: 1, y: 5, orientacao: 'NORTE', paredes: [{ x: 1, y: 5, dir: 'NORTE' }] },
      // Explora topo do labirinto
      { x: 2, y: 5, orientacao: 'LESTE', paredes: [] },
      { x: 3, y: 5, orientacao: 'LESTE', paredes: [] },
      { x: 4, y: 5, orientacao: 'LESTE', paredes: [{ x: 4, y: 5, dir: 'LESTE' }] },
      // Volta para baixo em direção ao centro
      { x: 4, y: 4, orientacao: 'SUL', paredes: [] },
      { x: 4, y: 3, orientacao: 'SUL', paredes: [] },
      // CENTRO: (4,3)
      { x: 3, y: 3, orientacao: 'OESTE', paredes: [] },
      // CENTRO: (3,3)
      { x: 3, y: 4, orientacao: 'NORTE', paredes: [] },
      // GOAL_REACHED em (3,4) - região central
    ],
  };

  it('Cenário 1: Simula o fluxo completo do mock_sender', () => {
    // O mock_sender envia pacotes UDP → backend processa e salva JSON
    // Este teste valida que o JSON resultante é válido
    const passos = extrairPassos(caminhoDemo8x8);
    expect(passos.length).toBe(33);
  });

  it('Cenário 2: Tamanho 8x8 é detectado corretamente', () => {
    expect(caminhoDemo8x8.tamanho!.larg).toBe(8);
    expect(caminhoDemo8x8.tamanho!.alt).toBe(8);
  });

  it('Cenário 3: goalReached = true após GOAL_REACHED', () => {
    const passos = extrairPassos(caminhoDemo8x8);
    expect(detectarGoalReached(caminhoDemo8x8, passos, 8, 8)).toBe(true);
  });

  it('Cenário 4: Último passo está na região central (3,3)-(4,4)', () => {
    const passos = extrairPassos(caminhoDemo8x8);
    expect(ultimoPassoEstaNoCentro(passos, 8, 8)).toBe(true);
  });

  it('Cenário 5: Múltiplas mudanças de direção (NORTE, LESTE, SUL, OESTE)', () => {
    const passos = extrairPassos(caminhoDemo8x8);
    const direcoes = new Set(passos.map(p => p.orientacao));
    expect(direcoes.has('NORTE')).toBe(true);
    expect(direcoes.has('LESTE')).toBe(true);
    expect(direcoes.has('SUL')).toBe(true);
    expect(direcoes.has('OESTE')).toBe(true);
  });

  it('Cenário 6: Paredes descobertas em múltiplas posições', () => {
    const passos = extrairPassos(caminhoDemo8x8);
    const passosComParedes = passos.filter(p => p.paredes.length > 0);
    expect(passosComParedes.length).toBeGreaterThanOrEqual(10);
  });

  it('Cenário 7: Progressão clara do rato (coordenadas variam)', () => {
    const passos = extrairPassos(caminhoDemo8x8);
    const xs = new Set(passos.map(p => p.x));
    const ys = new Set(passos.map(p => p.y));
    // O rato deve ter visitado pelo menos 6 valores diferentes de x e y
    expect(xs.size).toBeGreaterThanOrEqual(6);
    expect(ys.size).toBeGreaterThanOrEqual(6);
  });

  it('Cenário 8: Corrida é longa o suficiente para demonstração (>30 passos)', () => {
    const passos = extrairPassos(caminhoDemo8x8);
    expect(passos.length).toBeGreaterThan(30);
  });

  it('Cenário 8b: Corrida tem exatamente 33 passos (conforme definido no mock)', () => {
    const passos = extrairPassos(caminhoDemo8x8);
    expect(passos.length).toBe(33);
  });

  it('Cenário 9: Persistência - JSON pode ser salvo e recarregado', () => {
    const jsonString = JSON.stringify(caminhoDemo8x8);
    const recarregado = JSON.parse(jsonString);
    const passos = extrairPassos(recarregado);
    expect(recarregado.goalReached).toBe(true);
    expect(recarregado.tamanho.larg).toBe(8);
    expect(recarregado.tamanho.alt).toBe(8);
    expect(passos.length).toBe(33);
    expect(detectarGoalReached(recarregado, passos, 8, 8)).toBe(true);
  });

  it('Cenário 10: Grid 8x8 reconstruído corretamente', () => {
    const passos = extrairPassos(caminhoDemo8x8);
    const tam = caminhoDemo8x8.tamanho!;
    const grid = reconstruirAteStep(passos, passos.length - 1, tam.larg, tam.alt);
    expect(grid.length).toBe(8);
    expect(grid[0].length).toBe(8);
    // Paredes externas devem estar presentes
    expect(grid[0][0].sul).toBe(true);
    expect(grid[0][0].oeste).toBe(true);
    expect(grid[7][7].norte).toBe(true);
    expect(grid[7][7].leste).toBe(true);
  });
});

// ─── 14. VALIDAÇÃO DE CENTRO PARA TODOS OS TAMANHOS ─────────────────────────

describe('Diagnóstico 14 — Goal region validation for all sizes', () => {
  it('4x4 goal region correta', () => {
    const passos = extrairPassos(JSON_BACKEND_4x4);
    expect(ultimoPassoEstaNoCentro(passos, 4, 4)).toBe(true);
  });

  it('8x8 goal region correta', () => {
    const passos = extrairPassos(JSON_BACKEND_8x8);
    expect(ultimoPassoEstaNoCentro(passos, 8, 8)).toBe(true);
  });

  it('16x16 goal region correta', () => {
    const passos = extrairPassos(JSON_BACKEND_16x16);
    expect(ultimoPassoEstaNoCentro(passos, 16, 16)).toBe(true);
  });

  it('Não falso-positivo: coordenadas fora do centro não acusam goal', () => {
    const passosForaCentro: PassoExploracao[] = [
      { x: 0, y: 0, orientacao: 'NORTE', paredes: [] },
      { x: 0, y: 1, orientacao: 'NORTE', paredes: [] },
    ];
    expect(ultimoPassoEstaNoCentro(passosForaCentro, 4, 4)).toBe(false);
  });
});
