import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

// ─── Tipos que batem com o JSON gerado pelo simulador ───
interface ParedeDescoberta {
  x: number;
  y: number;
  dir: 'NORTE' | 'LESTE' | 'SUL' | 'OESTE';
}

interface PassoExploracao {
  x: number;
  y: number;
  orientacao: string;
  paredes: ParedeDescoberta[];
}

// Formato do JSON: pode ser array direto OU objeto { id_corrida, historico }
interface CorridaJSON {
  id_corrida?: string;
  historico?: PassoExploracao[];
}

// ─── Representação interna de cada célula no grid ───
interface Celula {
  norte: boolean;
  sul: boolean;
  leste: boolean;
  oeste: boolean;
  visitada: boolean;
}

// ─── Helpers ───
const criarGridVazio = (larg: number, alt: number): Celula[][] => {
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

const detectarTamanho = (passos: PassoExploracao[]): { larg: number; alt: number } => {
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

const aplicarParede = (grid: Celula[][], larg: number, alt: number, p: ParedeDescoberta) => {
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

const reconstruirAteStep = (
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
const extrairPassos = (data: unknown): PassoExploracao[] => {
  // Formato 1: Array direto [...passos]
  if (Array.isArray(data)) return data;
  // Formato 2: Objeto { id_corrida, historico: [...passos] }
  const obj = data as CorridaJSON;
  if (obj.historico && Array.isArray(obj.historico)) return obj.historico;
  throw new Error('Formato JSON não reconhecido. Esperado array ou { historico: [...] }');
};

/** Extrai o ID da corrida, se existir */
const extrairIdCorrida = (data: unknown): string | null => {
  if (Array.isArray(data)) return null;
  const obj = data as CorridaJSON;
  return obj.id_corrida ?? null;
};

const getRotacao = (orientacao: string): string => {
  switch (orientacao) {
    case 'NORTE': return '-rotate-90';
    case 'LESTE': return 'rotate-0';
    case 'SUL': return 'rotate-90';
    case 'OESTE': return 'rotate-180';
    default: return 'rotate-0';
  }
};

/** Formata timestamp (unix ms) para data legível */
const formatarTimestamp = (ts: string): string => {
  const num = parseInt(ts, 10);
  if (isNaN(num)) return ts;
  return new Date(num).toLocaleString('pt-BR');
};

export function HistoryPage() {
  const [arquivosDisponiveis, setArquivosDisponiveis] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(false);

  const [passos, setPassos] = useState<PassoExploracao[] | null>(null);
  const [idCorrida, setIdCorrida] = useState<string | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState<string>('');
  const [stepAtual, setStepAtual] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [velocidade, setVelocidade] = useState(200); // ms entre passos
  const [erro, setErro] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tamanho do labirinto detectado
  const tamanho = passos ? detectarTamanho(passos) : { larg: 0, alt: 0 };
  const { larg, alt } = tamanho;

  // Grid reconstruído até o step atual
  const grid = passos ? reconstruirAteStep(passos, stepAtual, larg, alt) : null;
  const passoAtual = passos ? passos[Math.min(stepAtual, passos.length - 1)] : null;

  // ─── Carregar JSON da API (maze_runs) ───
  const carregarDeApi = useCallback(async (arquivo: string) => {
    try {
      setErro(null);
      setCarregando(true);
      const resp = await fetch(`/api/maze_runs/${arquivo}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const steps = extrairPassos(data);
      if (steps.length === 0) {
        throw new Error('Histórico vazio (0 passos).');
      }
      setPassos(steps);
      setIdCorrida(extrairIdCorrida(data));
      setNomeArquivo(arquivo);
      setStepAtual(0);
      setPlaying(false);
    } catch (e) {
      setErro(`Erro ao carregar "${arquivo}": ${(e as Error).message}`);
    } finally {
      setCarregando(false);
    }
  }, []);

  // ─── Buscar lista de JSONs disponíveis na pasta maze_runs ───
  useEffect(() => {
    fetch('/api/maze_runs')
      .then(res => res.json())
      .then((files: string[]) => {
        setArquivosDisponiveis(files);
        // Auto-carregar o mais recente se existir
        if (files.length > 0) {
          carregarDeApi(files[0]);
        }
      })
      .catch(() => {
        // Silencioso se a API não estiver disponível
        setArquivosDisponiveis([]);
      });
  }, [carregarDeApi]);

  // ─── Carregar JSON por upload do usuário ───
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const steps = extrairPassos(data);
        if (steps.length === 0) {
          throw new Error('Histórico vazio (0 passos).');
        }
        setPassos(steps);
        setIdCorrida(extrairIdCorrida(data));
        setNomeArquivo(file.name);
        setStepAtual(0);
        setPlaying(false);
      } catch (err) {
        setErro(`Erro no arquivo "${file.name}": ${(err as Error).message}`);
      }
    };
    reader.readAsText(file);
    // Reset input para permitir re-upload do mesmo arquivo
    e.target.value = '';
  }, []);

  // ─── Controle de playback ───
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (playing && passos) {
      intervalRef.current = setInterval(() => {
        setStepAtual((prev) => {
          if (prev >= passos.length - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, velocidade);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, passos, velocidade]);

  const totalSteps = passos ? passos.length : 0;
  const terminou = stepAtual >= totalSteps - 1;

  // Determinar tamanho visual das células baseado no grid
  const maxDim = Math.max(larg, alt);
  const cellSize = maxDim <= 6 ? 'minmax(40px, 52px)' : maxDim <= 10 ? 'minmax(30px, 40px)' : 'minmax(22px, 32px)';

  /** Extrair timestamp do nome do arquivo (corrida_XXXXX.json) */
  const extrairNomeLegivel = (arquivo: string): string => {
    const match = arquivo.match(/corrida_(\d+)\.json/);
    if (match) {
      return formatarTimestamp(match[1]);
    }
    return arquivo.replace('.json', '');
  };

  return (
    <div className="flex flex-col gap-6 items-center p-6">
      {/* ─── Painel de seleção ─── */}
      <Card className="w-full max-w-3xl bg-[#0a1128] border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Histórico do Labirinto</span>
            <Badge variant="outline" className="text-emerald-400 border-emerald-600">
              {arquivosDisponiveis.length} corrida{arquivosDisponiveis.length !== 1 ? 's' : ''} encontrada{arquivosDisponiveis.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Corridas disponíveis na pasta maze_runs */}
          {arquivosDisponiveis.length > 0 && (
            <div>
              <p className="text-sm text-slate-400 mb-2">Corridas disponíveis em <code className="text-slate-300 bg-slate-800 px-1 rounded text-xs">maze_runs/</code>:</p>
              <div className="flex gap-2 flex-wrap">
                {arquivosDisponiveis.map((arquivo) => (
                  <button
                    key={arquivo}
                    onClick={() => carregarDeApi(arquivo)}
                    disabled={carregando}
                    className={cn(
                      "px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex flex-col items-start",
                      nomeArquivo === arquivo
                        ? "bg-emerald-600/20 text-emerald-300 border-2 border-emerald-500 shadow-lg shadow-emerald-600/10"
                        : "bg-[#0f172a] text-slate-300 border border-slate-700 hover:border-emerald-500/50 hover:text-emerald-300",
                      carregando && "opacity-50 cursor-wait"
                    )}
                  >
                    <span className="font-mono text-xs">{arquivo}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">{extrairNomeLegivel(arquivo)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {arquivosDisponiveis.length === 0 && (
            <div className="p-4 rounded-lg bg-slate-800/30 border border-dashed border-slate-700 text-slate-500 text-sm text-center">
              Nenhuma corrida encontrada em <code className="text-slate-400">src/maze_runs/</code>.
              <br />Execute o simulador para gerar um JSON ou faça upload abaixo.
            </div>
          )}

          {/* Upload de arquivo */}
          <div>
            <p className="text-sm text-slate-400 mb-2">Ou carregar de outro local:</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[#0f172a] text-slate-300 border border-dashed border-slate-600 hover:border-blue-500 hover:text-blue-300 transition-all duration-200 w-full"
            >
              📁 Selecionar arquivo JSON
            </button>
          </div>

          {/* Mensagem de erro */}
          {erro && (
            <div className="p-3 rounded-lg bg-red-900/30 border border-red-700 text-red-300 text-sm">
              ⚠ {erro}
            </div>
          )}

          {/* Info do arquivo carregado */}
          {passos && (
            <div className="p-3 rounded-lg bg-emerald-900/20 border border-emerald-800/50 text-sm text-slate-300 flex items-center justify-between">
              <span>
                📄 <strong className="text-white">{nomeArquivo}</strong>
                {idCorrida && <span className="text-slate-500 ml-2">ID: {idCorrida}</span>}
              </span>
              <span className="text-emerald-400 font-mono">
                {totalSteps} passos · {larg}×{alt}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Visualização do labirinto ─── */}
      {passos && grid && passoAtual && (
        <Card className="w-fit bg-[#0a1128] border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between gap-6">
              <span>Replay da Exploração ({larg}×{alt})</span>
              <Badge
                variant="outline"
                className={cn(
                  terminou
                    ? "text-emerald-400 border-emerald-600"
                    : playing
                    ? "text-blue-400 border-blue-600 animate-pulse"
                    : "text-amber-400 border-amber-600"
                )}
              >
                {terminou ? '✓ Finalizado' : playing ? '▶ Reproduzindo' : '⏸ Pausado'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Info do step atual */}
            <div className="grid grid-cols-4 gap-2 text-sm text-white bg-slate-900/50 p-3 rounded-lg">
              <div className="flex flex-col">
                <span className="text-slate-500 text-xs">Passo</span>
                <span className="font-mono font-bold">{stepAtual + 1}/{totalSteps}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 text-xs">Posição</span>
                <span className="font-mono">({passoAtual.x}, {passoAtual.y})</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 text-xs">Orientação</span>
                <span className="font-mono">{passoAtual.orientacao}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 text-xs">Paredes</span>
                <span className="font-mono">{passoAtual.paredes.length} novas</span>
              </div>
            </div>

            {/* Grid do labirinto */}
            <div className="flex justify-center overflow-auto">
              <div className="relative border-4 border-slate-500 bg-[#070b19] p-1 rounded-lg w-fit">
                <div
                  className="grid gap-0"
                  style={{
                    gridTemplateColumns: `repeat(${larg}, ${cellSize})`,
                    gridTemplateRows: `repeat(${alt}, ${cellSize})`
                  }}
                >
                  {Array.from({ length: alt }, (_, i) => alt - 1 - i).map((y) =>
                    Array.from({ length: larg }, (_, i) => i).map((x) => {
                      const cell = grid[x][y];
                      const isRobot = passoAtual.x === x && passoAtual.y === y;

                      // Detectar se é meta (centro do labirinto)
                      const centroX = Math.floor(larg / 2);
                      const centroY = Math.floor(alt / 2);
                      const isMeta =
                        (x === centroX - 1 || x === centroX) &&
                        (y === centroY - 1 || y === centroY);

                      return (
                        <div
                          key={`${x}-${y}`}
                          className={cn(
                            "flex items-center justify-center transition-all duration-200 box-border relative",
                            cell.visitada
                              ? "bg-[#1a2b4c]"
                              : isMeta
                              ? "bg-emerald-900/30"
                              : "bg-[#0b1221]",
                            cell.norte ? "border-t-[3px] border-t-red-500 z-10" : "border-t-[1px] border-t-slate-800/50",
                            cell.leste ? "border-r-[3px] border-r-red-500 z-10" : "border-r-[1px] border-r-slate-800/50",
                            cell.sul   ? "border-b-[3px] border-b-red-500 z-10" : "border-b-[1px] border-b-slate-800/50",
                            cell.oeste ? "border-l-[3px] border-l-red-500 z-10" : "border-l-[1px] border-l-slate-800/50"
                          )}
                          style={{ aspectRatio: '1/1' }}
                        >
                          {isRobot && (
                            <div className={`transform transition-transform duration-200 ${getRotacao(passoAtual.orientacao)} drop-shadow-[0_0_6px_rgba(59,130,246,0.8)]`}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="#3b82f6" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 22L21 12L3 2L7 12L3 22Z" />
                              </svg>
                            </div>
                          )}
                          {isMeta && !isRobot && (
                            <div className="text-emerald-500 text-[7px] font-bold opacity-50">★</div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Controles de playback */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => { setStepAtual(0); setPlaying(false); }}
                className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm"
                title="Resetar"
              >
                ⏮
              </button>
              <button
                onClick={() => { setStepAtual((p) => Math.max(0, p - 1)); setPlaying(false); }}
                disabled={stepAtual === 0}
                className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm disabled:opacity-30"
                title="Passo anterior"
              >
                ◀
              </button>
              <button
                onClick={() => {
                  if (terminou) {
                    setStepAtual(0);
                    setPlaying(true);
                  } else {
                    setPlaying((p) => !p);
                  }
                }}
                className={cn(
                  "px-6 py-2 rounded-lg font-semibold text-sm transition-all duration-200",
                  playing
                    ? "bg-amber-600 text-white hover:bg-amber-500 shadow-lg shadow-amber-600/30"
                    : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/30"
                )}
              >
                {terminou ? '↻ Replay' : playing ? '⏸ Pausar' : '▶ Play'}
              </button>
              <button
                onClick={() => { setStepAtual((p) => Math.min(totalSteps - 1, p + 1)); setPlaying(false); }}
                disabled={terminou}
                className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm disabled:opacity-30"
                title="Próximo passo"
              >
                ▶
              </button>
              <button
                onClick={() => { setStepAtual(totalSteps - 1); setPlaying(false); }}
                className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm"
                title="Ir ao fim"
              >
                ⏭
              </button>
            </div>

            {/* Slider de progresso */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-10 text-right font-mono">{stepAtual + 1}</span>
              <input
                type="range"
                min={0}
                max={totalSteps - 1}
                value={stepAtual}
                onChange={(e) => {
                  setStepAtual(parseInt(e.target.value));
                  setPlaying(false);
                }}
                className="flex-1 accent-blue-500 cursor-pointer"
              />
              <span className="text-xs text-slate-500 w-10 font-mono">{totalSteps}</span>
            </div>

            {/* Velocidade */}
            <div className="flex items-center justify-center gap-3">
              <span className="text-xs text-slate-500">Velocidade:</span>
              {[{ ms: 1000, label: '1×' }, { ms: 500, label: '2×' }, { ms: 200, label: '5×' }, { ms: 100, label: '10×' }, { ms: 30, label: '33×' }].map(({ ms, label }) => (
                <button
                  key={ms}
                  onClick={() => setVelocidade(ms)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded transition-colors",
                    velocidade === ms
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Legenda */}
            <div className="flex gap-4 text-xs text-slate-300 justify-center flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-[#1a2b4c] border border-slate-600 rounded-sm"></div>
                <span>Visitado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-[#0b1221] border border-slate-600 rounded-sm"></div>
                <span>Não visitado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0 border-t-2 border-red-500"></div>
                <span>Parede</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#3b82f6"><path d="M3 22L21 12L3 2L7 12L3 22Z" /></svg>
                <span>Robô</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-500 text-xs font-bold">★</span>
                <span>Meta</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem se nenhum arquivo carregado */}
      {!passos && !erro && arquivosDisponiveis.length === 0 && (
        <div className="text-slate-500 text-sm mt-8 text-center">
          Carregue um arquivo JSON para visualizar o histórico da exploração.
        </div>
      )}
    </div>
  );
}
