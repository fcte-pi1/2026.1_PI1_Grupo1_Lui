import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface RobotTelemetry {
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

// Helper para iniciar grid zerado
const createEmptyGrid = (size: number): Cell[][] => {
  const grid: Cell[][] = [];
  for (let x = 0; x < size; x++) {
    const col: Cell[] = [];
    for (let y = 0; y < size; y++) {
      col.push({ x, y, norte: false, sul: false, leste: false, oeste: false, visitada: false });
    }
    grid.push(col);
  }
  // Bordas externas
  for (let i = 0; i < size; i++) {
    grid[i][0].sul = true;
    grid[i][size - 1].norte = true;
    grid[0][i].oeste = true;
    grid[size - 1][i].leste = true;
  }
  return grid;
};

// Dados mockados para simular a descoberta
const MOCK_RUN = [
  { x: 0, y: 0, orientacao: "NORTE", paredes: [] },
  { x: 0, y: 1, orientacao: "NORTE", paredes: [{x:0, y:1, dir:'OESTE'}, {x:0, y:1, dir:'LESTE'}] },
  { x: 0, y: 2, orientacao: "NORTE", paredes: [{x:0, y:2, dir:'OESTE'}] },
  { x: 1, y: 2, orientacao: "LESTE", paredes: [{x:1, y:2, dir:'SUL'}, {x:1, y:2, dir:'NORTE'}] },
  { x: 2, y: 2, orientacao: "LESTE", paredes: [{x:2, y:2, dir:'SUL'}] },
  { x: 2, y: 3, orientacao: "NORTE", paredes: [{x:2, y:3, dir:'OESTE'}, {x:2, y:3, dir:'LESTE'}] },
  { x: 2, y: 4, orientacao: "NORTE", paredes: [{x:2, y:4, dir:'NORTE'}, {x:2, y:4, dir:'OESTE'}] }
];

export function RobotMap() {
  const [mazeSize, setMazeSize] = useState(16); // Dinâmico!
  const [grid, setGrid] = useState<Cell[][]>(createEmptyGrid(16));
  const [telemetry, setTelemetry] = useState<RobotTelemetry>({
    timestamp: Date.now(),
    estado_fsm: "MAPPING",
    posicao_x: 0, posicao_y: 0,
    orientacao: "NORTE"
  });
  
  // Efeito simulador (O Mock stream)
  useEffect(() => {
    let currentStep = 0;
    
    // Reseta grid para testar 8x8 no mock se quiser, mas deixamos 16x16 padrão
    const activeSize = 16;
    setMazeSize(activeSize);
    setGrid(createEmptyGrid(activeSize));

    const interval = setInterval(() => {
      if (currentStep >= MOCK_RUN.length) {
        setTelemetry(prev => ({ ...prev, estado_fsm: "GOAL_REACHED" }));
        clearInterval(interval);
        return;
      }

      const step = MOCK_RUN[currentStep];
      
      setTelemetry({
        timestamp: Math.floor(Date.now() / 1000),
        estado_fsm: "MAPPING",
        posicao_x: step.x,
        posicao_y: step.y,
        orientacao: step.orientacao
      });

      setGrid(prevGrid => {
        const newGrid = [...prevGrid];
        // Marca como visitada
        newGrid[step.x][step.y] = { ...newGrid[step.x][step.y], visitada: true };
        
        // Aplica paredes descobertas
        step.paredes.forEach(p => {
          newGrid[p.x][p.y] = { ...newGrid[p.x][p.y], [p.dir.toLowerCase()]: true };
          // Aplica no vizinho
          if (p.dir === 'NORTE' && p.y + 1 < activeSize) newGrid[p.x][p.y + 1].sul = true;
          if (p.dir === 'SUL' && p.y - 1 >= 0) newGrid[p.x][p.y - 1].norte = true;
          if (p.dir === 'LESTE' && p.x + 1 < activeSize) newGrid[p.x + 1][p.y].oeste = true;
          if (p.dir === 'OESTE' && p.x - 1 >= 0) newGrid[p.x - 1][p.y].leste = true;
        });
        return newGrid;
      });

      currentStep++;
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getRotation = (orientacao: string): string => {
    switch (orientacao) {
      case 'NORTE': return '-rotate-90';
      case 'LESTE': return 'rotate-0';
      case 'SUL': return 'rotate-90';
      case 'OESTE': return 'rotate-180';
      default: return 'rotate-0';
    }
  };

  const rows = Array.from({ length: mazeSize }, (_, i) => mazeSize - 1 - i);
  const cols = Array.from({ length: mazeSize }, (_, i) => i);

  return (
    <Card className="w-fit bg-[#0a1128] border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span>Mapa em Tempo Real ({mazeSize}x{mazeSize})</span>
          <Badge variant="outline" className="text-white border-slate-500">Ao Vivo</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <div className="grid grid-cols-2 gap-2 text-sm text-white bg-slate-900/50 p-2 rounded">
          <div>Posição: ({telemetry.posicao_x}, {telemetry.posicao_y})</div>
          <div>Orientação: {telemetry.orientacao}</div>
          <div>Status: {telemetry.estado_fsm}</div>
          <div>Timestamp: {telemetry.timestamp}</div>
        </div>

        <div className="relative border-4 border-slate-500 bg-[#070b19] p-1 rounded">
          <div
            className="grid gap-0"
            style={{
              gridTemplateColumns: `repeat(${mazeSize}, minmax(20px, 30px))`,
              gridTemplateRows: `repeat(${mazeSize}, minmax(20px, 30px))`
            }}
          >
            {rows.map((y) => (
              cols.map((x) => {
                const cell = grid[x][y];
                const isRobotHere = telemetry.posicao_x === x && telemetry.posicao_y === y;
                
                return (
                  <div
                    key={`${x}-${y}`}
                    className={cn(
                      "flex items-center justify-center transition-colors duration-200 box-border relative",
                      cell.visitada ? "bg-[#1a2b4c]" : "bg-[#0b1221]",
                      cell.norte ? "border-t-[3px] border-t-red-500 z-10" : "border-t-[1px] border-t-slate-800",
                      cell.leste ? "border-r-[3px] border-r-red-500 z-10" : "border-r-[1px] border-r-slate-800",
                      cell.sul ? "border-b-[3px] border-b-red-500 z-10" : "border-b-[1px] border-b-slate-800",
                      cell.oeste ? "border-l-[3px] border-l-red-500 z-10" : "border-l-[1px] border-l-slate-800"
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
            ))}
          </div>

          <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-[#0f172a]/90 backdrop-blur-sm border border-slate-700 rounded-lg shadow-lg z-20">
            {telemetry.estado_fsm === 'GOAL_REACHED' ? (
              <>
                <span className="text-[#22c55e] text-sm font-bold">✓</span>
                <span className="text-[#22c55e] text-sm font-medium">Objetivo atingido</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse"></span>
                <span className="text-white text-sm font-medium">Explorando...</span>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-4 text-xs text-slate-300 justify-center">
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#1a2b4c] border border-slate-600"></div><span>Visitado</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#0b1221] border border-slate-600"></div><span>Não visitado</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-0 border-t-2 border-red-500"></div><span>Parede</span></div>
        </div>
      </CardContent>
    </Card>
  );
}
