import React, { useState, useEffect, useRef } from "react";
import {
  BatteryFull, BatteryMedium, BatteryLow,
  Gauge, Clock, Target, MapPin, Wifi, AlertTriangle, ShieldAlert, Trophy, Zap
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
  erro_pid?: number;
  pwm_esq?: number;
  pwm_dir?: number;
  velocidade_media?: number;
}

export interface RegistoErro {
  id: string;
  timestamp: number;
  causa: string;
  posicao_x: number;
  posicao_y: number;
}

const FLUXO_MOCK_TELEMETRIA: DadosTelemetria[] = [
  // FASE DE CALIBRAÇÃO (Bateria boa)
  { timestamp: 1715456780, estado_fsm: "CALIBRATING", bateria_v: 7.42, posicao_x: 0, posicao_y: 7, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: true, leste: true, oeste: true }, erro_pid: 0 },

  // FASE DE MAPEAMENTO (Bateria decaindo, mapeando células)
  { timestamp: 1715456781, estado_fsm: "MAPPING", bateria_v: 7.38, posicao_x: 0, posicao_y: 6, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: false, leste: true, oeste: true }, erro_pid: 0.02 },
  { timestamp: 1715456782, estado_fsm: "MAPPING", bateria_v: 7.33, posicao_x: 0, posicao_y: 5, orientacao: "LESTE", tamanho_grade: 8, paredes_atuais: { norte: true, sul: false, leste: false, oeste: true }, erro_pid: -0.01 },
  { timestamp: 1715456783, estado_fsm: "MAPPING", bateria_v: 7.28, posicao_x: 1, posicao_y: 5, orientacao: "LESTE", tamanho_grade: 8, paredes_atuais: { norte: true, sul: true, leste: false, oeste: false }, erro_pid: 0.04 },
  { timestamp: 1715456784, estado_fsm: "MAPPING", bateria_v: 7.21, posicao_x: 2, posicao_y: 5, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: true, leste: true, oeste: false }, erro_pid: 0.01 },
  { timestamp: 1715456785, estado_fsm: "MAPPING", bateria_v: 7.15, posicao_x: 2, posicao_y: 4, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: false, leste: true, oeste: true }, erro_pid: -0.02 },

  // ALERTA DE BATERIA CRÍTICA DURANTE MAPEAMENTO (< 6.8V)
  { timestamp: 1715456786, estado_fsm: "MAPPING", bateria_v: 6.78, posicao_x: 2, posicao_y: 3, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: false, leste: true, oeste: true }, erro_pid: 0.03 },
  { timestamp: 1715456787, estado_fsm: "MAPPING", bateria_v: 6.72, posicao_x: 3, posicao_y: 3, orientacao: "LESTE", tamanho_grade: 8, paredes_atuais: { norte: true, sul: true, leste: false, oeste: false }, erro_pid: 0.01 },
  { timestamp: 1715456788, estado_fsm: "MAPPING", bateria_v: 6.65, posicao_x: 4, posicao_y: 3, orientacao: "LESTE", tamanho_grade: 8, paredes_atuais: { norte: true, sul: false, leste: false, oeste: false }, erro_pid: -0.04 },

  // META ALCANÇADA
  { timestamp: 1715456789, estado_fsm: "GOAL_REACHED", bateria_v: 7.30, posicao_x: 5, posicao_y: 3, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: true, leste: true, oeste: false }, erro_pid: 0 },

  // FASE DE ALTA PERFORMANCE (FAST_RUN)
  { timestamp: 1715456790, estado_fsm: "FAST_RUN", bateria_v: 7.30, posicao_x: 0, posicao_y: 7, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: true, leste: true, oeste: true }, erro_pid: 0.01, velocidade_media: 1.62, pwm_esq: 210, pwm_dir: 212 },
  { timestamp: 1715456791, estado_fsm: "FAST_RUN", bateria_v: 7.28, posicao_x: 0, posicao_y: 6, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: false, leste: true, oeste: true }, erro_pid: 0.02, velocidade_media: 1.65, pwm_esq: 212, pwm_dir: 214 },
  { timestamp: 1715456792, estado_fsm: "FAST_RUN", bateria_v: 7.25, posicao_x: 0, posicao_y: 5, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: true, sul: false, leste: false, oeste: true }, erro_pid: -0.01, velocidade_media: 1.70, pwm_esq: 220, pwm_dir: 218 },
  { timestamp: 1715456793, estado_fsm: "FAST_RUN", bateria_v: 7.22, posicao_x: 1, posicao_y: 5, orientacao: "LESTE", tamanho_grade: 8, paredes_atuais: { norte: true, sul: true, leste: false, oeste: false }, erro_pid: 0.03, velocidade_media: 1.75, pwm_esq: 224, pwm_dir: 224 },
  { timestamp: 1715456794, estado_fsm: "FAST_RUN", bateria_v: 7.18, posicao_x: 2, posicao_y: 5, orientacao: "LESTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: true, leste: true, oeste: false }, erro_pid: -0.02, velocidade_media: 1.80, pwm_esq: 230, pwm_dir: 228 },
  { timestamp: 1715456795, estado_fsm: "FAST_RUN", bateria_v: 7.15, posicao_x: 2, posicao_y: 4, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: false, leste: true, oeste: true }, erro_pid: 0.01, velocidade_media: 1.82, pwm_esq: 232, pwm_dir: 234 },
  { timestamp: 1715456796, estado_fsm: "FAST_RUN", bateria_v: 7.11, posicao_x: 2, posicao_y: 3, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: false, leste: true, oeste: true }, erro_pid: 0.02, velocidade_media: 1.85, pwm_esq: 235, pwm_dir: 235 },
  { timestamp: 1715456797, estado_fsm: "FAST_RUN", bateria_v: 7.08, posicao_x: 3, posicao_y: 3, orientacao: "LESTE", tamanho_grade: 8, paredes_atuais: { norte: true, sul: true, leste: false, oeste: false }, erro_pid: -0.01, velocidade_media: 1.88, pwm_esq: 238, pwm_dir: 236 },
  { timestamp: 1715456798, estado_fsm: "FAST_RUN", bateria_v: 7.04, posicao_x: 4, posicao_y: 3, orientacao: "LESTE", tamanho_grade: 8, paredes_atuais: { norte: true, sul: false, leste: false, oeste: false }, erro_pid: 0.03, velocidade_media: 1.90, pwm_esq: 240, pwm_dir: 242 },

  // META DE CORRIDA ATINGIDA
  { timestamp: 1715456799, estado_fsm: "GOAL_REACHED", bateria_v: 7.01, posicao_x: 5, posicao_y: 3, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: true, leste: true, oeste: false }, erro_pid: 0, velocidade_media: 0 },

  // ERRO DE CORRENTE APÓS CHEGADA (Para demonstrar tela de erro)
  { timestamp: 1715456800, estado_fsm: "ERROR", bateria_v: 6.95, posicao_x: 5, posicao_y: 3, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: true, leste: true, oeste: false }, erro_pid: 0, causa_erro: "Tração bloqueada: Pico de corrente no motor esquerdo (>2A)." },
  { timestamp: 1715456801, estado_fsm: "ERROR", bateria_v: 6.95, posicao_x: 5, posicao_y: 3, orientacao: "NORTE", tamanho_grade: 8, paredes_atuais: { norte: false, sul: true, leste: true, oeste: false }, erro_pid: 0, causa_erro: "Tração bloqueada: Pico de corrente no motor esquerdo (>2A)." }
];

interface PropriedadesCartao {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: React.ReactNode;
  iconBg?: string;
  highlight?: boolean;
  critical?: boolean;
  progressPercent?: number;
}

function CartaoEstatistica({ label, value, sub, icon, highlight, critical, progressPercent }: PropriedadesCartao) {
  const textLength = typeof value === 'string' ? value.length : 0;
  const valueSizeClass = textLength > 12 
    ? "text-lg md:text-xl" 
    : textLength > 8 
      ? "text-xl md:text-2xl" 
      : "text-2xl md:text-3xl";

  return (
    <div
      style={critical ? { animation: "blink-critical-card 1.2s infinite alternate" } : undefined}
      className={`rounded-2xl border shadow-sm flex flex-col justify-between p-5 min-h-[145px] transition-all bg-white ${critical
          ? "border-red-500 text-white shadow-red-100"
          : highlight
            ? "border-blue-400 shadow-blue-100"
            : "border-slate-100"
        }`}
    >
      <div className="flex items-center gap-1.5 pb-2">
        <span className={`uppercase tracking-wider text-[0.68rem] font-black ${critical ? "text-red-200" : "text-slate-400"}`}>
          {label}
        </span>
        <span className="shrink-0">
          {icon}
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center my-1">
        <div className={`tabular-nums font-black tracking-tight ${valueSizeClass} ${critical ? "text-white" : "text-slate-800"}`}>
          {value}
        </div>
        {sub && <p className={`mt-0.5 text-xs font-semibold ${critical ? "text-red-200" : "text-slate-400"}`}>{sub}</p>}
      </div>

      {progressPercent !== undefined && (
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              critical
                ? "bg-red-400"
                : progressPercent < 30
                  ? "bg-red-500"
                  : progressPercent < 70
                    ? "bg-amber-500"
                    : "bg-emerald-500"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function Dashboard() {
  const [indiceAtual, setIndiceAtual] = useState(0);

  // Estados de Telemetria Dinâmicos
  const [celulasExploradas, setCelulasExploradas] = useState<Record<string, CelulaMapa>>({});
  const [historicoErros, setHistoricoErros] = useState<RegistoErro[]>([]);
  const [isLogAberto, setIsLogAberto] = useState(false);

  // Estados do Cronômetro & Trajeto Rápido
  const [tempoVoltaAtual, setTempoVoltaAtual] = useState(0);
  const [melhorTempo, setMelhorTempo] = useState<number | null>(null);
  const [trajetoRapido, setTrajetoRapido] = useState<Array<{ x: number, y: number }>>([]);
  const tempoInicialRef = useRef<number | null>(null);

  // Determinar qual telemetria usar
  const telemetriaAtual: DadosTelemetria = FLUXO_MOCK_TELEMETRIA[indiceAtual];

  // Limiar de Segurança para a Bateria
  const LIMIAR_BATERIA_SEGURANCA = 6.8;
  const bateriaCritica = telemetriaAtual.bateria_v < LIMIAR_BATERIA_SEGURANCA;
  const possuiErroCritico = telemetriaAtual.estado_fsm === 'ERROR';
  const isFastRun = telemetriaAtual.estado_fsm === 'FAST_RUN';

  // Loop de Simulação Automática
  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceAtual((ant) => {
        const proximo = ant < FLUXO_MOCK_TELEMETRIA.length - 1 ? ant + 1 : 0;
        const novaTelemetria = FLUXO_MOCK_TELEMETRIA[proximo];

        if (proximo === 0) {
          setCelulasExploradas({});
          setHistoricoErros([]);
          setIsLogAberto(false);
          setTrajetoRapido([]);
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

  // Efeito do Cronômetro de Corrida de Alta Performance (FAST_RUN)
  useEffect(() => {
    let animationFrameId: number;

    if (isFastRun) {
      if (tempoInicialRef.current === null) {
        tempoInicialRef.current = Date.now() - tempoVoltaAtual;
      }

      const tick = () => {
        if (tempoInicialRef.current !== null) {
          setTempoVoltaAtual(Date.now() - tempoInicialRef.current);
        }
        animationFrameId = requestAnimationFrame(tick);
      };

      animationFrameId = requestAnimationFrame(tick);
    } else {
      if (tempoInicialRef.current !== null) {
        // Registra melhor tempo se a corrida terminar com sucesso
        const tempoFinal = Date.now() - tempoInicialRef.current;
        if (tempoFinal > 500) {
          setMelhorTempo(prev => (prev === null || tempoFinal < prev) ? tempoFinal : prev);
        }
        tempoInicialRef.current = null;
      }
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isFastRun]);

  // Reset do cronômetro da volta se iniciar uma nova corrida
  useEffect(() => {
    if (!isFastRun) {
      setTempoVoltaAtual(0);
    }
  }, [isFastRun]);

  // Efeito para Rastrear Trajeto Rápido
  useEffect(() => {
    if (isFastRun) {
      setTrajetoRapido(prev => {
        const ultimo = prev[prev.length - 1];
        if (!ultimo || ultimo.x !== telemetriaAtual.posicao_x || ultimo.y !== telemetriaAtual.posicao_y) {
          return [...prev, { x: telemetriaAtual.posicao_x, y: telemetriaAtual.posicao_y }];
        }
        return prev;
      });
    } else {
      setTrajetoRapido([]);
    }
  }, [isFastRun, telemetriaAtual.posicao_x, telemetriaAtual.posicao_y]);

  const pctBateria = Math.max(0, Math.min(100, Math.round(((telemetriaAtual.bateria_v - 6.8) / (8.4 - 6.8)) * 100)));
  const qtdExploradas = Object.keys(celulasExploradas).length;
  const totalCelulas = telemetriaAtual.tamanho_grade * telemetriaAtual.tamanho_grade;
  const percentual = Math.round((qtdExploradas / totalCelulas) * 100) || 0;

  const obterCorBateria = (tensao: number) => {
    if (tensao > 7.2) return { icone: BatteryFull, corTexto: "text-emerald-500", corFundo: "bg-emerald-50" };
    if (tensao > 6.8) return { icone: BatteryMedium, corTexto: "text-amber-500", corFundo: "bg-amber-50" };
    return { icone: BatteryLow, corTexto: "text-red-500", corFundo: "bg-red-50" };
  };
  const estiloBateria = obterCorBateria(telemetriaAtual.bateria_v);

  const formatarTempo = (ms: number) => {
    const minutos = Math.floor(ms / 60000);
    const segundos = Math.floor((ms % 60000) / 1000);
    const centesimos = Math.floor((ms % 1000) / 10);
    return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}.${centesimos.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC] font-sans relative overflow-hidden">

      {/* Estilos inline para keyframe animado das notificações críticas e bordas */}
      <style>{`
        @keyframes blink-critical-banner {
          0%, 100% { background-color: #dc2626; box-shadow: 0 4px 20px rgba(220, 38, 38, 0.4); }
          50% { background-color: #991b1b; box-shadow: 0 4px 6px rgba(153, 27, 27, 0.2); }
        }
        @keyframes blink-critical-card {
          0%, 100% { background-color: #dc2626; border-color: #f87171; box-shadow: 0 0 15px rgba(220, 38, 38, 0.4); }
          50% { background-color: #7f1d1d; border-color: #dc2626; box-shadow: 0 0 5px rgba(127, 29, 29, 0.1); }
        }
      `}</style>

      {/* Banner de Erro de Hardware */}
      <div className={`absolute top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out ${possuiErroCritico ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="bg-red-600 text-white px-8 py-3 flex items-center justify-center gap-4 shadow-xl shadow-red-600/30">
          <AlertTriangle className="w-7 h-7 animate-pulse" />
          <span className="font-bold text-lg tracking-wider uppercase">
            Alarme Crítico de Hardware: <span className="font-medium text-red-100">{telemetriaAtual.causa_erro}</span>
          </span>
        </div>
      </div>

      {/* Banner de Bateria Baixa/Crítica Intermitente */}
      <div
        style={bateriaCritica ? { animation: "blink-critical-banner 1s infinite" } : undefined}
        className={`absolute left-0 w-full z-45 transition-all duration-500 ease-in-out ${bateriaCritica && !possuiErroCritico ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
      >
        <div className="text-white px-8 py-3 flex items-center justify-center gap-4 shadow-xl">
          <Zap className="w-6 h-6 animate-bounce" />
          <span className="font-extrabold text-sm tracking-wider uppercase flex items-center gap-2">
            Alerta Crítico de Energia: <span className="font-medium">Tensão sob limite de segurança ({telemetriaAtual.bateria_v.toFixed(2)}V). Risco de desligamento abrupto!</span>
          </span>
        </div>
      </div>

      {/* Ajusta margem superior se houver notificações ativas */}
      <div className={`px-8 py-5 flex items-center justify-between shrink-0 bg-white border-b border-slate-200 shadow-sm z-10 transition-all duration-300 ${possuiErroCritico || bateriaCritica ? 'mt-12' : 'mt-0'}`}>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard</h1>
            <div className="flex items-center gap-1.5 bg-[#ECFDF5] border border-[#10B981]/25 text-[#10B981] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center shrink-0">
              <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse" />
              AO VIVO
            </div>
          </div>
          <p className="text-slate-400 font-medium text-xs mt-1">
            Telemetria ao vivo · {telemetriaAtual.tamanho_grade}x{telemetriaAtual.tamanho_grade} · {qtdExploradas}/{totalCelulas} células ({percentual}%)
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <Wifi className={`w-3.5 h-3.5 animate-pulse ${possuiErroCritico ? 'text-red-500' : 'text-emerald-400'}`} />
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Último Pacote:</span>
            <span className="font-mono text-sm text-slate-500 font-medium">{telemetriaAtual.timestamp}</span>
          </div>
        </div>
      </div>

      {/* Grid de Cartões Estatísticos adaptável */}
      <div className="px-8 pt-6 pb-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 shrink-0">
        <CartaoEstatistica
          label="Bateria"
          value={`${telemetriaAtual.bateria_v.toFixed(1)}V`}
          sub={bateriaCritica ? "TENSÃO CRÍTICA!" : `${pctBateria}% de carga`}
          iconBg={estiloBateria.corFundo}
          icon={<estiloBateria.icone className={`w-3.5 h-3.5 ${bateriaCritica ? "text-red-100 animate-pulse" : estiloBateria.corTexto}`} strokeWidth={2} />}
          critical={bateriaCritica}
          progressPercent={pctBateria}
        />

        <CartaoEstatistica
          label="Velocidade"
          value={isFastRun && telemetriaAtual.velocidade_media ? telemetriaAtual.velocidade_media.toFixed(3) : "0.238"}
          sub="m/s · velocidade atual"
          iconBg="bg-blue-50"
          icon={<Gauge className="w-3.5 h-3.5 text-blue-500" strokeWidth={2} />}
        />

        <CartaoEstatistica
          label="Cronômetro"
          value={isFastRun ? formatarTempo(tempoVoltaAtual) : "- - : - - . - -"}
          sub={isFastRun ? "tempo de volta ativo" : "aguardando largada"}
          iconBg="bg-violet-50"
          icon={<Clock className={`w-3.5 h-3.5 text-violet-500 ${isFastRun ? 'animate-spin' : ''}`} strokeWidth={2} />}
        />

        <CartaoEstatistica
          label="Objetivo"
          value={isFastRun ? "Alta Performance" : "Explorando"}
          sub={isFastRun ? "Corrida rápida" : "Mapeando labirinto"}
          iconBg="bg-slate-100"
          icon={isFastRun ? <Trophy className="w-3.5 h-3.5 text-amber-500" /> : <Target className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />}
        />
      </div>

      <div className="flex-1 px-8 pb-8 flex gap-6 min-h-0 relative">

        {/* Lado Esquerdo: Mapa em Tempo Real */}
        <div className={`flex-1 rounded-2xl overflow-hidden border shadow-2xl relative flex flex-col transition-colors duration-500 ${possuiErroCritico
            ? 'border-red-500/50 shadow-red-500/20 bg-[#1A0B0B]'
            : isFastRun
              ? 'border-cyan-500/40 shadow-cyan-950/20 bg-[#070b14]'
              : 'border-slate-800 bg-[#0B1120]'
          }`}>
          <RobotMap
            telemetria={telemetriaAtual}
            celulasExploradas={celulasExploradas}
            trajetoRapido={trajetoRapido}
          />

          {/* FSM state badge overlay matching mockup */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <div className="bg-[#0f172a]/95 border border-slate-800/80 backdrop-blur-sm px-4 py-1.5 rounded-full flex items-center gap-2 shadow-xl">
              <span className={`w-2 h-2 rounded-full ${possuiErroCritico
                  ? "bg-red-500 animate-pulse"
                  : isFastRun
                    ? "bg-cyan-400 animate-ping"
                    : "bg-emerald-500"
                }`} />
              <span className="text-xs font-bold text-slate-200 tracking-wide">
                {telemetriaAtual.estado_fsm === 'CALIBRATING' && "Calibrando"}
                {telemetriaAtual.estado_fsm === 'MAPPING' && "Explorando"}
                {telemetriaAtual.estado_fsm === 'GOAL_REACHED' && "Meta Alcançada"}
                {telemetriaAtual.estado_fsm === 'FAST_RUN' && "Alta Performance"}
                {telemetriaAtual.estado_fsm === 'ERROR' && "Falha de Hardware"}
              </span>
            </div>
          </div>

          {/* Botão de logs flutuante, visível apenas fora do modo de alta performance */}
          {!isFastRun && (
            <div className="absolute bottom-6 right-6 z-30 flex flex-col items-end gap-3 pointer-events-none">

              {/* Botão de Controlo (Alternar) */}
              <button
                onClick={() => setIsLogAberto(!isLogAberto)}
                className="pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-full shadow-xl border bg-slate-900/95 backdrop-blur-sm border-slate-800 text-slate-200 hover:bg-slate-850 transition-all duration-300"
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

            </div>
          )}
        </div>

        {/* Lado Direito: Painel de Performance (FAST_RUN) ou Gaveta de Logs (Outros modos) */}
        {isFastRun ? (
          <div className="w-96 shrink-0 bg-white border border-slate-200 shadow-lg rounded-2xl p-5 flex flex-col gap-5 text-slate-800 animate-in fade-in slide-in-from-right-5 duration-355">
            {/* Cabeçalho de Alta Performance */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="font-extrabold text-[10px] uppercase tracking-widest text-blue-600">MODO ALTA PERFORMANCE</span>
              </div>
              <span className="text-[9px] bg-blue-50 text-blue-600 font-bold px-2.5 py-0.5 rounded-full border border-blue-100">FAST_RUN</span>
            </div>

            {/* Cronômetro Principal da Volta */}
            <div className="bg-blue-50/50 border border-blue-100/80 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 shadow-sm">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Tempo da Volta Atual</span>
              <span className="font-mono text-4xl font-extrabold tracking-wider text-blue-600">
                {formatarTempo(tempoVoltaAtual)}
              </span>
            </div>

            {/* Sub-estatísticas de Tempo */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-1">
                <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Recorde da Corrida</span>
                <span className="font-mono text-base font-bold text-emerald-600 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  {melhorTempo ? formatarTempo(melhorTempo) : "--:--.--"}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-1">
                <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Velocidade Corrida</span>
                <span className="font-mono text-base font-bold text-blue-600">
                  {telemetriaAtual.velocidade_media ? `${telemetriaAtual.velocidade_media.toFixed(2)} m/s` : "1.84 m/s"}
                </span>
              </div>
            </div>

            {/* Seção Principal de Métricas do Motor & PID */}
            <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-y-auto pr-1">
              <div>
                <span className="text-slate-500 text-[10px] font-extrabold uppercase tracking-wider block mb-2">Tração dos Motores</span>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-3">
                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-1 font-medium">
                      <span className="text-slate-500">PWM Motor Esquerdo</span>
                      <span className="font-mono text-slate-700">{telemetriaAtual.pwm_esq !== undefined ? telemetriaAtual.pwm_esq : 210} / 255</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${((telemetriaAtual.pwm_esq || 210) / 255) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-1 font-medium">
                      <span className="text-slate-500">PWM Motor Direito</span>
                      <span className="font-mono text-slate-700">{telemetriaAtual.pwm_dir !== undefined ? telemetriaAtual.pwm_dir : 212} / 255</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${((telemetriaAtual.pwm_dir || 212) / 255) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] font-extrabold uppercase tracking-wider block mb-2">Controle de Alinhamento (PID)</span>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-2.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Erro Lateral instantâneo</span>
                    <span className={`font-mono font-bold ${Math.abs(telemetriaAtual.erro_pid || 0) < 0.03 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {telemetriaAtual.erro_pid !== undefined ? (telemetriaAtual.erro_pid > 0 ? `+${telemetriaAtual.erro_pid.toFixed(3)}` : telemetriaAtual.erro_pid.toFixed(3)) : "0.000"}
                    </span>
                  </div>

                  {/* Régua de erro visual */}
                  <div className="relative w-full h-2.5 bg-slate-200 rounded-full flex items-center justify-center">
                    <div className="absolute w-0.5 h-3.5 bg-slate-400 left-1/2 -translate-x-1/2" />
                    <div
                      className="absolute h-full w-2.5 rounded-full bg-blue-600 shadow-sm transition-all duration-300"
                      style={{
                        left: `calc(50% + ${(telemetriaAtual.erro_pid || 0) * 100}%)`,
                        transform: 'translateX(-50%)'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Painel do Fim da Corrida */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between text-xs shrink-0">
              <span className="text-slate-500 font-medium">Posição do Robô:</span>
              <span className="font-mono font-bold text-blue-600">({telemetriaAtual.posicao_x}, {telemetriaAtual.posicao_y})</span>
            </div>
          </div>
        ) : (
          isLogAberto && (
            <div className="w-96 shrink-0 bg-white border border-slate-200 rounded-2xl flex flex-col shadow-lg text-slate-800 animate-in fade-in slide-in-from-right-5 duration-300">
              {/* Cabeçalho da Gaveta de Logs */}
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between rounded-t-2xl">
                <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">Histórico Crítico</span>
                <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-slate-300">
                  {historicoErros.length} EVENTOS
                </span>
              </div>

              {/* Corpo da Gaveta de Logs */}
              <div className="overflow-y-auto p-4 flex flex-col gap-3 flex-1 scrollbar-thin scrollbar-thumb-slate-200">
                {historicoErros.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center gap-3 opacity-60">
                    <ShieldAlert className="w-8 h-8 text-slate-400 animate-pulse" />
                    <p className="text-sm text-slate-500 font-medium font-sans">Nenhum evento crítico registado.</p>
                  </div>
                ) : (
                  historicoErros.map((erro) => (
                    <div key={erro.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-1.5 animate-in slide-in-from-right-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Falha de Hardware</span>
                        <span className="text-[10px] font-mono text-slate-400">{erro.timestamp}</span>
                      </div>
                      <p className="text-sm text-slate-700 font-medium leading-snug">
                        {erro.causa}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-blue-600/90 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        Ocorrência na célula: ({erro.posicao_x}, {erro.posicao_y})
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        )}

      </div>
    </div>
  );
}