import React, { useState, useEffect } from 'react';

const mockTelemetryStream = [
  { timestamp: 1715456789, estado_fsm: "MAPPING", bateria_v: 7.4, posicao_x: 0, posicao_y: 0, orientacao: "NORTE" },
  { timestamp: 1715456790, estado_fsm: "MAPPING", bateria_v: 7.4, posicao_x: 0, posicao_y: 1, orientacao: "NORTE" },
  { timestamp: 1715456791, estado_fsm: "MAPPING", bateria_v: 7.4, posicao_x: 0, posicao_y: 2, orientacao: "NORTE" },
  { timestamp: 1715456792, estado_fsm: "MAPPING", bateria_v: 7.4, posicao_x: 1, posicao_y: 2, orientacao: "LESTE" },
  { timestamp: 1715456793, estado_fsm: "MAPPING", bateria_v: 7.4, posicao_x: 2, posicao_y: 2, orientacao: "LESTE" },
  { timestamp: 1715456794, estado_fsm: "MAPPING", bateria_v: 7.4, posicao_x: 2, posicao_y: 3, orientacao: "NORTE" },
  { timestamp: 1715456795, estado_fsm: "MAPPING", bateria_v: 7.4, posicao_x: 2, posicao_y: 4, orientacao: "NORTE" },
  { timestamp: 1715456796, estado_fsm: "GOAL_REACHED", bateria_v: 7.4, posicao_x: 2, posicao_y: 4, orientacao: "NORTE" },
];

export default function MapaTempoReal() {
  const [telemetry, setTelemetry] = useState(mockTelemetryStream[0]);
  const [visitedCells, setVisitedCells] = useState(new Set());
  const mazeSize = 16;

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      const currentData = mockTelemetryStream[index];
      setTelemetry(currentData);
      
      // Adiciona a célula atual ao rastro de visitadas
      setVisitedCells(prev => new Set(prev).add(`${currentData.posicao_x}-${currentData.posicao_y}`));
      
      index = index < mockTelemetryStream.length - 1 ? index + 1 : index;
    }, 150);

    return () => clearInterval(interval);
  }, []);

  const getRotation = (orientacao) => {
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
    <div className="flex items-center justify-center p-4 bg-[#0a1128] rounded-xl font-sans w-fit">
      {/* Contêiner principal do Mapa (relativo para o badge flutuante) */}
      <div className="relative border-2 border-slate-600 bg-[#070b19] p-1">
        
        {/* Grade 16x16 */}
        <div 
          className="grid gap-[1px]"
          style={{ gridTemplateColumns: `repeat(${mazeSize}, 24px)`, gridTemplateRows: `repeat(${mazeSize}, 24px)` }}
        >
          {rows.map((y) => (
            cols.map((x) => {
              const isRobotHere = telemetry.posicao_x === x && telemetry.posicao_y === y;
              const isVisited = visitedCells.has(`${x}-${y}`);

              return (
                <div 
                  key={`${x}-${y}`} 
                  // Cor de fundo muda se a célula já foi visitada (conforme o vídeo)
                  className={`flex items-center justify-center border-[0.5px] border-slate-800 transition-colors duration-200 
                    ${isVisited ? 'bg-[#1a2b4c]' : 'bg-transparent'}`
                  }
                >
                  {isRobotHere && (
                    <div className={`transform transition-transform duration-100 ${getRotation(telemetry.orientacao)}`}>
                      {/* Seta branca baseada no design do vídeo */}
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

        {/* Selo de Status Flutuante (Bottom-Left) */}
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
    </div>
  );
}