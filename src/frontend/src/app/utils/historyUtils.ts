// ─── Tipos que batem com o JSON gerado pelo simulador ───
export interface ParedeDescoberta {
  x: number;
  y: number;
  dir: 'NORTE' | 'LESTE' | 'SUL' | 'OESTE';
}

export interface PassoExploracao {
  x: number;
  y: number;
  orientacao: string;
  paredes: ParedeDescoberta[];
}

// Formato do JSON: pode ser array direto OU objeto com metadados
export interface CorridaJSON {
  id_corrida?: string;
  id_labirinto?: string;
  tamanho?: { larg: number; alt: number };
  mapping?: boolean;
  goalReached?: boolean;
  historico?: PassoExploracao[];
}

// ─── Representação interna de cada célula no grid ───
export interface Celula {
  norte: boolean;
  sul: boolean;
  leste: boolean;
  oeste: boolean;
  visitada: boolean;
}

// ─── Helpers ───
export const criarGridVazio = (larg: number, alt: number): Celula[][] => {
  const grid: Celula[][] = [];
  for (let x = 0; x < larg; x++) {
    const col: Celula[] = [];
    for (let y = 0; y < alt; y++) {
      col.push({ norte: false, sul: false, leste: false, oeste: false, visitada: false });
    }
    grid.push(col);
  }
  // Paredes externas (bordas do labirinto)
  for (let i = 0; i < larg; i++) {
    grid[i][0].sul = true;
    grid[i][alt - 1].norte = true;
  }
  for (let j = 0; j < alt; j++) {
    grid[0][j].oeste = true;
    grid[larg - 1][j].leste = true;
  }
  return grid;
};

export const detectarTamanho = (passos: PassoExploracao[]): { larg: number; alt: number } => {
  let maxX = 0, maxY = 0;
  for (const p of passos) {
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
    for (const w of p.paredes) {
      if (w.x > maxX) maxX = w.x;
      if (w.y > maxY) maxY = w.y;
    }
  }
  // Se os dados parecem ser de um labirinto 16x16 (coordenadas vão até 15)
  const larg = maxX + 1;
  const alt = maxY + 1;
  // Arredondar para tamanhos comuns se próximo
  const tamanhoComum = [4, 8, 16, 32];
  const melhorLarg = tamanhoComum.find(t => t >= larg) ?? larg;
  const melhorAlt = tamanhoComum.find(t => t >= alt) ?? alt;
  return { larg: melhorLarg, alt: melhorAlt };
};

export const aplicarParede = (grid: Celula[][], larg: number, alt: number, p: ParedeDescoberta) => {
  const { x, y, dir } = p;
  if (x < 0 || x >= larg || y < 0 || y >= alt) return;

  const dirLower = dir.toLowerCase() as 'norte' | 'sul' | 'leste' | 'oeste';
  grid[x][y][dirLower] = true;

  // Espelhar no vizinho
  const DX: Record<string, number> = { NORTE: 0, LESTE: 1, SUL: 0, OESTE: -1 };
  const DY: Record<string, number> = { NORTE: 1, LESTE: 0, SUL: -1, OESTE: 0 };
  const OPOSTO: Record<string, 'norte' | 'sul' | 'leste' | 'oeste'> = {
    NORTE: 'sul', LESTE: 'oeste', SUL: 'norte', OESTE: 'leste'
  };

  const nx = x + DX[dir];
  const ny = y + DY[dir];
  if (nx >= 0 && nx < larg && ny >= 0 && ny < alt) {
    grid[nx][ny][OPOSTO[dir]] = true;
  }
};

export const reconstruirAteStep = (
  passos: PassoExploracao[],
  ate: number,
  larg: number,
  alt: number
): Celula[][] => {
  const grid = criarGridVazio(larg, alt);
  for (let i = 0; i <= ate && i < passos.length; i++) {
    const passo = passos[i];
    if (passo.x >= 0 && passo.x < larg && passo.y >= 0 && passo.y < alt) {
      grid[passo.x][passo.y].visitada = true;
    }
    for (const p of passo.paredes) {
      aplicarParede(grid, larg, alt, p);
    }
  }
  return grid;
};

/** Extrai os passos do JSON, suportando ambos os formatos */
export const extrairPassos = (data: unknown): PassoExploracao[] => {
  if (Array.isArray(data)) {
    if (data.length === 0) throw new Error('Histórico vazio');
    return data;
  }
  // Formato 2: Objeto { id_corrida, historico: [...passos] }
  const obj = data as CorridaJSON;
  if (obj.historico && Array.isArray(obj.historico)) {
    if (obj.historico.length === 0) throw new Error('Histórico vazio');
    return obj.historico;
  }
  throw new Error('Formato JSON não reconhecido. Esperado array ou { historico: [...] }');
};

/** Extrai o ID da corrida, se existir */
export const extrairIdCorrida = (data: unknown): string | null => {
  if (Array.isArray(data)) return null;
  const obj = data as CorridaJSON;
  return obj.id_corrida ?? null;
};

export const getRotacao = (orientacao: string): string => {
  switch (orientacao) {
    case 'NORTE': return '-rotate-90';
    case 'LESTE': return 'rotate-0';
    case 'SUL': return 'rotate-90';
    case 'OESTE': return 'rotate-180';
    default: return 'rotate-0';
  }
};

/** Formata timestamp (unix ms) para data legível */
export const formatarTimestamp = (ts: string): string => {
  const num = parseInt(ts, 10);
  if (isNaN(num)) return ts;
  return new Date(num).toLocaleString('pt-BR');
};


/**
 * Função utilitária genérica para fazer o download de um arquivo no navegador.
 */
const baixarArquivo = (conteudo: string, nomeArquivo: string, tipoMime: string) => {
  const blob = new Blob([conteudo], { type: tipoMime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exporta a série temporal estruturada no formato nativo JSON.
 */
export const exportarHistoricoJSON = (passos: PassoExploracao[], idCorrida: string | null) => {
  const id = idCorrida || `sessao_${Date.now()}`;
  const data: CorridaJSON = { id_corrida: id, historico: passos };
  const conteudo = JSON.stringify(data, null, 2);
  
  baixarArquivo(conteudo, `telemetria_${id}.json`, 'application/json');
};

/**
 * Exporta a série temporal em formato CSV achatado (flattened), 
 * ideal para análises post-mortem em ferramentas como Excel, Python (Pandas) ou MATLAB.
 */
export const exportarHistoricoCSV = (passos: PassoExploracao[], idCorrida: string | null) => {
  const id = idCorrida || `sessao_${Date.now()}`;
  
  // Cabeçalhos das colunas
  const cabecalho = [
    'passo_index',
    'pos_x',
    'pos_y',
    'orientacao',
    'detectou_parede_norte',
    'detectou_parede_sul',
    'detectou_parede_leste',
    'detectou_parede_oeste'
  ].join(',');

  // Mapeamento linear de cada passo da máquina de estados
  const linhas = passos.map((passo, index) => {
    const paredeNorte = passo.paredes.some(w => w.dir === 'NORTE') ? 1 : 0;
    const paredeSul = passo.paredes.some(w => w.dir === 'SUL') ? 1 : 0;
    const paredeLeste = passo.paredes.some(w => w.dir === 'LESTE') ? 1 : 0;
    const paredeOeste = passo.paredes.some(w => w.dir === 'OESTE') ? 1 : 0;

    return [
      index + 1,
      passo.x,
      passo.y,
      passo.orientacao,
      paredeNorte,
      paredeSul,
      paredeLeste,
      paredeOeste
    ].join(',');
  });

  const conteudo = [cabecalho, ...linhas].join('\n');
  baixarArquivo(conteudo, `telemetria_${id}.csv`, 'text/csv');
};