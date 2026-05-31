import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

interface AnalysisResult {
  id: string;
  analysis: string;
  hasEntry: boolean;
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  pointsDeducted: number;
  createdAt: string;
}

interface AnalysisPanelProps {
  timeframe: string;
  onAnalysisComplete?: (result: AnalysisResult) => void;
}

interface ParsedAnalysis {
  phanTich: string;
  disclaimer: string;
}

function parseAnalysisText(rawText: string): ParsedAnalysis {
  const result: ParsedAnalysis = { phanTich: '', disclaimer: '' };

  try {
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : rawText;
    const parsed = JSON.parse(jsonStr);

    result.phanTich = parsed.phan_tich || parsed.analysis || '';
    result.disclaimer = parsed.disclaimer || '';
  } catch {
    result.phanTich = rawText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
  }

  return result;
}

function getTradeDirection(entry: number | null, takeProfit: number | null): 'BUY' | 'SELL' | null {
  if (!entry || !takeProfit) return null;
  return takeProfit > entry ? 'BUY' : 'SELL';
}

export function AnalysisPanel({ timeframe, onAnalysisComplete }: AnalysisPanelProps) {
  const { user, checkAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/analysis', {
        timeframe,
        symbol: 'XAUUSD',
      });
      return res.data.data as AnalysisResult;
    },
    onSuccess: (data) => {
      setResult(data);
      checkAuth();
      queryClient.invalidateQueries({ queryKey: ['analysis-history'] });
      onAnalysisComplete?.(data);
    },
  });

  const hasPoints = (user?.points ?? 0) > 0;

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">AI Analysis</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Your Points:</span>
            <span className={`px-2 py-1 rounded-full text-sm font-medium ${
              hasPoints ? 'bg-yellow-900 text-yellow-300' : 'bg-red-900 text-red-300'
            }`}>
              {user?.points ?? 0}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <p className="text-sm text-gray-400">
              Timeframe: <span className="text-white font-medium">{timeframe}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {hasPoints
                ? 'Click analyze to get AI trading signal. 1 point will be deducted if entry signal is found.'
                : 'You have no points. Contact admin to get more points.'}
            </p>
          </div>
          <button
            onClick={() => analyzeMutation.mutate()}
            disabled={!hasPoints || analyzeMutation.isPending}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              hasPoints && !analyzeMutation.isPending
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {analyzeMutation.isPending ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing...
              </span>
            ) : (
              'Analyze'
            )}
          </button>
        </div>

        {analyzeMutation.isError && (
          <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
            {(analyzeMutation.error as Error)?.message || 'Analysis failed. Please try again.'}
          </div>
        )}
      </div>

      {result && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Analysis Result</h3>
            {result.hasEntry ? (
              <span className="px-2 py-1 bg-green-900 text-green-300 rounded-full text-xs">
                Entry Signal Found
              </span>
            ) : (
              <span className="px-2 py-1 bg-gray-700 text-gray-400 rounded-full text-xs">
                No Entry Signal
              </span>
            )}
          </div>

          {result.hasEntry && (() => {
            const direction = getTradeDirection(result.entry, result.takeProfit);
            const isBuy = direction === 'BUY';
            return (
              <div className={`p-4 border-b border-gray-700 ${isBuy ? 'bg-gradient-to-r from-green-900/30 to-transparent' : 'bg-gradient-to-r from-red-900/30 to-transparent'}`}>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className={`px-4 py-2 rounded-lg text-lg font-bold ${isBuy ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {isBuy ? 'BUY' : 'SELL'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">Entry</div>
                    <div className={`text-xl font-bold ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
                      {result.entry?.toFixed(2) ?? '-'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">Stop Loss</div>
                    <div className="text-xl font-bold text-red-400">{result.stopLoss?.toFixed(2) ?? '-'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">Take Profit</div>
                    <div className="text-xl font-bold text-green-400">{result.takeProfit?.toFixed(2) ?? '-'}</div>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="p-4 space-y-4">
            {(() => {
              const parsed = parseAnalysisText(result.analysis);
              return (
                <>
                  <div className="text-sm text-gray-300 leading-relaxed">
                    {parsed.phanTich}
                  </div>
                  {parsed.disclaimer && (
                    <div className="text-xs text-gray-500 italic border-t border-gray-700 pt-3">
                      {parsed.disclaimer}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          <div className="px-4 py-2 border-t border-gray-700 flex justify-between text-xs text-gray-500">
            <span>Points deducted: {result.pointsDeducted}</span>
            <span>{new Date(result.createdAt).toLocaleString('vi-VN')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
