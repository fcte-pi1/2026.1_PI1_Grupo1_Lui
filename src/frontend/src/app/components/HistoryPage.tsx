import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface Cell {
  x: number;
  y: number;
  norte: boolean;
  sul: boolean;
  leste: boolean;
  oeste: boolean;
  visitada: boolean;
}

interface MazeHistory {
  id_corrida: string;
  id_labirinto: string;
  tamanho: number;
  estado_fsm: string;
  timestamp: number;
  celulas_descobertas: Cell[];
}

// Criando um labirinto 4x4 mockado
const generateMock4x4 = (): Cell[] => {
  const cells: Cell[] = [];
  for (let x = 0; x < 4; x++) {
    for (let y = 0; y < 4; y++) {
      cells.push({
        x, y,
        norte: y === 3 || (x === 1 && y === 1),
        sul: y === 0 || (x === 1 && y === 2),
        leste: x === 3 || (x === 0 && y === 1),
        oeste: x === 0 || (x === 1 && y === 1),
        visitada: true
      });
    }
  }
  return cells;
};

const MOCK_HISTORY: MazeHistory[] = [
  {
    id_corrida: 'run_test_01_sucesso',
    id_labirinto: '4x4_test',
    tamanho: 4,
    estado_fsm: 'GOAL_REACHED',
    timestamp: Date.now() - 86400000, // Ontem
    celulas_descobertas: generateMock4x4()
  }
];

export function HistoryPage() {
  const [selectedMaze, setSelectedMaze] = useState<MazeHistory | null>(null);

  return (
    <div className="flex flex-col gap-6 items-center">
      <Card className="w-full max-w-2xl bg-[#0a1128] border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Histórico de Corridas (Arquivos JSON)</span>
            <Badge variant="outline" className="text-white border-slate-500">
              Mockado
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {MOCK_HISTORY.map((maze) => (
              <button
                key={maze.id_corrida}
                onClick={() => setSelectedMaze(maze)}
                className={cn(
                  "p-4 rounded-lg border text-left min-w-[200px] transition-colors",
                  selectedMaze?.id_corrida === maze.id_corrida
                    ? "bg-[#1a2b4c] border-blue-500"
                    : "bg-[#0f172a] border-slate-700 hover:border-slate-500"
                )}
              >
                <div className="text-white font-semibold">{maze.id_corrida}</div>
                <div className="text-sm text-slate-400 mt-1">{maze.id_labirinto}</div>
                <div className="text-xs text-slate-500 mt-2">
                  {new Date(maze.timestamp).toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedMaze && (
        <Card className="w-fit bg-[#0a1128] border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              Visualização Estática ({selectedMaze.tamanho}x{selectedMaze.tamanho})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative border-4 border-slate-500 bg-[#070b19] p-1 rounded">
              <div
                className="grid gap-0"
                style={{
                  gridTemplateColumns: `repeat(${selectedMaze.tamanho}, minmax(40px, 50px))`,
                  gridTemplateRows: `repeat(${selectedMaze.tamanho}, minmax(40px, 50px))`
                }}
              >
                {Array.from({ length: selectedMaze.tamanho }, (_, i) => selectedMaze.tamanho - 1 - i).map((y) => (
                  Array.from({ length: selectedMaze.tamanho }, (_, i) => i).map((x) => {
                    const cell = selectedMaze.celulas_descobertas.find(c => c.x === x && c.y === y);
                    if (!cell) return <div key={`${x}-${y}`} />;
                    
                    return (
                      <div
                        key={`${x}-${y}`}
                        className={cn(
                          "flex items-center justify-center transition-colors duration-200 box-border relative",
                          cell.visitada ? "bg-[#1a2b4c]" : "bg-[#0b1221]",
                          cell.norte ? "border-t-[4px] border-t-red-500 z-10" : "border-t-[1px] border-t-slate-800",
                          cell.leste ? "border-r-[4px] border-r-red-500 z-10" : "border-r-[1px] border-r-slate-800",
                          cell.sul ? "border-b-[4px] border-b-red-500 z-10" : "border-b-[1px] border-b-slate-800",
                          cell.oeste ? "border-l-[4px] border-l-red-500 z-10" : "border-l-[1px] border-l-slate-800"
                        )}
                        style={{ aspectRatio: '1/1' }}
                      />
                    );
                  })
                ))}
              </div>
            </div>
            <div className="flex gap-4 text-xs text-slate-300 justify-center">
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#1a2b4c] border border-slate-600"></div><span>Visitado</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-0 border-t-2 border-red-500"></div><span>Parede Conhecida</span></div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
