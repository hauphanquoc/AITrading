import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { ChartViewer } from '@/components/ChartViewer';
import { AnalysisPanel } from '@/components/AnalysisPanel';
import { AnalysisHistory } from '@/components/AnalysisHistory';

const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1'] as const;
type Timeframe = typeof TIMEFRAMES[number];

interface TradeLevels {
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
}

export function DashboardPage() {
  const { user, logout } = useAuthStore();
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('M15');
  const [tradeLevels, setTradeLevels] = useState<TradeLevels>({
    entry: null,
    stopLoss: null,
    takeProfit: null,
  });

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">AI Trading Assistant</h1>
              <span className="ml-3 px-2 py-1 bg-yellow-900 text-yellow-300 rounded text-xs font-medium">
                XAUUSD
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">Points:</span>
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                  (user?.points ?? 0) > 0
                    ? 'bg-yellow-900 text-yellow-300'
                    : 'bg-red-900 text-red-300'
                }`}>
                  {user?.points ?? 0}
                </span>
              </div>
              <span className="text-sm text-gray-400">{user?.name}</span>
              <button
                onClick={logout}
                className="px-3 py-2 text-sm text-red-400 hover:bg-red-900/50 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        <ChartViewer
          selectedTimeframe={selectedTimeframe}
          onTimeframeChange={setSelectedTimeframe}
          tradeLevels={tradeLevels}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnalysisPanel
            timeframe={selectedTimeframe}
            onAnalysisComplete={(result) => {
              if (result.hasEntry) {
                setTradeLevels({
                  entry: result.entry,
                  stopLoss: result.stopLoss,
                  takeProfit: result.takeProfit,
                });
              }
            }}
          />
          <AnalysisHistory />
        </div>
      </main>
    </div>
  );
}
