import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Activity } from 'lucide-react';

interface RobotTelemetry {
  timestamp: number;
  estado_fsm: string;
  bateria_v: number;
  posicao_x: number;
  posicao_y: number;
  orientacao: string;
}

const mockData: RobotTelemetry = {
  timestamp: 1715456789,
  estado_fsm: "MAPPING", 
  bateria_v: 7.4,
  posicao_x: 1,
  posicao_y: 2,
  orientacao: "NORTE"
};

export function FSMStatus() {
  const [telemetry] = useState<RobotTelemetry>(mockData);

  const isError = telemetry.estado_fsm === 'ERROR';

  return (
    <Card className={`w-fit min-w-[320px] transition-colors ${isError ? 'border-destructive bg-destructive/10' : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity size={20} className={isError ? "text-destructive" : ""} />
          Status do Robô
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground/80">Estado Operacional:</span>
          <Badge variant={isError ? "destructive" : "default"} className="text-sm px-3 py-1">
            {telemetry.estado_fsm}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground mt-2 border-t pt-4">
          <div className="flex flex-col">
            <span className="font-medium">Bateria</span>
            <span>{telemetry.bateria_v}V</span>
          </div>
          <div className="flex flex-col">
            <span className="font-medium">Orientação</span>
            <span>{telemetry.orientacao}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-medium">Posição X</span>
            <span>{telemetry.posicao_x}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-medium">Posição Y</span>
            <span>{telemetry.posicao_y}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


