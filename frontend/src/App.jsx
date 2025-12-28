import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  Search, 
  Activity, 
  Mic, 
  Eye, 
  Zap, 
  Copy, 
  CheckCircle,
  PlayCircle,
  Youtube,
  BarChart2
} from 'lucide-react';
import { api } from './api';

const App = () => {
  const [url, setUrl] = useState('');
  const [topic, setTopic] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  
  const [analysisResult, setAnalysisResult] = useState(null);
  const [generatedScript, setGeneratedScript] = useState(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!url) return;

    setIsLoading(true);
    setAnalysisResult(null);
    setGeneratedScript(null);

    try {
      // Simulate steps for UX
      setLoadingStep("Connecting to Neural Net...");
      setTimeout(() => setLoadingStep("Downloading Video Data..."), 800);
      
      const result = await api.analyzeVideo(url);
      
      setLoadingStep("Processing completed.");
      setAnalysisResult(result);
    } catch (error) {
      alert("Analysis failed. See console for details.");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic || !analysisResult) return;

    setIsGenerating(true);
    try {
      const result = await api.generateScript(analysisResult.username, topic);
      setGeneratedScript(result.script_data);
    } catch (error) {
      alert("Generation failed. See console.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedScript) return;
    const text = generatedScript.script.map(s => `[${s.time}] ${s.visual} | ${s.audio}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-dark-bg text-gray-200 font-mono selection:bg-neon selection:text-black p-4 md:p-8">
      
      {/* Header */}
      <header className="flex items-center justify-between mb-16 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 text-neon">
          <Cpu className="w-8 h-8" />
          <span className="text-xl font-bold tracking-tighter">GROZPLEXITY AI</span>
        </div>
        <div className="text-xs text-gray-500">v0.1-ALPHA</div>
      </header>

      <main className="max-w-4xl mx-auto space-y-12">
        
        {/* Hero Section */}
        <section className="text-center space-y-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500"
          >
            Reverse Engineering <br />
            <span className="text-neon">Content DNA</span>
          </motion.h1>
          
          <motion.form 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleAnalyze}
            className="relative max-w-2xl mx-auto group"
          >
            <div className="absolute inset-0 bg-neon/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center bg-card-bg border border-gray-800 rounded-xl overflow-hidden shadow-2xl focus-within:border-neon/50 transition-colors">
              <Youtube className="ml-4 text-gray-500" />
              <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube Video URL..."
                className="w-full bg-transparent border-none px-4 py-4 text-white focus:ring-0 placeholder-gray-600 outline-none"
              />
              <button 
                type="submit"
                disabled={isLoading}
                className="bg-neon text-black font-bold px-8 py-4 hover:bg-green-400 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Activity className="animate-spin" /> : <Search />}
                <span className="hidden md:inline">ANALYZE</span>
              </button>
            </div>
          </motion.form>

          {/* Loading State */}
          <AnimatePresence>
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-neon font-mono text-sm"
              >
                {loadingStep}
                <div className="w-64 h-1 bg-gray-800 mx-auto mt-2 rounded-full overflow-hidden">
                  <div className="h-full bg-neon animate-progress" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Results Dashboard */}
        <AnimatePresence>
          {analysisResult && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4 border-b border-gray-800 pb-4">
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-neon font-bold text-xl border border-neon/30">
                  {analysisResult.username[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{analysisResult.username}</h2>
                  <p className="text-gray-500 text-sm">Content DNA Extracted</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Stats */}
                <div className="glass-panel p-6 space-y-4">
                  <div className="flex items-center gap-2 text-neon mb-2">
                    <BarChart2 className="w-5 h-5" />
                    <h3 className="font-bold">METRICS</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Views</span>
                      <span className="font-bold text-xl">{analysisResult.meta_stats?.view_count?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Likes</span>
                      <span className="font-bold text-lg">{analysisResult.meta_stats?.like_count?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Virality Score</span>
                      <div className="flex items-center gap-1 text-neon">
                        <Zap className="w-4 h-4 fill-neon" />
                        <span className="font-bold">{analysisResult.style_passport?.virality_score || 0}/10</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Voice DNA */}
                <div className="glass-panel p-6 space-y-4">
                   <div className="flex items-center gap-2 text-neon mb-2">
                    <Mic className="w-5 h-5" />
                    <h3 className="font-bold">AUDIO DNA</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-500 text-xs block mb-1">TONE</span>
                      <p className="text-white leading-tight">{analysisResult.style_passport?.audio_tone || "Analyzing..."}</p>
                    </div>
      <div>
                      <span className="text-gray-500 text-xs block mb-1">PACING</span>
                      <div className="flex items-center gap-2">
                         <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-neon" 
                             style={{ width: `${(analysisResult.style_passport?.pacing_wpm / 200) * 100}%` }} 
                           />
                         </div>
                         <span className="text-xs">{analysisResult.style_passport?.pacing_wpm || 0} wpm</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 3: Visual DNA */}
                <div className="glass-panel p-6 space-y-4">
                   <div className="flex items-center gap-2 text-neon mb-2">
                    <Eye className="w-5 h-5" />
                    <h3 className="font-bold">VISUAL DNA</h3>
      </div>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {analysisResult.style_passport?.visual_style || "Analyzing..."}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {analysisResult.style_passport?.key_elements?.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-xs bg-neon/10 text-neon px-2 py-1 rounded border border-neon/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
      </div>

              {/* Generator Section */}
              <div className="pt-12 border-t border-gray-800">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <PlayCircle className="text-neon" />
                  GENERATE NEW CONTENT
                </h3>
                
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                  <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter new video topic (e.g., 'How I learned to code in 3 days')"
                    className="flex-1 bg-card-bg border border-gray-700 rounded-lg px-4 py-3 focus:border-neon focus:ring-0 outline-none transition-all"
                  />
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="bg-white text-black font-bold px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {isGenerating ? 'GENERATING...' : 'GENERATE SCRIPT'}
                  </button>
                </div>

                {/* Script Output */}
                {generatedScript && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="glass-panel p-6"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-xl font-bold text-neon mb-1">{generatedScript.title}</h4>
                        <p className="text-xs text-gray-400">Viral Prediction Tips: {generatedScript.viral_tips}</p>
                      </div>
                      <button 
                        onClick={copyToClipboard}
                        className="text-gray-400 hover:text-white transition-colors"
                        title="Copy to Clipboard"
                      >
                        {copied ? <CheckCircle className="text-green-500" /> : <Copy />}
                      </button>
                    </div>

                    <div className="space-y-4">
                      {generatedScript.script.map((block, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-black/30 rounded border border-gray-800 hover:border-gray-700 transition-colors">
                          <div className="md:col-span-2 text-neon font-bold text-sm border-r border-gray-800 pr-4 flex items-center">
                            {block.time}
                          </div>
                          <div className="md:col-span-4 text-sm text-gray-300 border-r border-gray-800 pr-4">
                            <span className="text-xs text-gray-500 block mb-1 uppercase tracking-wider">Visual</span>
                            {block.visual}
                          </div>
                          <div className="md:col-span-6 text-sm text-white font-medium">
                            <span className="text-xs text-gray-500 block mb-1 uppercase tracking-wider">Audio</span>
                            "{block.audio}"
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
};

export default App;
