import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Cpu, History, BarChart2, Sparkles, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const navItems = [
    { path: '/dashboard', icon: BarChart2, label: 'Анализ' },
    { path: '/dashboard/history', icon: History, label: 'История' },
  ];

  const handleCreateClick = () => {
    // Use current authenticated user's username
    if (user?.username) {
      navigate(`/dashboard/generator/${user.username}`);
    } else {
      // If no user, navigate to generator page (will show empty state)
      navigate('/dashboard/generator');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-dark-bg/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 neon-text">
            <Cpu className="w-6 h-6" />
            <span className="text-xl font-bold tracking-widest">GROZPLEXITY AI</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-3">
              {/* Regular nav items (Ghost buttons) */}
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                                (item.path === '/dashboard' && location.pathname.startsWith('/dashboard/analysis'));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-neon border border-neon/30 bg-neon/10'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
              
              {/* CTA Button - Create Script */}
              <button
                onClick={handleCreateClick}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                  location.pathname.startsWith('/dashboard/generator')
                    ? 'bg-neon text-black shadow-[0_0_15px_#39FF14]'
                    : 'bg-neon text-black hover:shadow-[0_0_15px_#39FF14]'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Создать Сценарий
              </button>
            </nav>
            <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;

