import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusConsole from '../components/StatusConsole';
import { 
  Sparkles, Loader2, Eye, Heart, Play, ArrowRight, 
  User, Mic, Brain, Search, FileText, Plus
} from 'lucide-react';

const GeneratorPage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState(null);
  const [generateError, setGenerateError] = useState(null);
  
  // For video analysis (Scenario B)
  const [inputUrl, setInputUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  useEffect(() => {
    // Use username from URL params, or current authenticated user, or fallback to localStorage
    const targetUsername = username || user?.username || localStorage.getItem('last_analyzed_user');
    
    if (targetUsername) {
      loadProfile(targetUsername);
    } else {
      setIsLoading(false);
      setError(null); // No error, just no profile
    }
  }, [username, user]);

  const loadProfile = async (targetUsername) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getProfile(targetUsername);
      setProfile(data);
    } catch (err) {
      console.error('Error loading profile:', err);
      // If profile not found, it's okay - we'll show Scenario B
      setError(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      const data = await api.analyzeVideo(inputUrl.trim());
      // Save username to localStorage
      if (data.username) {
        localStorage.setItem('last_analyzed_user', data.username);
        // Reload profile to switch to Scenario A
        await loadProfile(data.username);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setAnalysisError(err.message || 'Ошибка при анализе видео');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim() || !profile?.username) return;
    
    setIsGenerating(true);
    setGenerateError(null);
    setGeneratedScript(null);
    
    try {
      const data = await api.generateScript(profile.username, topic.trim());
      setGeneratedScript(data.script_data);
    } catch (err) {
      console.error('Generation error:', err);
      setGenerateError(err.message || 'Ошибка при генерации сценария');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVideoClick = (videoId) => {
    navigate(`/dashboard/analysis/${videoId}`);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

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

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center py-20">
          <Loader2 className="w-12 h-12 text-neon mx-auto mb-4 animate-spin" />
          <p className="text-gray-400">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  // Scenario B: No Profile (Empty Start)
  if (!profile || !profile.master_profile || Object.keys(profile.master_profile).length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 neon-text">Создать Сценарий</h1>
            <p className="text-gray-400 text-lg">
              Чтобы генерировать сценарии, нейросети нужно изучить ваш стиль
            </p>
          </div>

          {/* Analysis Form */}
          <div className="glass-card p-8">
            <form onSubmit={handleAnalyze} className="space-y-6">
              <div>
                <label className="block text-white font-semibold mb-3">
                  Загрузите пример вашего лучшего видео
                </label>
                <div className="glass-card p-4 border-2 border-neon/30 flex items-center gap-3">
                  <Search className="w-5 h-5 text-neon flex-shrink-0" />
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="Вставьте ссылку на TikTok/Reels/Shorts/YouTube..."
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-500"
                    disabled={isAnalyzing}
                  />
                </div>
              </div>

              {analysisError && (
                <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400">
                  <p className="font-bold mb-1">Ошибка анализа</p>
                  <p>{analysisError}</p>
                </div>
              )}

              {isAnalyzing && <StatusConsole />}

              <button
                type="submit"
                disabled={isAnalyzing || !inputUrl.trim()}
                className="w-full primary-btn py-4 flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Анализ...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    Проанализировать видео
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  // Scenario A: Profile EXISTS (We know author's style)
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
        {/* Left Sidebar: Author Info */}
        <div className="space-y-6">
          {/* Author Avatar & Name */}
          <div className="glass-card p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-neon/20 flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-neon" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{profile.username}</h2>
            <p className="text-gray-400 text-sm">Автор</p>
          </div>

          {/* Style Highlights */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-neon" />
              Твой стиль
            </h3>
            <div className="space-y-3 text-sm">
              {profile.master_profile.tone_of_voice && (
                <div>
                  <span className="text-gray-400">Тон: </span>
                  <span className="text-white font-semibold">{profile.master_profile.tone_of_voice}</span>
                </div>
              )}
              {profile.master_profile.avg_pacing_wpm !== undefined && (
                <div>
                  <span className="text-gray-400">Темп: </span>
                  <span className="text-white font-semibold">{profile.master_profile.avg_pacing_wpm}/10</span>
                </div>
              )}
              {profile.master_profile.winning_formula && (
                <div className="pt-2 border-t border-gray-800">
                  <span className="text-gray-400 text-xs">Формула: </span>
                  <span className="text-white text-xs">{profile.master_profile.winning_formula}</span>
                </div>
              )}
            </div>
          </div>

          {/* Past Videos (Compact) */}
          {profile.videos && profile.videos.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">
                Прошлые видео ({profile.videos.length})
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {profile.videos.slice(0, 5).map((video) => (
                  <div
                    key={video.id}
                    className="p-3 bg-black/30 rounded-lg cursor-pointer hover:bg-black/50 transition-colors group"
                    onClick={() => handleVideoClick(video.id)}
                  >
                    <p className="text-white text-sm font-medium line-clamp-2 group-hover:text-neon transition-colors mb-1">
                      {video.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Eye className="w-3 h-3" />
                      <span>{formatNumber(video.views)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Change Author Button */}
          <button
            onClick={() => navigate('/dashboard/analysis')}
            className="w-full glass-card p-3 text-sm text-gray-400 hover:text-white hover:border-neon/50 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Сменить автора / Добавить видео-референс
          </button>
        </div>

        {/* Right: Main Generator */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Создать Сценарий</h1>
            <p className="text-gray-400">Новый контент в вашем стиле</p>
          </div>

          {/* Topic Input - Large and Accent */}
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-white font-semibold mb-3 text-lg">
                О чем будет ваше новое видео?
              </label>
              <div className="glass-card p-6 border-2 border-neon/50">
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Напишите идею (например: Обзор iPhone 15)"
                  className="w-full bg-transparent border-none outline-none text-white text-lg placeholder:text-gray-500 resize-none min-h-[120px]"
                  disabled={isGenerating}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating || !topic.trim()}
              className="w-full primary-btn py-5 flex items-center justify-center gap-3 text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-neon/50 transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Генерация...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  Сгенерировать Сценарий ✨
                </>
              )}
            </button>
          </form>

          {generateError && (
            <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400">
              <p className="font-bold mb-1">Ошибка генерации</p>
              <p>{generateError}</p>
            </div>
          )}

          {/* Generated Script */}
          {generatedScript && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 border-2 border-neon/50"
            >
              <h4 className="text-2xl font-bold text-white mb-6">
                {generatedScript.title || 'Сценарий'}
              </h4>

              {/* Script Blocks */}
              {generatedScript.script && Array.isArray(generatedScript.script) && (
                <div className="space-y-4 mb-6">
                  {generatedScript.script.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-black/50 rounded-lg p-4 border border-neon/20"
                    >
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 w-24">
                          <span className="text-neon font-mono text-sm">⏱ {item.time || 'N/A'}</span>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div>
                            <span className="text-neon text-sm">🎬 </span>
                            <span className="text-white text-sm">{item.visual || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-neon text-sm">🗣 </span>
                            <span className="text-gray-300 text-sm">{item.audio || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Viral Tips */}
              {generatedScript.viral_tips && (
                <div className="p-4 bg-neon/10 border border-neon/30 rounded-lg">
                  <p className="text-sm font-semibold text-neon mb-2">💡 Советы по виральности:</p>
                  <p className="text-sm text-gray-300">{generatedScript.viral_tips}</p>
                </div>
              )}
            </motion.div>
          )}

          {!generatedScript && !isGenerating && (
            <div className="glass-card p-12 text-center border-2 border-dashed border-neon/20">
              <Sparkles className="w-16 h-16 text-neon mx-auto mb-4 opacity-50" />
              <p className="text-gray-400 text-lg">Введите тему и нажмите "Сгенерировать Сценарий"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneratorPage;
