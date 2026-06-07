import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { cn } from '../lib/utils';

const SOCKET_URL = 'http://localhost:3001';

export interface RobotTelemetry {
  timestamp: number;
  estado_fsm: string;
  posicao_x: number;
  posicao_y: number;
  orientacao: string;
}

interface Cell {
  x: number;
  y: number;
  norte: boolean;
  sul: boolean;
  leste: boolean;
  oeste: boolean;
  visitada: boolean;
}

interface PropriedadesMapa {
  /** Chamado toda vez que a telemetria interna muda — permite sincronizar o Dashboard */
  onTelemetryUpdate?: (telemetria: RobotTelemetry) => void;
}

// Helper para iniciar grid zerado com bordas externas já marcadas
const createEmptyGrid = (size: number): Cell[][] => {
  const grid: Cell[][] = [];
  for (let x = 0; x < size; x++) {
    const col: Cell[] = [];
    for (let y = 0; y < size; y++) {
      col.push({ x, y, norte: false, sul: false, leste: false, oeste: false, visitada: false });
    }
    grid.push(col);
  }
  for (let i = 0; i < size; i++) {
    grid[i][0].sul = true;
    grid[i][size - 1].norte = true;
    grid[0][i].oeste = true;
    grid[size - 1][i].leste = true;
  }
  return grid;
};

// Mock fiel ao formato do JSON gerado pelo Main.cpp (salva_json):
// { x, y, orientacao: "NORTE"|"SUL"|"LESTE"|"OESTE", paredes: [{x, y, dir: "NORTE"|...}] }
const MOCK_RUN = [
  { x: 0, y: 0, orientacao: 'NORTE',  paredes: [] },
  { x: 0, y: 1, orientacao: 'NORTE',  paredes: [{ x: 0, y: 1, dir: 'OESTE' }, { x: 0, y: 1, dir: 'LESTE' }] },
  { x: 0, y: 2, orientacao: 'NORTE',  paredes: [{ x: 0, y: 2, dir: 'OESTE' }] },
  { x: 1, y: 2, orientacao: 'LESTE',  paredes: [{ x: 1, y: 2, dir: 'SUL'  }, { x: 1, y: 2, dir: 'NORTE' }] },
  { x: 2, y: 2, orientacao: 'LESTE',  paredes: [{ x: 2, y: 2, dir: 'SUL'  }] },
  { x: 2, y: 3, orientacao: 'NORTE',  paredes: [{ x: 2, y: 3, dir: 'OESTE' }, { x: 2, y: 3, dir: 'LESTE' }] },
  { x: 2, y: 4, orientacao: 'NORTE',  paredes: [{ x: 2, y: 4, dir: 'NORTE' }, { x: 2, y: 4, dir: 'OESTE' }] },
  { x: 3, y: 4, orientacao: 'LESTE',  paredes: [{ x: 3, y: 4, dir: 'NORTE' }] },
  { x: 4, y: 4, orientacao: 'LESTE',  paredes: [{ x: 4, y: 4, dir: 'NORTE' }, { x: 4, y: 4, dir: 'LESTE' }] },
  { x: 4, y: 3, orientacao: 'SUL',    paredes: [{ x: 4, y: 3, dir: 'LESTE' }] },
  { x: 4, y: 2, orientacao: 'SUL',    paredes: [{ x: 4, y: 2, dir: 'LESTE' }, { x: 4, y: 2, dir: 'OESTE' }] },
  { x: 3, y: 2, orientacao: 'OESTE',  paredes: [{ x: 3, y: 2, dir: 'SUL'  }] },
  { x: 3, y: 3, orientacao: 'NORTE',  paredes: [] },
  { x: 3, y: 4, orientacao: 'NORTE',  paredes: [] },
];

export function RobotMap({ onTelemetryUpdate }: PropriedadesMapa = {}) {
  const [mazeSize, setMazeSize] = useState(16);
  const [grid, setGrid] = useState<Cell[][]>(createEmptyGrid(16));
  const [telemetry, setTelemetry] = useState<RobotTelemetry>({
    timestamp: Math.floor(Date.now() / 1000),
    estado_fsm: 'MAPPING',
    posicao_x: 0,
    posicao_y: 0,
    orientacao: 'NORTE',
  });

  const [isSimulation, setIsSimulation] = useState(true);

  // Reinicia simulação quando o tamanho muda e estamos em modo Simulação
  useEffect(() => {
    if (!isSimulation) return;

    let currentStep = 0;

    setGrid(createEmptyGrid(mazeSize));
    const initial: RobotTelemetry = {
      timestamp: Math.floor(Date.now() / 1000),
      estado_fsm: 'MAPPING',
      posicao_x: 0,
      posicao_y: 0,
      orientacao: 'NORTE',
    };
    setTelemetry(initial);
    onTelemetryUpdate?.(initial);

    const interval = setInterval(() => {
      if (currentStep >= MOCK_RUN.length) {
        const done: RobotTelemetry = {
          timestamp: Math.floor(Date.now() / 1000),
          estado_fsm: 'GOAL_REACHED',
          posicao_x: MOCK_RUN[MOCK_RUN.length - 1].x,
          posicao_y: MOCK_RUN[MOCK_RUN.length - 1].y,
          orientacao: MOCK_RUN[MOCK_RUN.length - 1].orientacao,
        };
        setTelemetry(done);
        onTelemetryUpdate?.(done);
        clearInterval(interval);
        return;
      }

      const step = MOCK_RUN[currentStep];

      // Ignora passos fora do grid selecionado
      if (step.x >= mazeSize || step.y >= mazeSize) {
        currentStep++;
        return;
      }

      const next: RobotTelemetry = {
        timestamp: Math.floor(Date.now() / 1000),
        estado_fsm: 'MAPPING',
        posicao_x: step.x,
        posicao_y: step.y,
        orientacao: step.orientacao,
      };
      setTelemetry(next);
      onTelemetryUpdate?.(next);

      setGrid(prevGrid => {
        const newGrid = prevGrid.map(col => [...col]);
        newGrid[step.x][step.y] = { ...newGrid[step.x][step.y], visitada: true };

        step.paredes.forEach(p => {
          if (p.x < mazeSize && p.y < mazeSize) {
            const dir = p.dir.toLowerCase() as 'norte' | 'sul' | 'leste' | 'oeste';
            newGrid[p.x][p.y] = { ...newGrid[p.x][p.y], [dir]: true };
            // Propaga parede na célula vizinha (simetria)
            if (p.dir === 'NORTE' && p.y + 1 < mazeSize) newGrid[p.x][p.y + 1] = { ...newGrid[p.x][p.y + 1], sul: true };
            if (p.dir === 'SUL'   && p.y - 1 >= 0)       newGrid[p.x][p.y - 1] = { ...newGrid[p.x][p.y - 1], norte: true };
            if (p.dir === 'LESTE' && p.x + 1 < mazeSize) newGrid[p.x + 1][p.y] = { ...newGrid[p.x + 1][p.y], oeste: true };
            if (p.dir === 'OESTE' && p.x - 1 >= 0)       newGrid[p.x - 1][p.y] = { ...newGrid[p.x - 1][p.y], leste: true };
          }
        });
        return newGrid;
      });

      currentStep++;
    }, 1000);

    return () => clearInterval(interval);
  }, [mazeSize, isSimulation]); // eslint-disable-line react-hooks/exhaustive-deps

  // Liga ao WebSocket se estiver em modo Tempo Real
  useEffect(() => {
    if (isSimulation) return;

    setGrid(createEmptyGrid(mazeSize));

    const socket = io(SOCKET_URL);

    socket.on('telemetry', (data: any) => {
      // Nota: a renderização dinâmica de paredes será feita futuramente quando
      // os sensores enviarem os dados de paredes nos pacotes UDP.
      const newTelemetry: RobotTelemetry = {
        timestamp: data.timestamp || Math.floor(Date.now() / 1000),
        estado_fsm: data.estado_fsm || data.estado_robo || 'IDLE',
        posicao_x: data.posicao_x ?? data.pos_x ?? 0,
        posicao_y: data.posicao_y ?? data.pos_y ?? 0,
        orientacao: data.orientacao || 'NORTE',
      };

      setTelemetry(newTelemetry);
      onTelemetryUpdate?.(newTelemetry);

      setGrid(prevGrid => {
        const newGrid = prevGrid.map(col => [...col]);
        if (newTelemetry.posicao_x < mazeSize && newTelemetry.posicao_y < mazeSize) {
          newGrid[newTelemetry.posicao_x][newTelemetry.posicao_y] = { 
            ...newGrid[newTelemetry.posicao_x][newTelemetry.posicao_y], 
            visitada: true 
          };
        }
        return newGrid;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [mazeSize, isSimulation]); // eslint-disable-line react-hooks/exhaustive-deps

  const getRotation = (orientacao: string): string => {
    switch (orientacao) {
      case 'NORTE': return '-rotate-90';
      case 'LESTE': return 'rotate-0';
      case 'SUL':   return 'rotate-90';
      case 'OESTE': return 'rotate-180';
      default:      return 'rotate-0';
    }
  };

  const rows = Array.from({ length: mazeSize }, (_, i) => mazeSize - 1 - i);
  const cols = Array.from({ length: mazeSize }, (_, i) => i);

  return (
    <div className="w-full h-full flex flex-col bg-[#0a1128] overflow-hidden">

      {/* Header: título + seletor de tamanho */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/60 shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-white font-semibold text-sm">
            Mapa Ao Vivo
            <span className="ml-2 text-slate-400 font-normal text-xs">({mazeSize}×{mazeSize})</span>
          </span>
          <button
            onClick={() => setIsSimulation(!isSimulation)}
            className={cn(
              'px-3 py-1 text-[10px] font-bold rounded-full transition-all tracking-wider',
              isSimulation ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30'
            )}
          >
            {isSimulation ? 'MODO SIMULAÇÃO' : 'TEMPO REAL'}
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 mr-1">Tamanho:</span>
          {([4, 8, 16] as const).map(s => (
            <button
              key={s}
              onClick={() => setMazeSize(s)}
              className={cn(
                'px-2 py-0.5 text-xs rounded transition-colors',
                mazeSize === s ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              )}
            >{s}×{s}</button>
          ))}
        </div>
      </div>

      {/* HUD de telemetria */}
      <div className="grid grid-cols-4 gap-0 text-xs text-slate-400 border-b border-slate-700/40 shrink-0">
        {[
          ['Posição', `(${telemetry.posicao_x}, ${telemetry.posicao_y})`],
          ['Orientação', telemetry.orientacao],
          ['Status', telemetry.estado_fsm],
          ['Timestamp', String(telemetry.timestamp)],
        ].map(([label, val]) => (
          <div key={label} className="px-4 py-2 flex flex-col gap-0.5 border-r border-slate-700/40 last:border-r-0">
            <span className="uppercase tracking-wider text-[10px] text-slate-600">{label}</span>
            <span className={cn(
              'font-mono font-medium text-xs',
              val === 'GOAL_REACHED' ? 'text-green-400' :
              val === 'MAPPING'      ? 'text-blue-400'  : 'text-slate-300'
            )}>{val}</span>
          </div>
        ))}
      </div>

      {/* Área do labirinto — fundo preenche toda a altura, grid centralizado */}
      <div className="flex-1 flex items-center justify-center bg-[#070b19] min-h-0 p-4 relative">
        <div className="relative border-4 border-slate-500 bg-[#070b19] p-1 rounded w-fit">
          <div
            className="grid gap-0"
            style={{
              gridTemplateColumns: `repeat(${mazeSize}, minmax(24px, 36px))`,
              gridTemplateRows:    `repeat(${mazeSize}, minmax(24px, 36px))`,
            }}
          >
            {rows.map(y =>
              cols.map(x => {
                const cell = grid[x][y];
                const isRobotHere = telemetry.posicao_x === x && telemetry.posicao_y === y;

                return (
                  <div
                    key={`${x}-${y}`}
                    className={cn(
                      'flex items-center justify-center transition-colors duration-200 box-border relative',
                      cell.visitada ? 'bg-[#1a2b4c]' : 'bg-[#0b1221]',
                      cell.norte ? 'border-t-[3px] border-t-red-500 z-10' : 'border-t-[1px] border-t-slate-800',
                      cell.leste ? 'border-r-[3px] border-r-red-500 z-10' : 'border-r-[1px] border-r-slate-800',
                      cell.sul   ? 'border-b-[3px] border-b-red-500 z-10' : 'border-b-[1px] border-b-slate-800',
                      cell.oeste ? 'border-l-[3px] border-l-red-500 z-10' : 'border-l-[1px] border-l-slate-800',
                    )}
                    style={{ aspectRatio: '1/1' }}
                  >
                    {isRobotHere && (
                      <div className={`transform transition-transform duration-300 ${getRotation(telemetry.orientacao)}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#3b82f6" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 22L21 12L3 2L7 12L3 22Z" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Badge de status flutuante */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-[#0f172a]/90 backdrop-blur-sm border border-slate-700 rounded-lg shadow-lg z-20">
            {telemetry.estado_fsm === 'GOAL_REACHED' ? (
              <>
                <span className="text-[#22c55e] text-sm font-bold">✓</span>
                <span className="text-[#22c55e] text-sm font-medium">Objetivo atingido</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse" />
                <span className="text-white text-sm font-medium">Explorando...</span>
              </>
            )}
          </div>
        </div>

        {/* Legenda */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 text-xs text-slate-400 bg-[#0f172a]/80 backdrop-blur-sm border border-slate-700/60 px-4 py-2 rounded-lg z-20">
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#1a2b4c] border border-slate-600 rounded-sm" /><span>Visitado</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#0b1221] border border-slate-600 rounded-sm" /><span>Não visitado</span></div>
          <div className="flex items-center gap-1"><div className="w-4 h-0.5 bg-red-500 rounded" /><span>Parede</span></div>
        </div>
      </div>
    </div>
  );
}

