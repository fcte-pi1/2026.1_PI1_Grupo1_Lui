/**
 * Teste de Diagnóstico — Verificação dos arquivos JSON salvos em disco
 * 
 * Verifica se os arquivos em maze_runs/ têm o formato esperado
 * e identifica discrepâncias entre o que é salvo e o que o frontend espera.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// O backend salva em: src/maze_runs/ (relativo a src/backend/src/services/)
// O frontend serve de: src/maze_runs/ (relativo a src/frontend/)
// Vamos verificar ambos os diretórios
const MAZE_RUNS_SRC = path.resolve(__dirname, '../../maze_runs');     // src/maze_runs
const MAZE_RUNS_ROOT = path.resolve(__dirname, '../../../maze_runs'); // maze_runs (root, usado pelo firmware)

describe('Diagnóstico de Arquivos — src/maze_runs/', () => {
  let files;

  beforeAll(() => {
    if (!fs.existsSync(MAZE_RUNS_SRC)) {
      fs.mkdirSync(MAZE_RUNS_SRC, { recursive: true });
    }
    files = fs.readdirSync(MAZE_RUNS_SRC)
      .filter(f => f.endsWith('.json'))
      .sort();
  });

  test('diretório existe', () => {
    expect(fs.existsSync(MAZE_RUNS_SRC)).toBe(true);
  });

  test('pelo menos um arquivo JSON existe', () => {
    console.log(`  📁 ${MAZE_RUNS_SRC} → ${files.length} arquivos JSON`);
    expect(files.length).toBeGreaterThan(0);
  });

  test('cada arquivo tem formato JSON válido com campos esperados', () => {
    for (const file of files) {
      const content = fs.readFileSync(path.join(MAZE_RUNS_SRC, file), 'utf-8');
      let data;
      expect(() => { data = JSON.parse(content); }).not.toThrow();

      // Campos obrigatórios
      expect(data).toHaveProperty('id_corrida');
      expect(data).toHaveProperty('tamanho');
      expect(data.tamanho).toHaveProperty('larg');
      expect(data.tamanho).toHaveProperty('alt');
      expect(data).toHaveProperty('historico');
      expect(Array.isArray(data.historico)).toBe(true);
      expect(data.historico.length).toBeGreaterThan(0);

      // Cada passo deve ter campos obrigatórios
      for (const passo of data.historico) {
        expect(passo).toHaveProperty('x');
        expect(passo).toHaveProperty('y');
        expect(passo).toHaveProperty('orientacao');
        expect(passo).toHaveProperty('paredes');
        expect(Array.isArray(passo.paredes)).toBe(true);

        // Cada parede deve ter campos obrigatórios
        for (const parede of passo.paredes) {
          expect(parede).toHaveProperty('x');
          expect(parede).toHaveProperty('y');
          expect(parede).toHaveProperty('dir');
          expect(['NORTE', 'SUL', 'LESTE', 'OESTE']).toContain(parede.dir);
        }
      }

      // Verifica campos que DEVERIAM existir mas podem estar ausentes
      if (!data.mapping) {
        console.log(`  ⚠️  ${file}: campo 'mapping' ausente (irá usar default=true)`);
      }
      if (!data.goalReached && !data.objetivo) {
        console.log(`  ⚠️  ${file}: campo 'goalReached'/'objetivo' ausente (não é possível saber se o goal foi atingido)`);
      }
      if (!data.id_labirinto) {
        console.log(`  ⚠️  ${file}: campo 'id_labirinto' ausente`);
      }

      // Verifica consistência: tamanho deve ser compatível com coordenadas máximas
      let maxX = 0, maxY = 0;
      for (const passo of data.historico) {
        if (passo.x > maxX) maxX = passo.x;
        if (passo.y > maxY) maxY = passo.y;
        for (const parede of passo.paredes) {
          if (parede.x > maxX) maxX = parede.x;
          if (parede.y > maxY) maxY = parede.y;
        }
      }
      const expectedLarg = maxX + 1;
      const expectedAlt = maxY + 1;

      // O tamanho no JSON pode ser maior (ex: 16x16 mesmo se max coord for 7)
      // Mas nunca deve ser MENOR que o necessário
      expect(data.tamanho.larg).toBeGreaterThanOrEqual(expectedLarg);
      expect(data.tamanho.alt).toBeGreaterThanOrEqual(expectedAlt);

      console.log(`  ✅ ${file}: ${data.historico.length} passos, ${data.tamanho.larg}x${data.tamanho.alt}`);
    }
  });

  test('campos obrigatórios para o frontend estão presentes', () => {
    for (const file of files) {
      const content = fs.readFileSync(path.join(MAZE_RUNS_SRC, file), 'utf-8');
      const data = JSON.parse(content);

      // O frontend (historyUtils.ts) espera:
      // - data: { historico: [...] }  ✔️
      // - extrairPassos: data.historico  ✔️
      // - detectarTamanho: usa data.tamanho ou fallback  ✔️

      // O frontend (HistoryPage.tsx) também acessa:
      // - data.mapping (pode estar undefined → default true)
      // - TODO: data.goalReached (NÃO EXISTE — o frontend fabrica esse dado)

      expect(data.historico).toBeDefined();
    }
  });
});

describe('Diagnóstico de Arquivos — maze_runs/ (root)', () => {
  let files;

  beforeAll(() => {
    if (fs.existsSync(MAZE_RUNS_ROOT)) {
      files = fs.readdirSync(MAZE_RUNS_ROOT)
        .filter(f => f.endsWith('.json'))
        .sort();
    }
  });

  test('diretório root maze_runs existe', () => {
    expect(fs.existsSync(MAZE_RUNS_ROOT)).toBe(true);
  });

  test('arquivos JSON no root maze_runs são válidos', () => {
    if (!files || files.length === 0) {
      console.log('  ⚠️  Nenhum arquivo JSON encontrado em maze_runs/ (root)');
      return;
    }
    console.log(`  📁 ${MAZE_RUNS_ROOT} → ${files.length} arquivos JSON`);
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(MAZE_RUNS_ROOT, file), 'utf-8');
      let data;
      expect(() => { data = JSON.parse(content); }).not.toThrow();
      expect(data).toHaveProperty('historico');
      expect(data.historico.length).toBeGreaterThan(0);
      console.log(`  ✅ ${file}: ${data.historico.length} passos`);
    }
  });

  test('⚠️  arquivos do root maze_runs NÃO são servidos pelo frontend', () => {
    // O frontend (Vite middleware) serve de src/maze_runs/
    // O firmware salva em maze_runs/ (root)
    // Logo, os arquivos do root NÃO aparecem no frontend
    const srcFiles = fs.existsSync(MAZE_RUNS_SRC) 
      ? fs.readdirSync(MAZE_RUNS_SRC).filter(f => f.endsWith('.json'))
      : [];
    const rootFiles = fs.existsSync(MAZE_RUNS_ROOT)
      ? fs.readdirSync(MAZE_RUNS_ROOT).filter(f => f.endsWith('.json'))
      : [];

    console.log(`  Frontend serve de: ${MAZE_RUNS_SRC} → ${srcFiles.length} arquivos`);
    console.log(`  Firmware salva em: ${MAZE_RUNS_ROOT} → ${rootFiles.length} arquivos`);
    
    if (rootFiles.length > 0 && srcFiles.length > 0) {
      // Verifica se há arquivos no root que não estão em src
      const apenasNoRoot = rootFiles.filter(f => !srcFiles.includes(f));
      if (apenasNoRoot.length > 0) {
        console.log(`  ⚠️  ${apenasNoRoot.length} arquivos do firmware NÃO estão acessíveis pelo frontend:`);
        apenasNoRoot.slice(0, 5).forEach(f => console.log(`      - ${f}`));
        if (apenasNoRoot.length > 5) console.log(`      ... e mais ${apenasNoRoot.length - 5}`);
      }
    }
  });
});

describe('Diagnóstico — Análise de Formato', () => {
  test('formato salvo vs formato esperado — diferenças', () => {
    const dirs = [
      { path: MAZE_RUNS_SRC, name: 'src/maze_runs' },
      { path: MAZE_RUNS_ROOT, name: 'maze_runs (root)' },
    ];

    for (const { path: dirPath, name } of dirs) {
      if (!fs.existsSync(dirPath)) continue;
      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
      if (files.length === 0) continue;

      console.log(`\n  --- ${name} ---`);
      for (const file of files.slice(0, 5)) { // amostra dos primeiros 5
        const content = fs.readFileSync(path.join(dirPath, file), 'utf-8');
        const data = JSON.parse(content);
        const keys = Object.keys(data);
        
        const status = [];
        if (keys.includes('mapping')) status.push('mapping=✅');
        else status.push('mapping=❌');
        if (keys.includes('goalReached') || keys.includes('objetivo')) status.push('goal=✅');
        else status.push('goal=❌');
        if (keys.includes('id_labirinto')) status.push('labirinto=✅');
        else status.push('labirinto=❌');
        if (keys.includes('tamanho')) status.push('tamanho=✅');
        else status.push('tamanho=❌');

        console.log(`  ${file}: keys=[${keys.join(', ')}] ${status.join(' ')}`);
      }
    }
  });
});
