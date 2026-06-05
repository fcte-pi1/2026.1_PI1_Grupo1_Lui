import type{ DadosTelemetria, CelulaMapa } from './Dashboard';

interface PropriedadesMapa {
  telemetria: DadosTelemetria;
  celulasExploradas: Record<string, CelulaMapa>;
}

export function RobotMap({ telemetria, celulasExploradas }: PropriedadesMapa) {
  const tamanho = telemetria.tamanho_grade;

  const obterRotacaoRobo = (orientacao: string) => {
    switch (orientacao) {
      case 'NORTE': return '0deg';
      case 'LESTE': return '90deg';
      case 'SUL': return '180deg';
      case 'OESTE': return '-90deg';
      default: return '0deg';
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      
      <div className="absolute inset-4 md:inset-8 flex items-center justify-center">
        <div 
          className="aspect-square h-full max-w-full max-h-full grid bg-[#0f172a] rounded-xl shadow-[inset_0_0_30px_rgba(0,0,0,0.6)] border border-slate-700/60"
          style={{ 
            gridTemplateColumns: `repeat(${tamanho}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${tamanho}, minmax(0, 1fr))` 
          }}
        >
          {Array.from({ length: tamanho }).map((_, y) => (
            Array.from({ length: tamanho }).map((_, x) => {
              
              const chave = `${x}-${y}`;
              const celula = celulasExploradas[chave];
              const isRoboAqui = telemetria.posicao_x === x && telemetria.posicao_y === y;

              let classesParedes = "border-slate-800/40 border border-dashed"; 
              let corFundo = "bg-transparent";

              if (celula) {
                corFundo = "bg-[#1e293b]"; 
                classesParedes = `
                  ${celula.paredes.norte ? 'border-t-[3px] border-t-red-500' : 'border-t border-t-slate-700/50'}
                  ${celula.paredes.sul ? 'border-b-[3px] border-b-red-500' : 'border-b border-b-slate-700/50'}
                  ${celula.paredes.leste ? 'border-r-[3px] border-r-red-500' : 'border-r border-r-slate-700/50'}
                  ${celula.paredes.oeste ? 'border-l-[3px] border-l-red-500' : 'border-l border-l-slate-700/50'}
                `;
              }

              if (isRoboAqui) corFundo = "bg-blue-500/20";

              return (
                <div key={chave} className={`relative flex items-center justify-center transition-all duration-300 ${classesParedes} ${corFundo}`}>
                  {isRoboAqui && (
                    <div 
                      className="absolute w-[65%] h-[65%] drop-shadow-[0_0_12px_rgba(59,130,246,0.9)] transition-transform duration-500 ease-in-out" 
                      style={{ transform: `rotate(${obterRotacaoRobo(telemetria.orientacao)})` }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-blue-400">
                        <path d="M12 2L22 20L12 16L2 20L12 2Z" fill="currentColor" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })
          ))}
        </div>
      </div>
    </div>
  );
}