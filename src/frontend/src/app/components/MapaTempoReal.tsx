import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface RobotTelemetry {
  timestamp: number;
  estado_fsm: string;
  bateria_v: number;
  posicao_x: number;
  posicao_y: number;
  orientacao: string;
}

const mockTelemetryStream: RobotTelemetry[] = [
  { timestamp: 1715456789, estado_fsm: "MAPPING", bateria_v: 7.4, posicao_x: 0, posicao_y: 0, orientacao: "NORTE" },
  { timestamp: 1715456790, estado_fsm: "MAPPING", bateria_v: 7.4, posicao_x: 0, posicao_y: 1, orientacao: "NORTE" },
  { timestamp: 1715456791, estado_fsm: "MAPPING", bateria_v: 7.4, posicao_x: 0, posicao_y: 2, orientacao: "NORTE" },
  { timestamp: 1715456792, estado_fsm: "MAPPING", bateria_v: 7.4, posicao_x: 1, posicao_y: 2, orientacao: "LESTE" },
  { timestamp: 1715456793, estado_fsm: "MAPPING", bateria_v: 7.4, posicao_x: 2, posicao_y: 2, orientacao: "LESTE" },
  { timestamp: 1715456794, estado_fsm: "MAPPING", bateria_v: 7.4, posicao_x: 2, posicao_y: 3, orientacao: "NORTE" },
  { timestamp: 1715456795, estado_fsm: "MAPPING", bateria_v: 7.4, posicao_x: 2, posicao_y: 4, orientacao: "NORTE" },
  { timestamp: 1715456796, estado_fsm: "GOAL_REACHED", bateria_v: 7.4, posicao_x: 2, posicao_y: 4, orientacao: "NORTE" },
];

const MAZE_SIZE = 16;

export function RobotMap() {
  const [telemetry, setTelemetry] = useState<RobotTelemetry>(mockTelemetryStream[0]);
  const [visitedCells, setVisitedCells] = useState<Set<string>>(new Set([`${mockTelemetryStream[0].posicao_x}-${mockTelemetryStream[0].posicao_y}`]));
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Avança um passo manualmente
  const nextStep = () => {
    if (currentIndex < mockTelemetryStream.length - 1) {
      const next = currentIndex + 1;
      const newData = mockTelemetryStream[next];
      setTelemetry(newData);
      setVisitedCells(prev => new Set(prev).add(`${newData.posicao_x}-${newData.posicao_y}`));
      setCurrentIndex(next);
    } else {
      setIsPlaying(false);
    }
  };

  const resetSimulation = () => {
    setCurrentIndex(0);
    setTelemetry(mockTelemetryStream[0]);
    setVisitedCells(new Set([`${mockTelemetryStream[0].posicao_x}-${mockTelemetryStream[0].posicao_y}`]));
    setIsPlaying(true);
  };

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= mockTelemetryStream.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          const next = prev + 1;
          const newData = mockTelemetryStream[next];
          setTelemetry(newData);
          setVisitedCells(prevSet => new Set(prevSet).add(`${newData.posicao_x}-${newData.posicao_y}`));
          return next;
        });
      }, 150);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  const getRotation = (orientacao: string): string => {
    switch (orientacao) {
      case 'NORTE': return '-rotate-90';
      case 'LESTE': return 'rotate-0';
      case 'SUL': return 'rotate-90';
      case 'OESTE': return 'rotate-180';
      default: return 'rotate-0';
    }
  };

  const rows = Array.from({ length: MAZE_SIZE }, (_, i) => MAZE_SIZE - 1 - i);
  const cols = Array.from({ length: MAZE_SIZE }, (_, i) => i);

  return (
    <Card className="w-fit bg-[#0a1128] border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span>Mapa em Tempo Real</span>
          <Badge variant="outline" className="text-white border-slate-500">
            Atualização: 150ms
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 justify-center">
          <button onClick={() => setIsPlaying(!isPlaying)} className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
            {isPlaying ? 'Pausar' : 'Continuar'}
          </button>
          <button onClick={nextStep} className="px-3 py-1 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700">
            Passo a passo
          </button>
          <button onClick={resetSimulation} className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700">
            Reiniciar
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm text-white bg-slate-900/50 p-2 rounded">
          <div>Posição: ({telemetry.posicao_x}, {telemetry.posicao_y})</div>
          <div>Orientação: {telemetry.orientacao}</div>
          <div>Status: {telemetry.estado_fsm}</div>
          <div>Timestamp: {telemetry.timestamp}</div>
          <div>Progresso: {currentIndex+1}/{mockTelemetryStream.length}</div>
        </div>

        <div className="relative border-2 border-slate-600 bg-[#070b19] p-1 rounded">
          <div
            className="grid gap-[1px]"
            style={{
              gridTemplateColumns: `repeat(${MAZE_SIZE}, minmax(24px, 1fr))`,
              gridTemplateRows: `repeat(${MAZE_SIZE}, minmax(24px, 1fr))`
            }}
          >
            {rows.map((y) => (
              cols.map((x) => {
                const isRobotHere = telemetry.posicao_x === x && telemetry.posicao_y === y;
                const isVisited = visitedCells.has(`${x}-${y}`);
                return (
                  <div
                    key={`${x}-${y}`}
                    className={cn(
                      "flex items-center justify-center border-[0.5px] border-slate-800 transition-colors duration-200",
                      isVisited ? "bg-[#1a2b4c]" : "bg-transparent"
                    )}
                    style={{ aspectRatio: '1/1' }}
                  >
                    {isRobotHere && (
                      <div className={`transform transition-transform duration-100 ${getRotation(telemetry.orientacao)}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 22L21 12L3 2L7 12L3 22Z" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })
            ))}
          </div>

          <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-[#0f172a]/90 backdrop-blur-sm border border-slate-700 rounded-lg shadow-lg">
            {telemetry.estado_fsm === 'GOAL_REACHED' ? (
              <>
                <span className="text-[#22c55e] text-sm font-bold">✓</span>
                <span className="text-[#22c55e] text-sm font-medium">Objetivo atingido</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse"></span>
                <span className="text-white text-sm font-medium">Explorando</span>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-4 text-xs text-slate-300 justify-center">
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#1a2b4c] border border-slate-600"></div><span>Visitado</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-transparent border border-slate-600"></div><span>Não visitado</span></div>
          <div className="flex items-center gap-1"><svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M3 22L21 12L3 2L7 12L3 22Z" /></svg><span>Robô</span></div>
        </div>
      </CardContent>
    </Card>
  );
}
