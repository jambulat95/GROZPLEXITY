import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../api';
import StatusConsole from '../components/StatusConsole';
import { CheckCircle, Eye, Heart, MessageCircle, Clock, ExternalLink, Sparkles, ArrowRight, Search, Loader2 } from 'lucide-react';

const AnalysisPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { videoId } = useParams();
  const [inputUrl, setInputUrl] = useState('');
  const [url, setUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    // If videoId is in URL, load video data directly by ID
    if (videoId) {
      setIsLoading(true);
      setError(null);
      api.getVideo(parseInt(videoId))
        .then((data) => {
          setAnalysisResult(data);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Error loading video:', err);
          setError(err.message || 'Ошибка при загрузке видео');
          setIsLoading(false);
        });
    }
    // Get URL from navigation state for new analysis
    else if (location.state?.url) {
      const urlFromState = location.state.url;
      setInputUrl(urlFromState);
      setUrl(urlFromState);
      setIsAnalyzing(true);
      setError(null);
      setAnalysisResult(null);
      // Start analysis
      api.analyzeVideo(urlFromState)
        .then((data) => {
          console.log('Analysis completed:', data);
          setIsAnalyzing(false);
          setAnalysisResult(data);
          // Save username to localStorage for history page
          if (data.username) {
            localStorage.setItem('last_analyzed_user', data.username);
          }
        })
        .catch((err) => {
          console.error('Analysis error:', err);
          setError(err.message || 'Ошибка при анализе видео');
          setIsAnalyzing(false);
        });
    }
  }, [location.state, videoId]);

  const handleAnalyze = (e) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    
    setUrl(inputUrl.trim());
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    
    api.analyzeVideo(inputUrl.trim())
      .then((data) => {
        console.log('Analysis completed:', data);
        setIsAnalyzing(false);
        setAnalysisResult(data);
        setInputUrl(''); // Clear input after successful analysis
        // Save username to localStorage for history page
        if (data.username) {
          localStorage.setItem('last_analyzed_user', data.username);
        }
      })
      .catch((err) => {
        console.error('Analysis error:', err);
        setError(err.message || 'Ошибка при анализе видео');
        setIsAnalyzing(false);
      });
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // UrlInput Component
  const UrlInput = ({ compact = false }) => (
    <form onSubmit={handleAnalyze} className={compact ? 'mb-6' : ''}>
      <div className={`glass-card ${compact ? 'p-3' : 'p-6'} flex items-center gap-3`}>
        <Search className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} text-neon flex-shrink-0`} />
        <input
          type="url"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="Вставьте ссылку на TikTok/Reels/Shorts/YouTube..."
          className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-500"
          disabled={isAnalyzing || isLoading}
        />
        <button
          type="submit"
          disabled={isAnalyzing || isLoading || !inputUrl.trim()}
          className={`primary-btn ${compact ? 'px-4 py-2 text-sm' : 'px-6 py-3'} disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Анализ...
            </>
          ) : (
            'Анализировать'
          )}
        </button>
      </div>
    </form>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Always show input - compact if results exist, centered if not */}
      {analysisResult ? (
        <UrlInput compact={true} />
      ) : (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl space-y-8"
          >
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4 neon-text">Новый анализ</h1>
              <p className="text-gray-400 text-lg">Вставьте ссылку, чтобы разобрать видео</p>
            </div>
            <UrlInput compact={false} />
          </motion.div>
        </div>
      )}

      {/* Loading state for existing video */}
      {isLoading && !isAnalyzing && (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-neon mx-auto mb-4 animate-spin" />
          <p className="text-gray-400">Загрузка данных видео...</p>
        </div>
      )}

      {/* Status Console - shows during analysis */}
      {isAnalyzing && <StatusConsole />}
      
      {/* Error display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400"
        >
          <p className="font-bold mb-2">Ошибка</p>
          <p>{error}</p>
        </motion.div>
      )}

      {/* Analysis Results */}
      {analysisResult && !isAnalyzing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Success Header */}
          <div className="glass-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-neon/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-neon" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Анализ завершен успешно!</h2>
              <p className="text-gray-400">Видео ID: {analysisResult.video_id} • Автор: {analysisResult.username}</p>
            </div>
          </div>

          {/* Meta Stats */}
          {analysisResult.meta_stats && (
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-neon" />
                Статистика видео
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neon/20 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-neon" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Просмотры</p>
                    <p className="text-lg font-bold text-white">{formatNumber(analysisResult.meta_stats.view_count)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neon/20 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-neon" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Лайки</p>
                    <p className="text-lg font-bold text-white">{formatNumber(analysisResult.meta_stats.like_count)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neon/20 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-neon" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Комментарии</p>
                    <p className="text-lg font-bold text-white">{formatNumber(analysisResult.meta_stats.comment_count)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neon/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-neon" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Длительность</p>
                    <p className="text-lg font-bold text-white">{formatDuration(analysisResult.meta_stats.duration)}</p>
                  </div>
                </div>
              </div>
              {analysisResult.meta_stats.title && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <p className="text-gray-400 text-sm mb-1">Название</p>
                  <p className="text-white font-semibold">{analysisResult.meta_stats.title}</p>
                </div>
              )}
            </div>
          )}

          {/* Style Passport */}
          {analysisResult.style_passport && (
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-neon" />
                ДНК Стиля (Style Passport)
              </h3>
              
              <div className="space-y-6">
                {/* Hook Analysis */}
                {analysisResult.style_passport.hook_analysis && (
                  <div className="bg-black/50 rounded-lg p-6 border border-neon/20">
                    <h4 className="text-lg font-semibold text-white mb-3">Анализ хука (первые 5 секунд)</h4>
                    <p className="text-gray-300 leading-relaxed">{analysisResult.style_passport.hook_analysis}</p>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisResult.style_passport.pacing_wpm !== undefined && (
                    <div className="bg-black/50 rounded-lg p-4 border border-neon/20">
                      <h4 className="text-sm text-gray-400 mb-2">Темп речи (WPM)</h4>
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-neon">{analysisResult.style_passport.pacing_wpm}/10</div>
                        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-neon"
                            style={{ width: `${(analysisResult.style_passport.pacing_wpm / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {analysisResult.style_passport.visual_style && (
                    <div className="bg-black/50 rounded-lg p-4 border border-neon/20">
                      <h4 className="text-sm text-gray-400 mb-2">Визуальный стиль</h4>
                      <p className="text-white font-medium">{analysisResult.style_passport.visual_style}</p>
                    </div>
                  )}

                  {analysisResult.style_passport.audio_tone && (
                    <div className="bg-black/50 rounded-lg p-4 border border-neon/20">
                      <h4 className="text-sm text-gray-400 mb-2">Тон аудио</h4>
                      <p className="text-white font-medium">{analysisResult.style_passport.audio_tone}</p>
                    </div>
                  )}
                </div>

                {/* Key Elements */}
                {analysisResult.style_passport.key_elements && Array.isArray(analysisResult.style_passport.key_elements) && analysisResult.style_passport.key_elements.length > 0 && (
                  <div className="bg-black/50 rounded-lg p-6 border border-neon/20">
                    <h4 className="text-lg font-semibold text-white mb-4">Ключевые элементы</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.style_passport.key_elements.map((element, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-neon/20 border border-neon/50 rounded-full text-sm text-neon"
                        >
                          {element}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Structure */}
                {analysisResult.style_passport.structure && Array.isArray(analysisResult.style_passport.structure) && analysisResult.style_passport.structure.length > 0 && (
                  <div className="bg-black/50 rounded-lg p-6 border border-neon/20">
                    <h4 className="text-lg font-semibold text-white mb-4">Структура видео</h4>
                    <div className="space-y-3">
                      {analysisResult.style_passport.structure.map((item, idx) => (
                        <div key={idx} className="flex gap-4 pb-3 border-b border-gray-800 last:border-0">
                          <div className="w-24 text-sm text-gray-400 shrink-0">{item.time || 'N/A'}</div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-neon mb-1">{item.block || 'N/A'}</div>
                            <div className="text-sm text-gray-300">{item.description || 'N/A'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats Analysis */}
                {analysisResult.style_passport.stats_analysis && (
                  <div className="bg-black/50 rounded-lg p-6 border border-neon/20">
                    <h4 className="text-lg font-semibold text-white mb-3">Анализ статистики</h4>
                    <p className="text-gray-300 leading-relaxed">{analysisResult.style_passport.stats_analysis}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transcript */}
          {analysisResult.transcript_text && (
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-neon" />
                Транскрипт
              </h3>
              <div className="bg-black/50 rounded-lg p-4 border border-neon/20 max-h-64 overflow-y-auto">
                <p className="text-gray-300 whitespace-pre-wrap">{analysisResult.transcript_text}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            {analysisResult.username && (
              <button
                onClick={() => navigate(`/dashboard/generator/${analysisResult.username}`)}
                className="primary-btn px-6 py-3 flex items-center gap-2"
              >
                <span>Перейти в Генератор (Создать сценарий по стилю автора)</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => navigate('/dashboard/history')}
              className="glass-card px-6 py-3 flex items-center gap-2 text-white hover:border-neon/50 transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              Перейти в историю
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AnalysisPage;
