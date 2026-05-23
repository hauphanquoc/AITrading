import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface AnalysisItem {
  id: string;
  timeframe: string;
  aiResponse: string;
  hasEntry: boolean;
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  pointsDeducted: number;
  createdAt: string;
}

interface HistoryResponse {
  success: boolean;
  data: AnalysisItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function AnalysisHistory() {
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<HistoryResponse>({
    queryKey: ['analysis-history', page],
    queryFn: async () => {
      const res = await api.get('/analysis/history', {
        params: { page, limit: 5 },
      });
      return res.data;
    },
  });

  const items = data?.data ?? [];
  const pagination = data?.pagination;

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center text-gray-400">
        Loading history...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center text-gray-400">
        No analysis history yet. Click "Analyze" to get your first AI analysis.
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">Analysis History</h3>
      </div>

      <div className="divide-y divide-gray-700">
        {items.map((item) => (
          <div key={item.id} className="p-4">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
            >
              <div className="flex items-center gap-4">
                <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm font-mono">
                  {item.timeframe}
                </span>
                {item.hasEntry ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-400">Entry: {item.entry?.toFixed(2)}</span>
                    <span className="text-gray-500">|</span>
                    <span className="text-red-400">SL: {item.stopLoss?.toFixed(2)}</span>
                    <span className="text-gray-500">|</span>
                    <span className="text-green-400">TP: {item.takeProfit?.toFixed(2)}</span>
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm">No entry signal</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500">
                  {new Date(item.createdAt).toLocaleString('vi-VN')}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    expandedId === item.id ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {expandedId === item.id && (
              <div className="mt-4 p-3 bg-gray-900 rounded-lg">
                <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {item.aiResponse}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between">
          <span className="text-sm text-gray-400">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
