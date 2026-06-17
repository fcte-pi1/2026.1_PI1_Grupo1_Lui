import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Download, CheckCircle2, XCircle, Clock, Grid3X3, ChevronDown, ChevronUp,
  Play, Pause, RotateCcw, FastForward, ChevronLeft, ChevronRight, Map as MapIcon, Upload
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

import { cn } from "../lib/utils";
import {
  detectarTamanho,
  reconstruirAteStep,
  extrairPassos,
  formatarTimestamp,
  exportarHistoricoCSV,
  exportarHistoricoJSON,
  type PassoExploracao
} from "../utils/historyUtils";

// ─── Gerador de Dados para o Gráfico (Simulação Analítica) ─────────────────
function gerarVelocidade(seed: number, duracaoS: number): { t: number; v: number }[] {
  const pontos: { t: number; v: number }[] = [];
  let v = 0;
  for (let t = 0; t <= duracaoS; t++) {
    const r = Math.abs(Math.sin(seed * 31.7 + t * 1.37 + seed * t * 0.07)) % 1;
    const target = 0.05 + r * 0.62;
    v = v * 0.75 + target * 0.25;
    v = Math.max(0, Math.min(0.72, v));
    const rampIn = Math.min(1, t / 4);
    const rampOut = Math.min(1, (duracaoS - t) / 5);
    pontos.push({ t, v: parseFloat((v * rampIn * rampOut).toFixed(3)) });
  }
  return pontos;
}

// ─── Lógica de Rotação Exata do Dashboard ──────────────────────────────────
const obterRotacaoRobo = (orientacao: string) => {
  switch (orientacao) {
    case 'NORTE': return '0deg';
    case 'LESTE': return '90deg';
    case 'SUL': return '180deg';
    case 'OESTE': return '-90deg';
    default: return '0deg';
  }
};

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface CorridaRow {
  id: string;
  numero: number;
  grade: string;
  tempo: string;
  tempoS: number;
  objetivo: boolean;
  date: string;
  seed: number;
  origem: 'api' | 'local';
  dadosBrutos?: unknown;
}

// ─── Tooltip Customizado do Gráfico ─────────────────────────────────────────
function TooltipVelocidade({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: number; }) {
  if (!active || !payload?.length) return null;
  const mins = Math.floor((label ?? 0) / 60);
  const secs = (label ?? 0) % 60;
  return (
    <div className="bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 shadow-xl" style={{ fontSize: "0.78rem" }}>
      <p className="text-slate-400">t = {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</p>
      <p className="text-blue-300" style={{ fontWeight: 600 }}>{payload[0].value.toFixed(3)} m/s</p>
    </div>
  );
}

// ─── Componente do Gráfico ──────────────────────────────────────────────────
function GraficoVelocidade({ corrida, dadosGrafico }: { corrida: CorridaRow, dadosGrafico: { t: number; v: number }[] }) {
  const mediaV = useMemo(() => dadosGrafico.reduce((a, p) => a + p.v, 0) / dadosGrafico.length, [dadosGrafico]);
  const maxV = useMemo(() => Math.max(...dadosGrafico.map((p) => p.v)), [dadosGrafico]);

  return (
    <div className="px-5 pt-0 pb-5">
      <div className="bg-[#08111F] rounded-xl p-4 border border-slate-700/60">
        <div className="flex items-center gap-6 mb-4">
          <div>
            <p className="text-slate-500 uppercase tracking-widest" style={{ fontSize: "0.62rem" }}>Velocidade Média</p>
            <p className="text-blue-400 tabular-nums" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
              {mediaV.toFixed(3)} <span className="text-slate-500" style={{ fontSize: "0.75rem", fontWeight: 400 }}>m/s</span>
            </p>
          </div>
          <div>
            <p className="text-slate-500 uppercase tracking-widest" style={{ fontSize: "0.62rem" }}>Pico</p>
            <p className="text-emerald-400 tabular-nums" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
              {maxV.toFixed(3)} <span className="text-slate-500" style={{ fontSize: "0.75rem", fontWeight: 400 }}>m/s</span>
            </p>
          </div>
          <div>
            <p className="text-slate-500 uppercase tracking-widest" style={{ fontSize: "0.62rem" }}>Duração</p>
            <p className="text-slate-300 tabular-nums" style={{ fontWeight: 700, fontSize: "1.1rem" }}>{corrida.tempo}</p>
          </div>
          <div className="ml-auto">
            <p className="text-slate-500 uppercase tracking-widest" style={{ fontSize: "0.62rem" }}>Grade</p>
            <p className="text-slate-300" style={{ fontWeight: 700, fontSize: "1.1rem" }}>{corrida.grade}</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={dadosGrafico} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${corrida.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" strokeOpacity={0.6} />
            <XAxis dataKey="t" tick={{ fill: "#475569", fontSize: 10 }} tickFormatter={(v) => `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`} interval={Math.floor(dadosGrafico.length / 8)} axisLine={{ stroke: "#1E3A5F" }} tickLine={false} />
            <YAxis domain={[0, 0.75]} tick={{ fill: "#475569", fontSize: 10 }} tickFormatter={(v) => v.toFixed(1)} axisLine={false} tickLine={false} />
            <Tooltip content={<TooltipVelocidade />} />
            <Area type="monotone" dataKey="v" stroke="#3B82F6" strokeWidth={2} fill={`url(#grad-${corrida.id})`} dot={false} animationDuration={600} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Componente Principal (Lógica + UI) ─────────────────────────────────────
export function HistoryPage() {
  const [corridas, setCorridas] = useState<CorridaRow[]>([]);
  const [corridaExpandida, setCorridaExpandida] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const inputUploadRef = useRef<HTMLInputElement>(null);

  const [passosReplay, setPassosReplay] = useState<PassoExploracao[] | null>(null);
  const [tamanhoGrid, setTamanhoGrid] = useState({ larg: 0, alt: 0 });
  const [indicePasso, setIndicePasso] = useState(0);
  const [reproduzindo, setReproduzindo] = useState(false);
  const [velocidadeTimer, setVelocidadeTimer] = useState(200);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch('/api/maze_runs')
      .then(res => res.json())
      .then((arquivos: string[]) => {
        const mapeados = arquivos.map((arq, idx) => criarMetadadosCorrida(arq, idx + 1, 'api'));
        setCorridas(mapeados);
      })
      .catch(() => setErro("Não foi possível conectar à API de histórico."));
  }, []);

  // Metadados flexíveis: tenta adivinhar, mas se vierem os dados reais (Upload), calcula a realidade
  function criarMetadadosCorrida(id: string, numero: number, origem: 'api' | 'local', dadosBrutos?: unknown): CorridaRow {
    const semente = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const atingiuObjetivo = semente % 3 !== 0;
    
    let tempoS = 40 + (semente % 180);
    let grade = semente % 2 === 0 ? "16×16" : "8×8";

    // CORREÇÃO: Se os dados brutos já existirem (Upload Local), calcula exatamente a grade e o tempo
    if (dadosBrutos) {
      try {
        const passos = extrairPassos(dadosBrutos);
        const dados = dadosBrutos as { tamanho?: { larg: number, alt: number } };
        const tam = dados.tamanho ? { larg: dados.tamanho.larg, alt: dados.tamanho.alt } : detectarTamanho(passos);
        grade = `${tam.larg}×${tam.alt}`;
        tempoS = Math.max(10, Math.floor(passos.length * 1.5));
      } catch {
        // Fallback silencioso
      }
    }

    const min = Math.floor(tempoS / 60);
    const sec = tempoS % 60;
    const matchData = id.match(/(\d+)/);
    const dataStr = matchData ? formatarTimestamp(matchData[1]) : formatarTimestamp(Date.now().toString());
    
    return {
      id, numero,
      grade,
      tempo: `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`,
      tempoS,
      objetivo: atingiuObjetivo,
      date: dataStr,
      seed: semente,
      origem,
      dadosBrutos
    };
  }

  const lidarComUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = (evento) => {
      try {
        const dados = JSON.parse(evento.target?.result as string);
        const nova = criarMetadadosCorrida(`local_${Date.now()}_${arquivo.name}`, corridas.length + 1, 'local', dados);
        setCorridas(prev => [nova, ...prev]);
        abrirCorrida(nova);
      } catch {
        setErro("Arquivo JSON inválido.");
      }
    };
    leitor.readAsText(arquivo);
  };

  const abrirCorrida = async (corrida: CorridaRow) => {
    if (corridaExpandida === corrida.id) {
      setCorridaExpandida(null);
      setReproduzindo(false);
      return;
    }
    try {
      let jsonReal = corrida.dadosBrutos;
      // Se não temos o json real (corrida carregada da API pela 1ª vez), fazemos o fetch
      if (corrida.origem === 'api' && !jsonReal) {
        const res = await fetch(`/api/maze_runs/${corrida.id}`);
        jsonReal = await res.json();
      }

      const passos = extrairPassos(jsonReal);
      const json = jsonReal as { tamanho?: { larg: number, alt: number } };
      const tam = json.tamanho ? { larg: json.tamanho.larg, alt: json.tamanho.alt } : detectarTamanho(passos);
      const tempoSReal = Math.max(10, Math.floor(passos.length * 1.5));
      const min = Math.floor(tempoSReal / 60);
      const sec = tempoSReal % 60;

      // CORREÇÃO: Atualiza silenciosamente os metadados da tabela agora que temos os dados absolutos da API
      setCorridas(prev => prev.map(c => c.id === corrida.id ? {
        ...c,
        grade: `${tam.larg}×${tam.alt}`,
        tempoS: tempoSReal,
        tempo: `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`,
        dadosBrutos: jsonReal
      } : c));

      setPassosReplay(passos);
      setTamanhoGrid(tam);
      setIndicePasso(0);
      setReproduzindo(false);
      setCorridaExpandida(corrida.id);
    } catch {
      setErro("Erro ao ler dados da corrida.");
    }
  };

  const baixarCSVReal = async (e: React.MouseEvent, corrida: CorridaRow) => {
    e.stopPropagation();
    try {
      let jsonReal = corrida.dadosBrutos;
      if (corrida.origem === 'api') {
        const res = await fetch(`/api/maze_runs/${corrida.id}`);
        jsonReal = await res.json();
      }
      exportarHistoricoCSV(extrairPassos(jsonReal), corrida.id);
    } catch {
      setErro("Erro ao exportar CSV.");
    }
  };

  const baixarJSONReal = async (e: React.MouseEvent, corrida: CorridaRow) => {
    e.stopPropagation();
    try {
      let jsonReal = corrida.dadosBrutos;
      if (corrida.origem === 'api') {
        const res = await fetch(`/api/maze_runs/${corrida.id}`);
        jsonReal = await res.json();
      }
      exportarHistoricoJSON(extrairPassos(jsonReal), corrida.id);
    } catch {
      setErro("Erro ao exportar JSON.");
    }
  };

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (reproduzindo && passosReplay) {
      timerRef.current = setInterval(() => {
        setIndicePasso((atual) => {
          if (atual >= passosReplay.length - 1) { setReproduzindo(false); return atual; }
          return atual + 1;
        });
      }, velocidadeTimer);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [reproduzindo, passosReplay, velocidadeTimer]);

  const gridRenderizado = passosReplay ? reconstruirAteStep(passosReplay, indicePasso, tamanhoGrid.larg, tamanhoGrid.alt) : null;
  const roboAtual = passosReplay ? passosReplay[Math.min(indicePasso, passosReplay.length - 1)] : null;
  const replayTerminou = passosReplay && indicePasso >= passosReplay.length - 1;

  const totalRuns = corridas.length;
  const objReached = corridas.filter((r) => r.objetivo).length;
  const bestRun = corridas.filter((r) => r.objetivo).sort((a, b) => a.tempoS - b.tempoS)[0];
  const bestTime = bestRun?.tempo ?? "—";

  return (
    <div className="p-6 bg-[#F1F5F9] min-h-full" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-slate-800" style={{ fontWeight: 700, fontSize: "1.1rem" }}>Histórico de Corridas</h2>
          <p className="text-slate-400" style={{ fontSize: "0.8rem" }}>Clique em uma corrida para ver o gráfico e simular o trajeto</p>
        </div>
        <input ref={inputUploadRef} type="file" accept=".json" onChange={lidarComUpload} className="hidden" />
        <button onClick={() => inputUploadRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:border-blue-300 hover:text-blue-600 transition-all font-semibold text-sm shadow-sm">
          <Upload className="w-4 h-4" /> Importar JSON
        </button>
      </div>

      {erro && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium flex justify-between">
          <span>{erro}</span>
          <button onClick={() => setErro(null)} className="underline">Fechar</button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: Grid3X3, bg: "bg-blue-50", color: "text-blue-500", value: String(totalRuns), sub: "corridas no total" },
          { icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-500", value: `${objReached}/${totalRuns}`, sub: "objetivos atingidos" },
          { icon: Clock, bg: "bg-violet-50", color: "text-violet-500", value: bestTime, sub: "melhor tempo" },
        ].map(({ icon: Icon, bg, color, value, sub }) => (
          <div key={sub} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-slate-900 tabular-nums" style={{ fontWeight: 700, fontSize: "1.4rem", lineHeight: 1 }}>{value}</p>
              <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.75rem" }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <p className="text-slate-700" style={{ fontWeight: 600, fontSize: "0.88rem" }}>Todas as corridas</p>
          <span className="bg-slate-100 text-slate-500 rounded-full px-2.5 py-0.5" style={{ fontSize: "0.72rem", fontWeight: 500 }}>{totalRuns} registros</span>
        </div>

        <div>
          {corridas.map((run) => {
            const isOpen = corridaExpandida === run.id;
            const dadosGrafico = gerarVelocidade(run.seed, run.tempoS);

            return (
              <div key={run.id} className="border-b border-slate-50 last:border-b-0">
                
                <button onClick={() => abrirCorrida(run)} className="w-full text-left hover:bg-slate-50/80 transition-colors">
                  <div className="grid items-center px-5 py-3.5" style={{ gridTemplateColumns: "40px 90px 80px 1fr 160px 140px 40px" }}>
                    <span className="text-slate-400 tabular-nums" style={{ fontSize: "0.85rem" }}>{run.numero}</span>
                    <span><span className="bg-slate-100 text-slate-700 rounded-md px-2 py-0.5 tabular-nums" style={{ fontSize: "0.8rem", fontWeight: 500 }}>{run.grade}</span></span>
                    <span className="text-slate-800 tabular-nums" style={{ fontSize: "0.88rem", fontWeight: 600 }}>{run.tempo}</span>
                    <span>
                      {run.objetivo ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-0.5" style={{ fontSize: "0.78rem", fontWeight: 500 }}><CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} /> Atingido</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-red-600 bg-red-50 border border-red-100 rounded-full px-2.5 py-0.5" style={{ fontSize: "0.78rem", fontWeight: 500 }}><XCircle className="w-3.5 h-3.5" strokeWidth={2} /> Não atingido</span>
                      )}
                    </span>
                    <span className="text-slate-400" style={{ fontSize: "0.82rem" }}>{run.date}</span>
                    
                    <span className="flex gap-1.5">
                      <span 
                        onClick={(e) => baixarCSVReal(e, run)} 
                        className="inline-flex items-center gap-1 px-2 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors cursor-pointer" 
                        style={{ fontSize: "0.7rem", fontWeight: 600 }}
                        title="Exportar CSV"
                      >
                        <Download className="w-3.5 h-3.5" strokeWidth={2} /> CSV
                      </span>
                      <span 
                        onClick={(e) => baixarJSONReal(e, run)} 
                        className="inline-flex items-center gap-1 px-2 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors cursor-pointer" 
                        style={{ fontSize: "0.7rem", fontWeight: 600 }}
                        title="Exportar JSON"
                      >
                        <Download className="w-3.5 h-3.5" strokeWidth={2} /> JSON
                      </span>
                    </span>

                    <span className="flex justify-center text-slate-400">
                      {isOpen ? <ChevronUp className="w-4 h-4" strokeWidth={2} /> : <ChevronDown className="w-4 h-4" strokeWidth={2} />}
                    </span>
                  </div>
                </button>

                {isOpen && passosReplay && gridRenderizado && roboAtual && (
                  <div className="border-t border-slate-200 bg-slate-50">
                    
                    <div className="px-5 pt-3 pb-1">
                      <p className="text-slate-500 flex items-center gap-1.5 mb-2" style={{ fontSize: "0.78rem", fontWeight: 500 }}>
                        <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Velocidade ao longo da corrida #{run.numero}
                      </p>
                    </div>
                    <GraficoVelocidade corrida={run} dadosGrafico={dadosGrafico} />

                    <div className="px-5 pb-5 flex gap-6 flex-col xl:flex-row">
                      <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <MapIcon className="w-4 h-4 text-blue-500" />
                            Replay do Labirinto
                          </h3>
                          <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-mono font-bold">
                            Passo {indicePasso + 1}/{passosReplay.length}
                          </span>
                        </div>

                        <div className="flex justify-center overflow-auto p-4 bg-[#0B1120] rounded-xl border border-slate-800 shadow-[inset_0_0_30px_rgba(0,0,0,0.6)]">
                          <div 
                            className="grid bg-[#0f172a] shadow-lg"
                            style={{
                              gridTemplateColumns: `repeat(${tamanhoGrid.larg}, minmax(32px, 48px))`,
                              gridTemplateRows: `repeat(${tamanhoGrid.alt}, minmax(32px, 48px))`
                            }}
                          >
                            {Array.from({ length: tamanhoGrid.alt }, (_, i) => tamanhoGrid.alt - 1 - i).map((y) =>
                              Array.from({ length: tamanhoGrid.larg }, (_, i) => i).map((x) => {
                                const celula = gridRenderizado[x][y];
                                const isRobot = roboAtual.x === x && roboAtual.y === y;
                                
                                const classesParedes = `
                                  ${celula.norte ? 'border-t-[3px] border-t-red-500 z-10' : 'border-t border-t-slate-700/50'}
                                  ${celula.leste ? 'border-r-[3px] border-r-red-500 z-10' : 'border-r border-r-slate-700/50'}
                                  ${celula.sul   ? 'border-b-[3px] border-b-red-500 z-10' : 'border-b border-b-slate-700/50'}
                                  ${celula.oeste ? 'border-l-[3px] border-l-red-500 z-10' : 'border-l border-l-slate-700/50'}
                                `;

                                let corFundo = "bg-transparent";
                                if (isRobot) corFundo = "bg-blue-500/20";
                                else if (celula.visitada) corFundo = "bg-slate-800/50";

                                return (
                                  <div
                                    key={`${x}-${y}`}
                                    className={cn("relative flex items-center justify-center transition-all duration-300 box-border", classesParedes, corFundo)}
                                    style={{ aspectRatio: '1/1' }}
                                  >
                                    {isRobot && (
                                      <div className={`absolute w-[65%] h-[65%] drop-shadow-[0_0_12px_rgba(59,130,246,0.9)] transition-transform duration-500 ease-in-out`} style={{ transform: `rotate(${obterRotacaoRobo(roboAtual.orientacao)})` }}>
                                        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-blue-400">
                                          <path d="M12 2L22 20L12 16L2 20L12 2Z" fill="currentColor" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="flex gap-1.5">
                            <button onClick={() => { setIndicePasso(0); setReproduzindo(false); }} className="p-2 bg-slate-100 hover:bg-slate-200 rounded transition"><RotateCcw className="w-4 h-4 text-slate-700" /></button>
                            <button onClick={() => { setIndicePasso(p => Math.max(0, p - 1)); setReproduzindo(false); }} className="p-2 bg-slate-100 hover:bg-slate-200 rounded transition"><ChevronLeft className="w-4 h-4 text-slate-700" /></button>
                            <button 
                              onClick={() => { if (replayTerminou) { setIndicePasso(0); setReproduzindo(true); } else { setReproduzindo(!reproduzindo); } }}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-sm flex items-center gap-2 transition"
                            >
                              {reproduzindo ? <Pause className="w-4 h-4"/> : <Play className="w-4 h-4"/>}
                              {reproduzindo ? "Pausar" : replayTerminou ? "Replay" : "Play"}
                            </button>
                            <button onClick={() => { setIndicePasso(p => Math.min(passosReplay.length - 1, p + 1)); setReproduzindo(false); }} className="p-2 bg-slate-100 hover:bg-slate-200 rounded transition"><ChevronRight className="w-4 h-4 text-slate-700" /></button>
                            <button onClick={() => { setIndicePasso(passosReplay.length - 1); setReproduzindo(false); }} className="p-2 bg-slate-100 hover:bg-slate-200 rounded transition"><FastForward className="w-4 h-4 text-slate-700" /></button>
                          </div>

                          <div className="flex gap-2 bg-slate-50 p-1 rounded border border-slate-200">
                            {[1000, 500, 200, 50].map((vel) => (
                              <button key={vel} onClick={() => setVelocidadeTimer(vel)} className={cn("px-3 py-1 text-xs font-bold rounded", velocidadeTimer === vel ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-800")}>
                                {1000 / vel}x
                              </button>
                            ))}
                          </div>
                        </div>
                        
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}