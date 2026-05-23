import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';

interface UsersResponse {
  success: boolean;
  pagination: { total: number };
}

interface PointStatsResponse {
  success: boolean;
  data: {
    totalGranted: number;
    totalRevoked: number;
    totalUsage: number;
  };
}

export function DashboardPage() {
  const { user } = useAuthStore();

  const { data: usersData } = useQuery<UsersResponse>({
    queryKey: ['users-count'],
    queryFn: async () => {
      const res = await api.get('/users?limit=1');
      return res.data;
    },
  });

  const { data: statsData } = useQuery<PointStatsResponse>({
    queryKey: ['point-stats'],
    queryFn: async () => {
      const res = await api.get('/points/stats');
      return res.data;
    },
  });

  const totalUsers = usersData?.pagination?.total || 0;
  const totalGranted = statsData?.data?.totalGranted || 0;
  const totalUsage = statsData?.data?.totalUsage || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      <div className="bg-gray-800 rounded-xl shadow p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Chào mừng, {user?.name}!</h2>
        <p className="text-gray-400">Admin dashboard để quản lý users, points và AI config.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400">Total Users</h3>
          <p className="text-3xl font-bold text-white mt-2">{totalUsers}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400">Total Points Granted</h3>
          <p className="text-3xl font-bold text-yellow-400 mt-2">
            {totalGranted.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400">Total Points Used</h3>
          <p className="text-3xl font-bold text-indigo-400 mt-2">{totalUsage.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
