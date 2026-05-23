import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface AIConfig {
  id: string;
  systemInstruction: {
    role?: string;
    content?: string;
    rules?: string[];
  };
  promptTemplate: string;
  responseFormat: {
    type?: string;
    schema?: Record<string, unknown>;
  };
  isActive: boolean;
  updatedBy: string;
  updatedAt: string;
}

interface ConfigsResponse {
  success: boolean;
  data: AIConfig[];
}

interface ConfigResponse {
  success: boolean;
  data: AIConfig;
}

const DEFAULT_SYSTEM_INSTRUCTION = `Bạn là chuyên gia phân tích kỹ thuật vàng (XAUUSD) với hơn 10 năm kinh nghiệm. Nhiệm vụ của bạn là phân tích dữ liệu OHLC và đưa ra khuyến nghị giao dịch chính xác.

Quy tắc phân tích:
1. Xác định trend chính (uptrend/downtrend/sideway)
2. Phân tích các mức hỗ trợ/kháng cự quan trọng
3. Xem xét các pattern kỹ thuật (candlestick patterns, chart patterns)
4. Đánh giá momentum và volume
5. Chỉ đưa ra entry khi có xác suất thắng > 60%`;

const DEFAULT_PROMPT_TEMPLATE = `Phân tích dữ liệu OHLC sau của cặp XAUUSD trên khung {{timeframe}}:

{{ohlcData}}

Yêu cầu:
1. Phân tích trend hiện tại
2. Xác định các mức hỗ trợ/kháng cự
3. Nhận định pattern đang hình thành
4. Đưa ra khuyến nghị giao dịch (nếu có setup rõ ràng)

Nếu có entry, trả về theo format:
- Entry: [giá vào lệnh]
- Stop Loss: [giá SL]
- Take Profit: [giá TP]
- Tỷ lệ R:R: [risk reward ratio]

Nếu không có entry phù hợp, giải thích lý do và khuyến nghị chờ đợi.`;

const DEFAULT_RESPONSE_FORMAT = {
  type: 'json',
  schema: {
    analysis: 'string',
    trend: 'string',
    support_levels: 'array',
    resistance_levels: 'array',
    has_entry: 'boolean',
    entry: 'number|null',
    stop_loss: 'number|null',
    take_profit: 'number|null',
    risk_reward: 'number|null',
    confidence: 'number',
  },
};

export function AIConfigPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    role: 'system',
    content: DEFAULT_SYSTEM_INSTRUCTION,
    promptTemplate: DEFAULT_PROMPT_TEMPLATE,
    responseFormatType: 'json',
    isActive: true,
  });

  const { data: configsData, isLoading } = useQuery<ConfigsResponse>({
    queryKey: ['ai-configs'],
    queryFn: async () => {
      const res = await api.get('/ai-config');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: {
      systemInstruction: { role: string; content: string };
      promptTemplate: string;
      responseFormat: { type: string };
      isActive: boolean;
    }) => api.post('/ai-config', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-configs'] });
      setShowCreateModal(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        systemInstruction: { role: string; content: string };
        promptTemplate: string;
        responseFormat: { type: string };
        isActive?: boolean;
      };
    }) => api.put(`/ai-config/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-configs'] });
      setEditingId(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/ai-config/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-configs'] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/ai-config/${id}/activate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-configs'] });
    },
  });

  const resetForm = () => {
    setFormData({
      role: 'system',
      content: DEFAULT_SYSTEM_INSTRUCTION,
      promptTemplate: DEFAULT_PROMPT_TEMPLATE,
      responseFormatType: 'json',
      isActive: true,
    });
  };

  const getSystemContent = (config: AIConfig): string => {
    if (config.systemInstruction.content) {
      return config.systemInstruction.content;
    }
    if (config.systemInstruction.rules) {
      return config.systemInstruction.rules.join('\n');
    }
    return config.systemInstruction.role || '';
  };

  const getSystemRole = (config: AIConfig): string => {
    if (config.systemInstruction.content) {
      return config.systemInstruction.role || 'system';
    }
    return 'system';
  };

  const handleEdit = (config: AIConfig) => {
    setEditingId(config.id);
    setFormData({
      role: getSystemRole(config),
      content: getSystemContent(config),
      promptTemplate: config.promptTemplate || '',
      responseFormatType: config.responseFormat?.type || 'json',
      isActive: config.isActive,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      systemInstruction: {
        role: formData.role,
        content: formData.content,
      },
      promptTemplate: formData.promptTemplate,
      responseFormat: {
        type: formData.responseFormatType,
      },
      isActive: formData.isActive,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc muốn xóa config này?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  const configs = configsData?.data || [];
  const activeConfig = configs.find((c) => c.isActive);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">AI Configuration</h1>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Tạo Config mới
        </button>
      </div>

      {activeConfig && (
        <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-xl p-6 border border-indigo-500/50">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            <h2 className="text-lg font-semibold text-white">Config đang Active</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">ID:</span>
              <span className="ml-2 text-white font-mono">{activeConfig.id.slice(0, 8)}...</span>
            </div>
            <div>
              <span className="text-gray-400">Cập nhật:</span>
              <span className="ml-2 text-white">{formatDate(activeConfig.updatedAt)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700">
          <h3 className="text-lg font-medium text-white">Danh sách Configs</h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Đang tải...</div>
        ) : configs.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            Chưa có config nào. Tạo config mới để bắt đầu.
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {configs.map((config) => (
              <div key={config.id} className="p-4 hover:bg-gray-750">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-gray-300">{config.id.slice(0, 8)}...</span>
                      {config.isActive && (
                        <span className="px-2 py-0.5 text-xs bg-green-900 text-green-300 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400 mb-2">
                      <span>System Role: </span>
                      <span className="text-white">{getSystemRole(config)}</span>
                    </div>
                    <div className="text-sm text-gray-400 line-clamp-2">
                      {getSystemContent(config).slice(0, 150)}...
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Cập nhật: {formatDate(config.updatedAt)}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {!config.isActive && (
                      <button
                        onClick={() => activateMutation.mutate(config.id)}
                        disabled={activateMutation.isPending}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(config)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Sửa
                    </button>
                    {!config.isActive && (
                      <button
                        onClick={() => handleDelete(config.id)}
                        disabled={deleteMutation.isPending}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(showCreateModal || editingId) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="sticky top-0 bg-gray-800 px-6 py-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Chỉnh sửa AI Config' : 'Tạo AI Config mới'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  System Instruction Role
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="system"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  System Instruction Content
                  <span className="text-gray-500 ml-2 font-normal">
                    (Hướng dẫn AI về vai trò và cách phân tích)
                  </span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-sm"
                  rows={10}
                  placeholder="Nhập system instruction..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Prompt Template
                  <span className="text-gray-500 ml-2 font-normal">
                    (Dùng {'{{timeframe}}'} và {'{{ohlcData}}'} làm placeholder)
                  </span>
                </label>
                <textarea
                  value={formData.promptTemplate}
                  onChange={(e) => setFormData({ ...formData, promptTemplate: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-sm"
                  rows={12}
                  placeholder="Nhập prompt template..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Response Format</label>
                <select
                  value={formData.responseFormatType}
                  onChange={(e) => setFormData({ ...formData, responseFormatType: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="json">JSON</option>
                  <option value="text">Text</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700"
                />
                <label htmlFor="isActive" className="text-sm text-gray-300">
                  Đặt làm config active (sẽ deactivate các config khác)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingId(null);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {editingId ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
