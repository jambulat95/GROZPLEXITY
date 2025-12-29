import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const StatusConsole = ({ onComplete }) => {
  const [lines, setLines] = useState([]);
  const messages = [
    "Подключение к нейросети...",
    "Скачивание видеопотока...",
    "Извлечение аудиодорожки...",
    "Разбивка на кадры (Computer Vision)...",
    "Синтез ДНК стиля...",
    "Генерация отчета..."
  ];

  useEffect(() => {
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      if (currentIndex < messages.length) {
        setLines(prev => [...prev, messages[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(interval);
        // Optional: call onComplete if parent wants to know when animation is done
        // onComplete && onComplete();
      }
    }, 1200); // Slightly faster than 1.5s for better pacing

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto font-mono text-sm md:text-base mt-10">
      <div className="bg-black border border-neon/40 rounded-lg shadow-[0_0_20px_rgba(57,255,20,0.1)] overflow-hidden">
        {/* Terminal Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
          <div className="ml-4 text-gray-500 text-xs">root@grozplexity-ai:~</div>
        </div>

        {/* Terminal Body */}
        <div className="p-6 h-64 overflow-y-auto font-bold text-neon/90 space-y-2">
          {lines.map((line, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-2"
            >
              <span className="text-gray-500 shrink-0">{`>`}</span>
              <span>{line}</span>
            </motion.div>
          ))}
          <div className="flex gap-2">
            <span className="text-gray-500 shrink-0">{`>`}</span>
            <span className="animate-pulse bg-neon w-2 h-5 inline-block align-middle" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusConsole;

