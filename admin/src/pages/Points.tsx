import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
}

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'GRANT' | 'REVOKE' | 'USAGE';
  reason: string;
  createdBy: string;
  createdAt: string;
  user?: User;
}

interface TransactionsResponse {
  success: boolean;
  data: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface StatsResponse {
  success: boolean;
  data: {
    totalGranted: number;
    totalRevoked: number;
    totalUsage: number;
  };
}

interface UsersResponse {
  success: boolean;
  data: User[];
}

export function PointsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'grant' | 'deduct'>('grant');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const { data: statsData } = useQuery<StatsResponse>({
    queryKey: ['point-stats'],
    queryFn: async () => {
      const res = await api.get('/points/stats');
      return res.data;
    },
  });

  const { data: transactionsData, isLoading } = useQuery<TransactionsResponse>({
    queryKey: ['transactions', page, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (typeFilter) params.set('type', typeFilter);
      const res = await api.get(`/points/transactions?${params}`);
      return res.data;
    },
  });

  const { data: usersData } = useQuery<UsersResponse>({
    queryKey: ['users-simple'],
    queryFn: async () => {
      const res = await api.get('/users?limit=100');
      return res.data;
    },
  });

  const grantMutation = useMutation({
    mutationFn: ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) =>
      api.post(`/points/users/${userId}/grant`, { amount, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['point-stats'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
    },
  });

  const deductMutation = useMutation({
    mutationFn: ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) =>
      api.post(`/points/users/${userId}/deduct`, { amount, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['point-stats'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
    },
  });

  const openModal = (type: 'grant' | 'deduct') => {
    setModalType(type);
    setSelectedUserId('');
    setAmount('');
    setReason('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUserId('');
    setAmount('');
    setReason('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      userId: selectedUserId,
      amount: parseInt(amount),
      reason,
    };

    if (modalType === 'grant') {
      grantMutation.mutate(data);
    } else {
      deductMutation.mutate(data);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'GRANT':
        return 'bg-green-900 text-green-300';
      case 'REVOKE':
        return 'bg-red-900 text-red-300';
      case 'USAGE':
        return 'bg-blue-900 text-blue-300';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  const stats = statsData?.data;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Quản lý Points</h1>
        <div className="flex gap-2">
          <button
            onClick={() => openModal('grant')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            + Cấp Points
          </button>
          <button
            onClick={() => openModal('deduct')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            - Thu hồi Points
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400">Tổng Points đã cấp</h3>
          <p className="text-3xl font-bold text-green-400 mt-2">
            +{stats?.totalGranted?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400">Tổng Points đã thu hồi</h3>
          <p className="text-3xl font-bold text-red-400 mt-2">
            -{stats?.totalRevoked?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400">Tổng Points đã sử dụng</h3>
          <p className="text-3xl font-bold text-blue-400 mt-2">
            -{stats?.totalUsage?.toLocaleString() || 0}
          </p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <div className="flex gap-4 items-center">
          <span className="text-gray-400">Lọc theo loại:</span>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          >
            <option value="">Tất cả</option>
            <option value="GRANT">Cấp points</option>
            <option value="REVOKE">Thu hồi</option>
            <option value="USAGE">Sử dụng</option>
          </select>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Đang tải...</div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Thời gian
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Loại</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Số lượng
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Lý do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {transactionsData?.data.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-750">
                    <td className="px-4 py-3 text-gray-300 text-sm">{formatDate(tx.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-white">{tx.user?.name || 'N/A'}</div>
                        <div className="text-gray-400 text-sm">{tx.user?.email || tx.userId}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(tx.type)}`}>
                        {tx.type === 'GRANT' ? 'Cấp' : tx.type === 'REVOKE' ? 'Thu hồi' : 'Sử dụng'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {tx.amount > 0 ? '+' : ''}
                        {tx.amount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300 max-w-xs truncate">{tx.reason}</td>
                  </tr>
                ))}
                {transactionsData?.data.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      Chưa có giao dịch nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {transactionsData && transactionsData.pagination.totalPages > 1 && (
              <div className="flex justify-between items-center px-4 py-3 border-t border-gray-700">
                <span className="text-sm text-gray-400">
                  Trang {transactionsData.pagination.page} / {transactionsData.pagination.totalPages}{' '}
                  ({transactionsData.pagination.total} giao dịch)
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 bg-gray-700 text-gray-300 rounded disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(transactionsData.pagination.totalPages, p + 1))
                    }
                    disabled={page === transactionsData.pagination.totalPages}
                    className="px-3 py-1 bg-gray-700 text-gray-300 rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">
              {modalType === 'grant' ? 'Cấp Points cho User' : 'Thu hồi Points từ User'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Chọn User</label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="">-- Chọn user --</option>
                  {usersData?.data.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Số Points</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="Nhập số points"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Lý do</label>
                <textarea
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  rows={3}
                  placeholder={
                    modalType === 'grant'
                      ? 'VD: Mua gói Premium, Khuyến mãi...'
                      : 'VD: Vi phạm, Refund...'
                  }
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={grantMutation.isPending || deductMutation.isPending}
                  className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                    modalType === 'grant'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {modalType === 'grant' ? 'Cấp Points' : 'Thu hồi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
