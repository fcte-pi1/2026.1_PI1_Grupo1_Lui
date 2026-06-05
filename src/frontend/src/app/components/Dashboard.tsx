import React, { useState, useEffect } from "react";
import {
  BatteryFull, BatteryMedium, BatteryLow,
  Gauge, Clock, Target, MapPin, Activity, Wifi, AlertTriangle, ShieldAlert
} from "lucide-react";
import { RobotMap } from "./MapaTempoReal";

export interface CelulaMapa {
  x: number;
  y: number;
  paredes: { norte: boolean; sul: boolean; leste: boolean; oeste: boolean };
}

export interface DadosTelemetria {
  timestamp: number;
  estado_fsm: string;
  bateria_v: number;
  posicao_x: number;
  posicao_y: number;
  orientacao: 'NORTE' | 'SUL' | 'LESTE' | 'OESTE';
  tamanho_grade: number;
  paredes_atuais: { norte: boolean; sul: boolean; leste: boolean; oeste: boolean };
  causa_erro?: string;
}

export interface RegistoErro {
  id: string;
  timestamp: number;
  causa: string;
  posicao_x: number;
  posicao_y: number;
}

const FLUXO_MOCK_TELEMETRIA: DadosTelemetria[] = [
  { timestamp: 1715456789, estado_fsm: "CALIBRATING", bateria_v: 7.4, posicao_x: 0, posicao_y: 7, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: true, leste: true, oeste: true } },
  { timestamp: 1715456790, estado_fsm: "MAPPING", bateria_v: 7.4, posicao_x: 0, posicao_y: 6, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: false, leste: true, oeste: true } },
  { timestamp: 1715456791, estado_fsm: "MAPPING", bateria_v: 7.3, posicao_x: 0, posicao_y: 5, orientacao: "LESTE", tamanho_grade: 8, paredes_atuais: { norte: true, sul: false, leste: false, oeste: true } },
  { timestamp: 1715456792, estado_fsm: "MAPPING", bateria_v: 7.3, posicao_x: 1, posicao_y: 5, orientacao: "LESTE", tamanho_grade: 8, paredes_atuais: { norte: true, sul: true, leste: false, oeste: false } },
  { timestamp: 1715456793, estado_fsm: "MAPPING", bateria_v: 7.2, posicao_x: 2, posicao_y: 5, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: true, leste: true, oeste: false } },
  { timestamp: 1715456794, estado_fsm: "MAPPING", bateria_v: 7.2, posicao_x: 2, posicao_y: 4, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: false, leste: true, oeste: true } },
  { timestamp: 1715456795, estado_fsm: "ERROR", bateria_v: 6.5, posicao_x: 2, posicao_y: 4, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: false, leste: true, oeste: true }, causa_erro: "Tração bloqueada: Pico de corrente no motor esquerdo (>2A)." },
  { timestamp: 1715456796, estado_fsm: "ERROR", bateria_v: 6.5, posicao_x: 2, posicao_y: 4, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: false, leste: true, oeste: true }, causa_erro: "Tração bloqueada: Pico de corrente no motor esquerdo (>2A)." }
];

interface PropriedadesCartao {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
  highlight?: boolean;
}

function CartaoEstatistica({ label, value, sub, icon, iconBg, highlight }: PropriedadesCartao) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm flex flex-col gap-3 p-4 transition-all ${
        highlight ? "border-red-400 shadow-red-100" : "border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-slate-500 uppercase tracking-widest text-[0.68rem] font-bold">
          {label}
        </p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
      <div>
        <div className="text-slate-900 tabular-nums text-2xl font-bold leading-none">
          {value}
        </div>
        {sub && <p className="text-slate-400 mt-1 text-xs font-medium">{sub}</p>}
      </div>
    </div>
  );
}

export function Dashboard() {
  const [indiceAtual, setIndiceAtual] = useState(0);
  const telemetriaAtual = FLUXO_MOCK_TELEMETRIA[indiceAtual];

  const [celulasExploradas, setCelulasExploradas] = useState<Record<string, CelulaMapa>>({});
  const [historicoErros, setHistoricoErros] = useState<RegistoErro[]>([]);
  
  const [isLogAberto, setIsLogAberto] = useState(false);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceAtual((ant) => {
        const proximo = ant < FLUXO_MOCK_TELEMETRIA.length - 1 ? ant + 1 : 0;
        const novaTelemetria = FLUXO_MOCK_TELEMETRIA[proximo];

        if (proximo === 0) {
          setCelulasExploradas({});
          setHistoricoErros([]);
          setIsLogAberto(false);
        } else {
          const chaveMapa = `${novaTelemetria.posicao_x}-${novaTelemetria.posicao_y}`;
          setCelulasExploradas(prev => prev[chaveMapa] ? prev : {
            ...prev,
            [chaveMapa]: { x: novaTelemetria.posicao_x, y: novaTelemetria.posicao_y, paredes: novaTelemetria.paredes_atuais }
          });

          if (novaTelemetria.estado_fsm === 'ERROR') {
            setHistoricoErros(prev => {
              if (prev.some(erro => erro.timestamp === novaTelemetria.timestamp)) return prev;
              setIsLogAberto(true);
              return [{
                id: `${novaTelemetria.timestamp}-${Math.random()}`,
                timestamp: novaTelemetria.timestamp,
                causa: novaTelemetria.causa_erro || "Causa desconhecida.",
                posicao_x: novaTelemetria.posicao_x,
                posicao_y: novaTelemetria.posicao_y
              }, ...prev];
            });
          }
        }
        return proximo;
      });
    }, 1500);
    return () => clearInterval(intervalo);
  }, []);

  const qtdExploradas = Object.keys(celulasExploradas).length;
  const totalCelulas = telemetriaAtual.tamanho_grade * telemetriaAtual.tamanho_grade;
  const percentual = Math.round((qtdExploradas / totalCelulas) * 100) || 0;

  const possuiErroCritico = telemetriaAtual.estado_fsm === 'ERROR';
  
  const obterCorBateria = (tensao: number) => {
    if (tensao > 7.2) return { icone: BatteryFull, corTexto: "text-emerald-500", corFundo: "bg-emerald-50" };
    if (tensao > 6.8) return { icone: BatteryMedium, corTexto: "text-amber-500", corFundo: "bg-amber-50" };
    return { icone: BatteryLow, corTexto: "text-red-500", corFundo: "bg-red-50" };
  };
  const estiloBateria = obterCorBateria(telemetriaAtual.bateria_v);

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC] font-sans relative overflow-hidden">
      
      <div className={`absolute top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out ${possuiErroCritico ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="bg-red-600 text-white px-8 py-3 flex items-center justify-center gap-4 shadow-xl shadow-red-600/30">
          <AlertTriangle className="w-7 h-7 animate-pulse" />
          <span className="font-bold text-lg tracking-wider uppercase">
            Alarme Crítico de Hardware: <span className="font-medium text-red-100">{telemetriaAtual.causa_erro}</span>
          </span>
        </div>
      </div>

      <div className={`px-8 py-5 flex items-center justify-between shrink-0 bg-white border-b border-slate-200 shadow-sm z-10 transition-all duration-300 ${possuiErroCritico ? 'mt-12' : 'mt-0'}`}>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard</h1>
          <p className="text-slate-400 font-medium text-sm mt-0.5">Monitoramento Analítico</p>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <Wifi className={`w-3.5 h-3.5 animate-pulse ${possuiErroCritico ? 'text-red-500' : 'text-emerald-400'}`} />
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Último Pacote:</span>
            <span className="font-mono text-sm text-slate-500 font-medium">{telemetriaAtual.timestamp}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span>Grade detetada: {telemetriaAtual.tamanho_grade}x{telemetriaAtual.tamanho_grade}</span>
            <span className="text-slate-300">•</span>
            <span>{qtdExploradas} de {totalCelulas} células ({percentual}%)</span>
          </div>
        </div>
      </div>

      <div className="px-8 pt-6 pb-4 grid grid-cols-2 xl:grid-cols-6 gap-4 shrink-0">
        <CartaoEstatistica label="Bateria" value={`${telemetriaAtual.bateria_v.toFixed(1)}V`} sub="Tensão instantânea" iconBg={estiloBateria.corFundo} icon={<estiloBateria.icone className={`w-5 h-5 ${estiloBateria.corTexto}`} strokeWidth={2} />} />
        <CartaoEstatistica label="Velocidade" value="0.890" sub="m/s · atual" iconBg="bg-blue-50" icon={<Gauge className="w-5 h-5 text-blue-500" strokeWidth={2} />} />
        <CartaoEstatistica label="Cronómetro" value="00:12.4" sub="Tempo de percurso" iconBg="bg-violet-50" icon={<Clock className="w-5 h-5 text-violet-500" strokeWidth={2} />} />
        <CartaoEstatistica label="Objetivo" value="Explorando" sub="Mapeando labirinto" iconBg="bg-slate-100" icon={<Target className="w-5 h-5 text-slate-400" strokeWidth={2} />} />
        <CartaoEstatistica label="Posição Atual" value={`(${telemetriaAtual.posicao_x}, ${telemetriaAtual.posicao_y})`} sub="Ponto no labirinto" iconBg="bg-indigo-50" icon={<MapPin className="w-5 h-5 text-indigo-500" strokeWidth={2} />} />
        <CartaoEstatistica 
          label="Estado do Robô" 
          value={telemetriaAtual.estado_fsm} 
          sub={possuiErroCritico ? "Intervenção necessária!" : "Operação Autónoma"} 
          iconBg={possuiErroCritico ? "bg-red-100" : "bg-emerald-50"} 
          icon={<Activity className={`w-5 h-5 ${possuiErroCritico ? "text-red-500" : "text-emerald-500"}`} strokeWidth={2} />} 
          highlight={possuiErroCritico} 
        />
      </div>

      <div className="flex-1 px-8 pb-8 flex min-h-0 relative">
        
        <div className={`w-full h-full rounded-2xl overflow-hidden border shadow-2xl relative transition-colors duration-500 ${possuiErroCritico ? 'border-red-500/50 shadow-red-500/20 bg-[#1A0B0B]' : 'border-slate-800 bg-[#0B1120]'}`}>
          <RobotMap telemetria={telemetriaAtual} celulasExploradas={celulasExploradas} />

          <div className="absolute top-6 right-6 bottom-6 z-30 flex flex-col items-end gap-3 pointer-events-none">
            
            {/* Botão de Controlo (Alternar) */}
            <button 
              onClick={() => setIsLogAberto(!isLogAberto)}
              className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-full shadow-xl border transition-all duration-300 ${
                isLogAberto 
                  ? 'bg-slate-950 border-slate-800 text-sky-400 hover:bg-slate-900' 
                  : 'bg-slate-900/95 backdrop-blur-sm border-slate-800 text-slate-200 hover:bg-slate-850'
              }`}
            >
              <ShieldAlert className={`w-5 h-5 ${historicoErros.length > 0 && !isLogAberto ? 'text-red-400 animate-pulse' : 'text-sky-400'}`} />
              <span className="font-bold text-sm tracking-wide">
                {isLogAberto ? 'Ocultar Logs' : 'Logs de Interrupção'}
              </span>
              {!isLogAberto && historicoErros.length > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {historicoErros.length}
                </span>
              )}
            </button>

            {/* Gaveta de Conteúdo Expansível */}
            <div 
              className={`pointer-events-auto bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-800/80 flex flex-col transition-all duration-500 ease-out origin-top-right ${isLogAberto ? 'w-80 opacity-100 scale-100 max-h-full' : 'w-80 opacity-0 scale-95 max-h-0'}`}
            >
              {/* Cabeçalho da Gaveta */}
              <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between rounded-t-2xl">
                <span className="font-bold text-slate-300 text-xs uppercase tracking-wider">Histórico Crítico</span>
                <span className="bg-slate-800 text-sky-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{historicoErros.length} EVENTOS</span>
              </div>
              
              {/* Corpo da Gaveta */}
              <div className="overflow-y-auto p-4 flex flex-col gap-3 max-h-[50vh] scrollbar-thin scrollbar-thumb-slate-700">
                {historicoErros.length === 0 ? (
                  <div className="py-8 text-center flex flex-col items-center gap-2 opacity-60">
                    <ShieldAlert className="w-8 h-8 text-slate-500" />
                    <p className="text-sm text-slate-400 font-medium">Nenhum evento crítico registado.</p>
                  </div>
                ) : (
                  historicoErros.map((erro) => (
                    <div key={erro.id} className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl flex flex-col gap-1.5 animate-in slide-in-from-right-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Falha de Hardware</span>
                        <span className="text-[10px] font-mono text-slate-500">{erro.timestamp}</span>
                      </div>
                      <p className="text-sm text-slate-200 font-medium leading-snug">
                        {erro.causa}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-sky-400/90 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-sky-500" />
                        Ocorrência na célula: ({erro.posicao_x}, {erro.posicao_y})
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}