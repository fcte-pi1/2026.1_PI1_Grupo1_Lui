import { useState } from 'react';
import { FSMStatus } from './app/components/FSMSStatus';
import { RobotMap } from './app/components/MapaTempoReal';
import { HistoryPage } from './app/components/HistoryPage';

function App() {
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');

  return (
    <div className="min-h-screen bg-muted/20 p-6">
      
      <div className="flex justify-center gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('live')}
          className={`px-4 py-2 rounded font-semibold transition-colors ${activeTab === 'live' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          Ao Vivo
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded font-semibold transition-colors ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          Histórico (JSONs)
        </button>
      </div>

      {activeTab === 'live' ? (
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          <div className="w-full lg:w-auto">
            <FSMStatus />
          </div>
          <div className="w-full lg:w-auto">
            <RobotMap />
          </div>
        </div>
      ) : (
        <HistoryPage />
      )}
      
    </div>
  );
}

export default App;
