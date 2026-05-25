import { FSMStatus } from './app/components/FSMStatus';
import { RobotMap } from './app/components/MapaTempoReal';

function App() {
  return (
    <div className="min-h-screen bg-muted/20 p-6">
      <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
        <div className="w-full lg:w-auto">
          <FSMStatus />
        </div>

        <div className="w-full lg:w-auto">
          <RobotMap />
        </div>
      </div>
    </div>
  );
}

export default App;
