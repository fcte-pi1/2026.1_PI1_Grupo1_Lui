// src/App.tsx
import { FSMStatus } from './app/components/FSMSStatus';
import { RobotMap } from './app/components/MapaTempoReal';

function App() {
  return (
    <div className="min-h-screen bg-muted/20 p-6">
      <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
        {/* Issue HU 3.1: Status do Robô */}
        <div className="w-full lg:w-auto">
          <FSMStatus />
        </div>

        {/* Issue HU 2.1: Mapa em Tempo Real */}
        <div className="w-full lg:w-auto">
          <RobotMap />
        </div>
      </div>
    </div>
  );
}

export default App;
