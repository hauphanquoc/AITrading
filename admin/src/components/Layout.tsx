import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/users', label: 'Users', icon: '👥' },
  { to: '/points', label: 'Points', icon: '💰' },
  { to: '/ai-config', label: 'AI Config', icon: '🤖' },
  { to: '/history', label: 'API History', icon: '📜' },
];

export function Layout() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-300">{user?.name}</span>
              <button
                onClick={logout}
                className="px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded-lg"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside className="w-64 bg-gray-800 min-h-[calc(100vh-4rem)] border-r border-gray-700">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'text-white bg-gray-700'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
