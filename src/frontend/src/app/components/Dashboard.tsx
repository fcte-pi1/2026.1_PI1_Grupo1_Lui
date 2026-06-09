import React, { useState, useEffect } from "react";
import {
  BatteryFull, BatteryMedium, BatteryLow,
  Gauge, Clock, Target, MapPin, Activity, Wifi, AlertTriangle, ShieldAlert
} from "lucide-react";
import { RobotMap } from "./MapaTempoReal";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:3001";

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
  velocidade_media?: number;
}

export interface RegistoErro {
  id: string;
  timestamp: number;
  causa: string;
  posicao_x: number;
  posicao_y: number;
}

const TRAJETO_RAPIDO_IDEAL = [
  { x: 0, y: 7 },
  { x: 0, y: 6 },
  { x: 0, y: 5 },
  { x: 1, y: 5 },
  { x: 2, y: 5 },
  { x: 2, y: 4 }
];

const FLUXO_MOCK_TELEMETRIA: DadosTelemetria[] = [
  // Mapeamento e Exploração
  { timestamp: 1715456789, estado_fsm: "CALIBRATING", bateria_v: 7.4, posicao_x: 0, posicao_y: 7, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: true, leste: true, oeste: true }, velocidade_media: 0.0 },
  { timestamp: 1715456790, estado_fsm: "MAPPING", bateria_v: 7.4, posicao_x: 0, posicao_y: 6, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: false, leste: true, oeste: true }, velocidade_media: 0.35 },
  { timestamp: 1715456791, estado_fsm: "MAPPING", bateria_v: 7.3, posicao_x: 0, posicao_y: 5, orientacao: "LESTE", tamanho_grade: 8, paredes_atuais: { norte: true, sul: false, leste: false, oeste: true }, velocidade_media: 0.38 },
  { timestamp: 1715456792, estado_fsm: "MAPPING", bateria_v: 7.3, posicao_x: 1, posicao_y: 5, orientacao: "LESTE", tamanho_grade: 8, paredes_atuais: { norte: true, sul: true, leste: false, oeste: false }, velocidade_media: 0.40 },
  { timestamp: 1715456793, estado_fsm: "MAPPING", bateria_v: 7.2, posicao_x: 2, posicao_y: 5, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: true, leste: true, oeste: false }, velocidade_media: 0.42 },
  { timestamp: 1715456794, estado_fsm: "MAPPING", bateria_v: 7.2, posicao_x: 2, posicao_y: 4, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: false, leste: true, oeste: true }, velocidade_media: 0.45 },
  // Objetivo alcançado no mapeamento
  { timestamp: 1715456795, estado_fsm: "GOAL_REACHED", bateria_v: 7.1, posicao_x: 2, posicao_y: 4, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: false, leste: true, oeste: true }, velocidade_media: 0.0 },
  // Corrida rápida (FAST_RUN) - Volta 1
  { timestamp: 1715456796, estado_fsm: "FAST_RUN", bateria_v: 7.0, posicao_x: 0, posicao_y: 7, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: true, leste: true, oeste: true }, velocidade_media: 0.85 },
  { timestamp: 1715456797, estado_fsm: "FAST_RUN", bateria_v: 7.0, posicao_x: 0, posicao_y: 5, orientacao: "LESTE", tamanho_grade: 8, paredes_atuais: { norte: true, sul: false, leste: false, oeste: true }, velocidade_media: 0.95 },
  { timestamp: 1715456798, estado_fsm: "FAST_RUN", bateria_v: 6.9, posicao_x: 2, posicao_y: 5, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: true, leste: true, oeste: false }, velocidade_media: 1.10 },
  { timestamp: 1715456799, estado_fsm: "FAST_RUN", bateria_v: 6.9, posicao_x: 2, posicao_y: 4, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: false, leste: true, oeste: true }, velocidade_media: 1.25 },
  // Volta 2 (Mais rápido) - Bateria baixa / Alerta Crítico
  { timestamp: 1715456800, estado_fsm: "FAST_RUN", bateria_v: 6.7, posicao_x: 0, posicao_y: 7, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: true, leste: true, oeste: true }, velocidade_media: 0.90 },
  { timestamp: 1715456801, estado_fsm: "FAST_RUN", bateria_v: 6.6, posicao_x: 0, posicao_y: 5, orientacao: "LESTE", tamanho_grade: 8, paredes_atuais: { norte: true, sul: false, leste: false, oeste: true }, velocidade_media: 1.05 },
  { timestamp: 1715456802, estado_fsm: "FAST_RUN", bateria_v: 6.5, posicao_x: 2, posicao_y: 4, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: false, leste: true, oeste: true }, velocidade_media: 1.30 },
  // Erro crítico de bateria
  { timestamp: 1715456803, estado_fsm: "ERROR", bateria_v: 6.3, posicao_x: 2, posicao_y: 4, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: false, leste: true, oeste: true }, causa_erro: "Parada de Emergência: Tensão da bateria abaixo do limite crítico (6.5V).", velocidade_media: 0.0 }
];

interface PropriedadesCartao {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
  highlight?: boolean;
  critical?: boolean;
  className?: string;
}

function CartaoEstatistica({ label, value, sub, icon, iconBg, highlight, critical, className }: PropriedadesCartao) {
  return (
    <div className={`rounded-xl border shadow-sm flex flex-col gap-3 p-4 transition-all duration-300 ${
        critical 
          ? "animate-battery-critical border-red-500" 
          : highlight 
            ? "bg-white border-red-400 shadow-red-100" 
            : "bg-white border-slate-200"
      } ${className || ""}`}
    >
      <div className="flex items-center justify-between">
        <p className={`uppercase tracking-widest text-[0.68rem] font-bold ${critical ? "text-red-950" : "text-slate-500"}`}>
          {label}
        </p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${critical ? "bg-red-200" : iconBg}`}>
          {icon}
        </div>
      </div>
      <div>
        <div className={`tabular-nums text-2xl font-bold leading-none ${critical ? "text-red-950 font-black" : "text-slate-900"}`}>
          {value}
        </div>
        {sub && <p className={`mt-1 text-xs font-medium ${critical ? "text-red-900/80" : "text-slate-400"}`}>{sub}</p>}
      </div>
    </div>
  );
}

export function Dashboard() {
  const [, setIndiceAtual] = useState(0);
  const [telemetriaAtual, setTelemetriaAtual] = useState<DadosTelemetria>(FLUXO_MOCK_TELEMETRIA[0]);

  const [celulasExploradas, setCelulasExploradas] = useState<Record<string, CelulaMapa>>({});
  const [historicoErros, setHistoricoErros] = useState<RegistoErro[]>([]);
  const [isLogAberto, setIsLogAberto] = useState(false);
  const [isSimulation, setIsSimulation] = useState(true);

  // Override de layout para desenvolvimento (AUTO | EXPLORACAO | PERFORMANCE)
  const [overrideModo, setOverrideModo] = useState<'AUTO' | 'EXPLORACAO' | 'PERFORMANCE'>('AUTO');

  // Estados para Cronômetro e Voltas do modo FAST_RUN (HU 2.4)
  const [tempoLapAtual, setTempoLapAtual] = useState(0);
  const [historicoVoltas, setHistoricoVoltas] = useState<number[]>([]);
  const [isLapRunning, setIsLapRunning] = useState(false);
  const lapStartTimeRef = React.useRef<number>(0);

  const possuiErroCritico = telemetriaAtual.estado_fsm === 'ERROR';
  const isBateriaCritica = telemetriaAtual.bateria_v < 6.8; // HU 3.2.1
  const isFastRunReal = telemetriaAtual.estado_fsm === 'FAST_RUN'; // HU 2.4
  const isFastRun = overrideModo === 'AUTO' ? isFastRunReal : overrideModo === 'PERFORMANCE';

  // Lógica reativa para iniciar/parar o cronômetro do desenvolvedor sob overrides
  useEffect(() => {
    if (overrideModo === 'PERFORMANCE') {
      lapStartTimeRef.current = Date.now();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTempoLapAtual(0);
      setIsLapRunning(true);
      setIsLogAberto(true);
    } else if (overrideModo === 'EXPLORACAO') {
      setIsLapRunning(false);
      setTempoLapAtual(0);
    } else {
      // Se voltou para AUTO, segue o estado da telemetria simulada atual
      if (!isFastRunReal) {
        setIsLapRunning(false);
        setTempoLapAtual(0);
      } else {
        lapStartTimeRef.current = Date.now();
        setTempoLapAtual(0);
        setIsLapRunning(true);
      }
    }
  }, [overrideModo, isFastRunReal]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isLapRunning) {
      timer = setInterval(() => {
        setTempoLapAtual((Date.now() - lapStartTimeRef.current) / 1000);
      }, 50);
    }
    return () => clearInterval(timer);
  }, [isLapRunning]);

  useEffect(() => {
    if (!isSimulation) return;

    const intervalo = setInterval(() => {
      setIndiceAtual((ant) => {
        const proximo = ant < FLUXO_MOCK_TELEMETRIA.length - 1 ? ant + 1 : 0;
        const novaTelemetria = FLUXO_MOCK_TELEMETRIA[proximo];
        setTelemetriaAtual(novaTelemetria);

        if (proximo === 0) {
          setCelulasExploradas({});
          setHistoricoErros([]);
          setIsLogAberto(false);
          setHistoricoVoltas([]);
          setIsLapRunning(false);
          setTempoLapAtual(0);
          if (overrideModo === 'PERFORMANCE') {
            lapStartTimeRef.current = Date.now();
            setIsLapRunning(true);
            setIsLogAberto(true);
          }
        } else {
          // Mapeia células
          const chaveMapa = `${novaTelemetria.posicao_x}-${novaTelemetria.posicao_y}`;
          setCelulasExploradas(prev => prev[chaveMapa] ? prev : {
            ...prev,
            [chaveMapa]: { x: novaTelemetria.posicao_x, y: novaTelemetria.posicao_y, paredes: novaTelemetria.paredes_atuais }
          });

          // Registra erros
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

          // Lógica de voltas no FAST_RUN (Apenas no modo AUTO)
          if (overrideModo === 'AUTO') {
            if (novaTelemetria.estado_fsm === 'FAST_RUN') {
              setIsLogAberto(true);
              if (novaTelemetria.posicao_x === 0 && novaTelemetria.posicao_y === 7) {
                lapStartTimeRef.current = Date.now();
                setTempoLapAtual(0);
                setIsLapRunning(true);
              }
              if (novaTelemetria.posicao_x === 2 && novaTelemetria.posicao_y === 4) {
                setIsLapRunning(false);
                const finalTime = (Date.now() - lapStartTimeRef.current) / 1000;
                setTempoLapAtual(finalTime);
                setHistoricoVoltas(prev => [...prev, finalTime]);
              }
            } else {
              setIsLapRunning(false);
            }
          }
        }
        return proximo;
      });
    }, 1500);
    return () => clearInterval(intervalo);
  }, [overrideModo, isSimulation]);

  // Efeito do Socket.io para Tempo Real
  useEffect(() => {
    if (isSimulation) return;

    const socket = io(SOCKET_URL);
    
    socket.on('connect', () => {
      console.log('✅ [Dashboard] Conectado ao servidor Socket.io em Tempo Real');
    });

    socket.on('telemetry', (dadosDecodificados) => {
      // Decodifica a Bitmask (número) para o objeto de booleanos que o MapaTempoReal.tsx usa
      const p = dadosDecodificados.paredes;
      const bitmask = typeof p === 'number' ? p : 0;
      const paredesDecodificadas = {
        norte: !!(bitmask & 1),
        leste: !!(bitmask & 2),
        sul: !!(bitmask & 4),
        oeste: !!(bitmask & 8)
      };

      // Atualiza telemetria base
      const novaTelemetria: DadosTelemetria = {
        ...dadosDecodificados,
        timestamp: Math.floor(Date.now() / 1000),
        tamanho_grade: dadosDecodificados.tamanho_grade || telemetriaAtual.tamanho_grade,
        paredes_atuais: paredesDecodificadas
      };
      
      setTelemetriaAtual(novaTelemetria);

      // Atualiza celulas exploradas
      const chaveMapa = `${novaTelemetria.posicao_x}-${novaTelemetria.posicao_y}`;
      setCelulasExploradas(prev => prev[chaveMapa] ? prev : {
        ...prev,
        [chaveMapa]: { x: novaTelemetria.posicao_x, y: novaTelemetria.posicao_y, paredes: novaTelemetria.paredes_atuais }
      });

      // Erro handling
      if (novaTelemetria.estado_fsm === 'ERROR') {
        setHistoricoErros(prev => {
          if (prev.some(erro => erro.timestamp === novaTelemetria.timestamp)) return prev;
          setIsLogAberto(true);
          return [{
            id: `${novaTelemetria.timestamp}-${Math.random()}`,
            timestamp: novaTelemetria.timestamp,
            causa: novaTelemetria.causa_erro || "Falha captada em tempo real.",
            posicao_x: novaTelemetria.posicao_x,
            posicao_y: novaTelemetria.posicao_y
          }, ...prev];
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [isSimulation, telemetriaAtual.tamanho_grade]);

  const qtdExploradas = Object.keys(celulasExploradas).length;
  const totalCelulas = telemetriaAtual.tamanho_grade * telemetriaAtual.tamanho_grade;
  const percentual = Math.round((qtdExploradas / totalCelulas) * 100) || 0;

  const obterCorBateria = (tensao: number) => {
    if (tensao >= 6.8) {
      if (tensao > 7.2) return { icone: BatteryFull, corTexto: "text-emerald-500", corFundo: "bg-emerald-50" };
      return { icone: BatteryMedium, corTexto: "text-amber-500", corFundo: "bg-amber-50" };
    }
    return { icone: BatteryLow, corTexto: "text-red-500", corFundo: "bg-red-50" };
  };
  const estiloBateria = obterCorBateria(telemetriaAtual.bateria_v);
  const bestLap = historicoVoltas.length > 0 ? Math.min(...historicoVoltas) : null;

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC] font-sans relative overflow-hidden">
      
      {/* Alerta Crítico de Hardware */}
      <div className={`absolute top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out ${possuiErroCritico ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="bg-red-600 text-white px-8 py-3 flex items-center justify-center gap-4 shadow-xl shadow-red-600/30">
          <AlertTriangle className="w-7 h-7 animate-pulse" />
          <span className="font-bold text-lg tracking-wider uppercase">
            Alarme Crítico de Hardware: <span className="font-medium text-red-100">{telemetriaAtual.causa_erro}</span>
          </span>
        </div>
      </div>

      {/* Alerta de Bateria Fraca (HU 3.2.1) */}
      <div className={`absolute top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out ${isBateriaCritica && !possuiErroCritico ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="bg-red-600 text-white px-8 py-3 flex items-center justify-center gap-4 shadow-xl shadow-red-600/30 animate-pulse">
          <AlertTriangle className="w-7 h-7 animate-bounce text-amber-300" />
          <span className="font-bold text-lg tracking-wider uppercase">
            Alerta Crítico: <span className="font-medium text-red-100">Bateria Crítica ({telemetriaAtual.bateria_v.toFixed(2)}V). Risco de queda do sistema!</span>
          </span>
        </div>
      </div>

      {/* Cabeçalho */}
      <div className={`px-8 py-5 flex items-center justify-between shrink-0 bg-white border-b border-slate-200 shadow-sm z-10 transition-all duration-300 ${(possuiErroCritico || isBateriaCritica) ? 'mt-12' : 'mt-0'}`}>
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              {isFastRun ? "Dashboard · Alta Performance" : "Dashboard"}
            </h1>
            <p className="text-slate-400 font-medium text-sm mt-0.5">
              {isFastRun ? "Foco em métricas de corrida rápida" : "Monitoramento Analítico"}
            </p>
          </div>
          {isFastRun && (
            <span className="px-3 py-1 text-[10px] font-black tracking-widest uppercase rounded-full bg-violet-600 text-white animate-pulse shadow-lg shadow-violet-600/30 border border-violet-500">
              FAST_RUN
            </span>
          )}
        </div>
        
        {/* Controles de alternância manual (override) para o desenvolvedor */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-250 pointer-events-auto">
            <button
              onClick={() => setOverrideModo('AUTO')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                overrideModo === 'AUTO'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Auto
            </button>
            <button
              onClick={() => setOverrideModo('EXPLORACAO')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                overrideModo === 'EXPLORACAO'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Exploração
            </button>
            <button
              onClick={() => setOverrideModo('PERFORMANCE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                overrideModo === 'PERFORMANCE'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Alta Performance
            </button>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsSimulation(!isSimulation)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase transition-colors shadow-sm border ${
                  isSimulation 
                    ? 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200' 
                    : 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200'
                }`}
              >
                {isSimulation ? "MODO SIMULAÇÃO" : "TEMPO REAL"}
              </button>
              <Wifi className={`w-3.5 h-3.5 ${isSimulation ? 'text-amber-500' : 'animate-pulse text-emerald-500'}`} />
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
      </div>

      {/* Grid de Cartões Analíticos Adaptativo (HU 2.4 e HU 3.2.1) */}
      <div className="px-8 pt-6 pb-4 grid grid-cols-2 xl:grid-cols-6 gap-4 shrink-0">
        {isFastRun ? (
          <>
            {/* Volta Atual (Em destaque, col-span-2) */}
            <CartaoEstatistica 
              label="Volta Atual" 
              value={`${tempoLapAtual.toFixed(2)}s`} 
              sub={isLapRunning ? "Corrida rápida ativa" : "Corrida pausada / fim da volta"} 
              iconBg="bg-violet-50" 
              icon={<Clock className={`w-5 h-5 ${isLapRunning ? 'text-violet-600 animate-spin' : 'text-violet-500'}`} strokeWidth={2.5} />} 
              className="col-span-2 border-violet-300 bg-violet-50/20"
            />
            {/* Melhor Volta */}
            <CartaoEstatistica 
              label="Melhor Volta" 
              value={bestLap ? `${bestLap.toFixed(2)}s` : "---"} 
              sub="Recorde da sessão" 
              iconBg="bg-amber-50" 
              icon={<Target className="w-5 h-5 text-amber-500" strokeWidth={2} />} 
            />
            {/* Velocidade de Alta Performance */}
            <CartaoEstatistica 
              label="Velocidade" 
              value={`${(telemetriaAtual.velocidade_media || 0).toFixed(3)} m/s`} 
              sub="atual · modo rápido" 
              iconBg="bg-blue-50" 
              icon={<Gauge className="w-5 h-5 text-blue-500" strokeWidth={2} />} 
            />
            {/* Tensão da Bateria (HU 3.2.1) */}
            <CartaoEstatistica 
              label="Bateria" 
              value={`${telemetriaAtual.bateria_v.toFixed(2)}V`} 
              sub="Tensão instantânea" 
              iconBg={estiloBateria.corFundo} 
              icon={<estiloBateria.icone className={`w-5 h-5 ${estiloBateria.corTexto}`} strokeWidth={2} />} 
              critical={isBateriaCritica}
            />
            {/* Trajeto Rápido */}
            <CartaoEstatistica 
              label="Trajeto Rápido" 
              value="6 cél." 
              sub="Rota otimizada" 
              iconBg="bg-emerald-50" 
              icon={<MapPin className="w-5 h-5 text-emerald-500" strokeWidth={2} />} 
            />
          </>
        ) : (
          <>
            {/* Layout Padrão de Exploração */}
            <CartaoEstatistica 
              label="Bateria" 
              value={`${telemetriaAtual.bateria_v.toFixed(2)}V`} 
              sub="Tensão instantânea" 
              iconBg={estiloBateria.corFundo} 
              icon={<estiloBateria.icone className={`w-5 h-5 ${estiloBateria.corTexto}`} strokeWidth={2} />} 
              critical={isBateriaCritica}
            />
            <CartaoEstatistica label="Velocidade" value={`${(telemetriaAtual.velocidade_media || 0.890).toFixed(3)} m/s`} sub="m/s · atual" iconBg="bg-blue-50" icon={<Gauge className="w-5 h-5 text-blue-500" strokeWidth={2} />} />
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
          </>
        )}
      </div>

      <div className="flex-1 px-8 pb-8 flex min-h-0 relative">
        
        <div className={`w-full h-full rounded-2xl overflow-hidden border shadow-2xl relative transition-colors duration-500 ${possuiErroCritico ? 'border-red-500/50 shadow-red-500/20 bg-[#1A0B0B]' : 'border-slate-800 bg-[#0B1120]'}`}>
          
          <RobotMap 
            telemetria={telemetriaAtual} 
            celulasExploradas={celulasExploradas} 
            trajetoRapido={TRAJETO_RAPIDO_IDEAL} 
            mostrarTrajetoRapido={isFastRun}
          />

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
              {isFastRun ? (
                <>
                  <Clock className={`w-5 h-5 ${isLapRunning ? 'text-violet-400 animate-spin' : 'text-sky-400'}`} />
                  <span className="font-bold text-sm tracking-wide">
                    {isLogAberto ? 'Ocultar Desempenho' : 'Desempenho da Corrida'}
                  </span>
                </>
              ) : (
                <>
                  <ShieldAlert className={`w-5 h-5 ${historicoErros.length > 0 && !isLogAberto ? 'text-red-400 animate-pulse' : 'text-sky-400'}`} />
                  <span className="font-bold text-sm tracking-wide">
                    {isLogAberto ? 'Ocultar Logs' : 'Logs de Interrupção'}
                  </span>
                  {!isLogAberto && historicoErros.length > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                      {historicoErros.length}
                    </span>
                  )}
                </>
              )}
            </button>

            {/* Gaveta de Conteúdo Expansível */}
            <div 
              className={`pointer-events-auto bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-800/80 flex flex-col transition-all duration-500 ease-out origin-top-right ${isLogAberto ? 'w-80 opacity-100 scale-100 max-h-full' : 'w-80 opacity-0 scale-95 max-h-0'}`}
            >
              {/* Cabeçalho da Gaveta */}
              <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between rounded-t-2xl">
                <span className="font-bold text-slate-300 text-xs uppercase tracking-wider">
                  {isFastRun ? 'Desempenho de Corrida' : 'Histórico Crítico'}
                </span>
                <span className="bg-slate-800 text-sky-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {isFastRun ? `${historicoVoltas.length} VOLTAS` : `${historicoErros.length} EVENTOS`}
                </span>
              </div>
              
              {/* Corpo da Gaveta */}
              <div className="overflow-y-auto p-4 flex flex-col gap-3 max-h-[50vh] scrollbar-thin scrollbar-thumb-slate-700">
                {isFastRun ? (
                  <div className="flex flex-col gap-4 text-left">
                    {/* Lista de Voltas */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Histórico de Voltas</span>
                      {historicoVoltas.length === 0 ? (
                        <div className="py-4 text-center opacity-60 flex flex-col items-center gap-1">
                          <Clock className="w-6 h-6 text-slate-500 animate-pulse" />
                          <p className="text-xs text-slate-400 font-medium mt-1">Primeira volta em andamento...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {historicoVoltas.map((volta, idx) => (
                            <div key={idx} className="p-2.5 bg-slate-950/40 border border-slate-800 rounded-xl flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-300">Volta {idx + 1}</span>
                              <span className="font-mono text-sm text-sky-400 font-semibold">{volta.toFixed(2)}s</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Detalhes da Rota Otimizada */}
                    <div className="flex flex-col gap-2 mt-2">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Trajeto Rápido Otimizado</span>
                      <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Comprimento:</span>
                          <span className="font-bold text-slate-200">6 células</span>
                        </div>
                        <div className="flex flex-col gap-1 text-[11px] font-mono text-slate-400 mt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span>Início: (0, 7)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Ponto 1: (0, 5)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Ponto 2: (2, 5)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span>Centro: (2, 4)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  historicoErros.length === 0 ? (
                    <div className="py-8 text-center flex flex-col items-center gap-2 opacity-60">
                      <ShieldAlert className="w-8 h-8 text-slate-500" />
                      <p className="text-sm text-slate-400 font-medium">Nenhum evento crítico registrado.</p>
                    </div>
                  ) : (
                    historicoErros.map((erro) => (
                      <div key={erro.id} className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl flex flex-col gap-1.5 animate-in slide-in-from-right-2 shadow-sm text-left">
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
                  )
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}