import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface LogEntry {
  timestamp: string;
  systemInstruction: string;
  prompt: string;
  response: string;
}

export function HistoryPage() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<LogEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'request' | 'response'>('request');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/logs');
      setEntries(res.data.data.entries);
    } catch {
      setError('Không thể tải log');
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    if (!confirm('Bạn có chắc muốn xóa tất cả log?')) return;
    try {
      await api.delete('/logs');
      setEntries([]);
      setSelectedEntry(null);
    } catch {
      setError('Không thể xóa log');
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Gemini API History</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchLogs}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
          >
            Clear Logs
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Log List */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h2 className="text-lg font-semibold text-white mb-4">
            Log Entries ({entries.length})
          </h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {entries.length === 0 ? (
              <p className="text-gray-400 text-sm">Chưa có log nào</p>
            ) : (
              entries.map((entry, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedEntry(entry)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedEntry === entry
                      ? 'bg-amber-600/20 border border-amber-500'
                      : 'bg-gray-700 hover:bg-gray-600 border border-transparent'
                  }`}
                >
                  <div className="text-sm text-white font-medium">
                    Request #{entries.length - index}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatDate(entry.timestamp)}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Log Detail */}
        <div className="lg:col-span-2 bg-gray-800 rounded-lg border border-gray-700 p-4">
          {selectedEntry ? (
            <>
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => setActiveTab('request')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'request'
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Request
                </button>
                <button
                  onClick={() => setActiveTab('response')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'response'
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Response
                </button>
                <span className="text-sm text-gray-400 ml-auto">
                  {formatDate(selectedEntry.timestamp)}
                </span>
              </div>

              {activeTab === 'request' ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-amber-400 mb-2">
                      System Instruction
                    </h3>
                    <pre className="bg-gray-900 p-4 rounded-lg text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto max-h-[250px] overflow-y-auto">
                      {selectedEntry.systemInstruction || 'N/A'}
                    </pre>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-amber-400 mb-2">
                      Prompt
                    </h3>
                    <pre className="bg-gray-900 p-4 rounded-lg text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto max-h-[250px] overflow-y-auto">
                      {selectedEntry.prompt || 'N/A'}
                    </pre>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-semibold text-green-400 mb-2">
                    Gemini Response
                  </h3>
                  <pre className="bg-gray-900 p-4 rounded-lg text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto max-h-[500px] overflow-y-auto">
                    {selectedEntry.response || 'N/A'}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              Chọn một log entry để xem chi tiết
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
