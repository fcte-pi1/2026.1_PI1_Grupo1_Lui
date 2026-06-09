import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Navigation } from 'lucide-react';
import type { DadosTelemetria } from './Dashboard';

interface PropriedadesStatus {
  telemetria: DadosTelemetria;
}

export function FSMStatus({ telemetria }: PropriedadesStatus) {
  const isError = telemetria.estado_fsm === 'ERROR';

  return (
    <Card className={`w-fit min-w-[260px] h-fit transition-colors ${isError ? 'border-destructive bg-destructive/10' : ''}`}>
      <CardHeader className="pb-2 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Navigation size={20} className={isError ? "text-destructive" : "text-slate-600"} />
          Navegação Interna
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex flex-col gap-4 pt-4">
        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
          
          <div className="flex flex-col p-3 bg-slate-50 rounded-lg border">
            <span className="font-medium text-xs uppercase">Bússola (Orientação)</span>
            <span className="text-xl font-bold text-slate-800 tracking-wide mt-1">
              {telemetria.orientacao}
            </span>
          </div>

          <div className="flex flex-col p-3 bg-slate-50 rounded-lg border">
            <span className="font-medium text-xs uppercase">Último Pacote Recebido</span>
            <span className="font-mono text-slate-600 mt-1">
              {telemetria.timestamp}
            </span>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}