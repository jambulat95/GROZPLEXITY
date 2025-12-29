import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cpu, UserPlus, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setLoading(true);

    const result = await register(username, email, password);
    
    if (result.success) {
      // After successful registration, redirect to login
      navigate('/login', { state: { message: 'Регистрация успешна! Войдите в систему.' } });
    } else {
      setError(result.error || 'Registration failed');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-6">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(57, 255, 20, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(57, 255, 20, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite'
        }} />
        <style>{`
          @keyframes gridMove {
            0% { transform: translate(0, 0); }
            100% { transform: translate(50px, 50px); }
          }
        `}</style>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => {
          const width = typeof window !== 'undefined' ? window.innerWidth : 1920;
          const height = typeof window !== 'undefined' ? window.innerHeight : 1080;
          return (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-neon rounded-full"
              initial={{
                x: Math.random() * width,
                y: Math.random() * height,
                opacity: Math.random() * 0.5 + 0.2,
              }}
              animate={{
                y: [null, Math.random() * height],
                x: [null, Math.random() * width],
                opacity: [null, Math.random() * 0.5 + 0.2],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'linear',
              }}
            />
          );
        })}
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <Cpu className="w-10 h-10 neon-text" />
          <h1 className="text-4xl font-bold tracking-widest neon-text">GROZPLEXITY AI</h1>
        </motion.div>

        {/* Register Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="glass-card p-8 space-y-6"
        >
          <h2 className="text-2xl font-bold text-white text-center">Регистрация</h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Имя пользователя
              </label>
              <div className="glass-card p-2 flex items-center gap-3 focus-within:border-neon/50 focus-within:neon-glow transition-all">
                <UserPlus className="w-5 h-5 text-neon flex-shrink-0 ml-2" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Введите имя пользователя"
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-500 py-2"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="glass-card p-2 flex items-center gap-3 focus-within:border-neon/50 focus-within:neon-glow transition-all">
                <Mail className="w-5 h-5 text-neon flex-shrink-0 ml-2" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Введите email"
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-500 py-2"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Пароль
              </label>
              <div className="glass-card p-2 flex items-center gap-3 focus-within:border-neon/50 focus-within:neon-glow transition-all">
                <Lock className="w-5 h-5 text-neon flex-shrink-0 ml-2" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль (мин. 6 символов)"
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-500 py-2"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Подтвердите пароль
              </label>
              <div className="glass-card p-2 flex items-center gap-3 focus-within:border-neon/50 focus-within:neon-glow transition-all">
                <Lock className="w-5 h-5 text-neon flex-shrink-0 ml-2" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите пароль"
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-500 py-2"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="primary-btn px-6 py-3 w-full inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus className="w-5 h-5" />
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>

          <div className="text-center text-sm text-gray-400">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-neon hover:underline">
              Войти
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Bottom Glow Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-dark-bg via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

export default RegisterPage;

