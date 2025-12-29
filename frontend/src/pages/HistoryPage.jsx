import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Calendar, TrendingUp, Play, Eye, Heart, Loader2, FileText, ArrowRight } from 'lucide-react';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return 'N/A';
  }
};

const formatNumber = (num) => {
  if (!num && num !== 0) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const HistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) {
      setError('Пользователь не авторизован');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Use current authenticated user's username
      const data = await api.getProfile(user.username);
      setProfile(data);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err.message || 'Ошибка при загрузке истории');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoClick = (videoId) => {
    navigate(`/dashboard/analysis/${videoId}`);
  };

  const getThumbnailGradient = (index) => {
    const gradients = [
      "from-purple-600/30 via-neon/20 to-blue-600/30",
      "from-neon/30 via-green-600/20 to-cyan-600/30",
      "from-yellow-600/30 via-orange-600/20 to-red-600/30",
      "from-blue-600/30 via-purple-600/20 to-pink-600/30",
      "from-cyan-600/30 via-blue-600/20 to-purple-600/30",
      "from-pink-600/30 via-red-600/20 to-orange-600/30",
    ];
    return gradients[index % gradients.length];
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center py-20">
          <Loader2 className="w-12 h-12 text-neon mx-auto mb-4 animate-spin" />
          <p className="text-gray-400">Загрузка истории...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400">
          <p className="font-bold mb-2">Ошибка</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const videos = profile?.videos || [];
  const lastVideoDate = videos.length > 0 ? videos[0].created_at : null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-bold mb-4 neon-text">Ваша библиотека разборов</h1>
        <p className="text-gray-400 text-lg">Все проанализированные видео</p>
      </motion.div>

      {/* Stats Summary */}
      {videos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
        >
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-neon" />
              <span className="text-gray-400 text-sm">Всего анализов</span>
            </div>
            <p className="text-3xl font-bold text-white">{videos.length}</p>
          </div>
          {lastVideoDate && (
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-neon" />
                <span className="text-gray-400 text-sm">Последний анализ</span>
              </div>
              <p className="text-lg font-semibold text-white">{formatDate(lastVideoDate)}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Empty State */}
      {videos.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="glass-card p-12 max-w-md mx-auto">
            <FileText className="w-16 h-16 text-neon mx-auto mb-4 opacity-50" />
            <h3 className="text-2xl font-bold mb-2">История пуста</h3>
            <p className="text-gray-400 mb-6">
              Проанализируйте первое видео!
            </p>
            <button
              onClick={() => navigate('/dashboard/analysis')}
              className="primary-btn px-6 py-3 inline-flex items-center gap-2"
            >
              <ArrowRight className="w-5 h-5" />
              Перейти к анализу
            </button>
          </div>
        </motion.div>
      )}

      {/* Analysis Cards Grid */}
      {videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              className="glass-card overflow-hidden group hover:neon-glow transition-all cursor-pointer"
              onClick={() => handleVideoClick(video.id)}
            >
              {/* Video Thumbnail */}
              <div className={`relative aspect-video bg-gradient-to-br ${getThumbnailGradient(index)} overflow-hidden`}>
                <div className="absolute inset-0 bg-dark-bg/40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-6xl font-bold text-white/10 select-none">
                    {video.id}
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 rounded-full bg-neon/20 backdrop-blur-sm flex items-center justify-center border-2 border-neon">
                    <Play className="w-8 h-8 text-neon ml-1" fill="currentColor" />
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-neon transition-colors">
                  <span className="line-clamp-2 block">{video.title}</span>
                </h3>
                
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(video.created_at)}</span>
                  </div>
                </div>

                {/* Real Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-neon" />
                    <div>
                      <p className="text-xs text-gray-500">Просмотры</p>
                      <p className="text-sm font-bold text-white">{formatNumber(video.views)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-neon" />
                    <div>
                      <p className="text-xs text-gray-500">Лайки</p>
                      <p className="text-sm font-bold text-white">—</p>
                    </div>
                  </div>
                </div>

                {/* Open Button */}
                <div className="w-full primary-btn py-3 flex items-center justify-center gap-2 text-sm pointer-events-none">
                  <ArrowRight className="w-4 h-4" />
                  Открыть разбор
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
