import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cpu, Rocket, Scan, LogIn, UserPlus, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const phrases = [
  "Твои просмотры застряли?",
  "Не знаешь, о чем снимать?",
  "Устал от выгорания?",
  "Не знаешь, как снять видео?",
];

const useTypewriter = (phrases, typingSpeed = 100, deletingSpeed = 50, pauseTime = 2000) => {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex];
    const speed = isDeleting ? deletingSpeed : typingSpeed;

    if (isPaused) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseTime);
      return () => clearTimeout(pauseTimer);
    }

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (currentText.length < currentPhrase.length) {
          setCurrentText(currentPhrase.slice(0, currentText.length + 1));
        } else {
          setIsPaused(true);
        }
      } else {
        if (currentText.length > 0) {
          setCurrentText(currentText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
        }
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, isPaused, currentPhraseIndex, phrases, typingSpeed, deletingSpeed, pauseTime]);

  return currentText;
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [url, setUrl] = useState('');
  const displayedText = useTypewriter(phrases);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      navigate('/dashboard/analysis', { state: { url: url.trim() } });
    }
  };

  const highlightText = (text) => {
    const parts = text.split(/(Взломай|Виральности)/);
    return parts.map((part, index) => {
      if (part === 'Взломай' || part === 'Виральности') {
        return (
          <span key={index} className="text-neon">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-6">
      {/* Header with Login/Dashboard Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute top-6 right-6 z-20 flex items-center gap-3"
      >
        {isAuthenticated ? (
          <>
            <Link
              to="/dashboard"
              className="primary-btn px-4 py-2 flex items-center gap-2 text-sm"
            >
              <LayoutDashboard className="w-4 h-4" />
              Дашборд
            </Link>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-400 text-sm transition-colors"
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="glass-card px-4 py-2 flex items-center gap-2 text-white hover:text-neon hover:border-neon/50 transition-all"
            >
              <LogIn className="w-4 h-4" />
              Войти
            </Link>
            <Link
              to="/register"
              className="primary-btn px-4 py-2 flex items-center gap-2 text-sm"
            >
              <UserPlus className="w-4 h-4" />
              Регистрация
            </Link>
          </>
        )}
      </motion.div>

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
      <div className="relative z-10 w-full max-w-4xl space-y-16 text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-3"
        >
          <Cpu className="w-12 h-12 neon-text" />
          <h1 className="text-5xl font-bold tracking-widest neon-text">GROZPLEXITY</h1>
        </motion.div>

        {/* Typewriter Hero Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="min-h-[120px] flex items-center justify-center"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            {highlightText(displayedText)}
            <span className="inline-block w-1 h-12 bg-neon ml-1 animate-pulse" />
          </h2>
        </motion.div>

        {/* Scan Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="relative">
            <div className="glass-card p-2 flex items-center gap-3 focus-within:border-neon/50 focus-within:neon-glow transition-all">
              <Scan className="w-6 h-6 text-neon flex-shrink-0 ml-2" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Вставь ссылку на TikTok/Reels/Shorts"
                className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder:text-gray-500 py-4"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="primary-btn px-12 py-4 inline-flex items-center gap-2 text-lg w-full md:w-auto justify-center"
          >
            <Rocket className="w-5 h-5" />
            НАЧАТЬ АНАЛИЗ
          </button>

          <p className="text-gray-500 text-sm">• Бесплатно • Мгновенный результат •</p>
        </motion.form>
      </div>

      {/* Bottom Glow Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-dark-bg via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

export default LandingPage;

