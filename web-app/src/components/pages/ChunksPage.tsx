import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { storageService } from '@/services/storageService';
import type { Story, Chunk } from '@/types';

export function ChunksPage() {
  const navigate = useNavigate();
  const [story, setStory] = useState<Story | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);

  useEffect(() => {
    const storedStory = storageService.getCurrentStory();
    const storedChunks = storageService.getCurrentChunks();
    
    if (storedStory && storedChunks.length > 0) {
      setStory(storedStory);
      setChunks(storedChunks);
    } else {
      navigate('/stories');
    }
  }, [navigate]);

  const nextChunk = () => {
    if (currentChunkIndex < chunks.length - 1) {
      setCurrentChunkIndex(currentChunkIndex + 1);
    } else {
      // All chunks viewed, navigate to chatbot page
      navigate('/chatbot');
    }
  };

  const prevChunk = () => {
    if (currentChunkIndex > 0) {
      setCurrentChunkIndex(currentChunkIndex - 1);
    }
  };

  const currentChunk = chunks[currentChunkIndex];

  if (!story || !currentChunk) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 bg-black"
    >
      {/* Close Button */}
      <button
        onClick={() => navigate('/stories')}
        className="absolute top-4 right-4 z-40 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Progress Indicators */}
      <div className="absolute top-4 left-4 right-16 z-40 flex gap-1">
        {chunks.map((_, index) => (
          <div
            key={index}
            className="h-1 flex-1 rounded-full overflow-hidden bg-white/30"
          >
            <motion.div
              className="h-full bg-white"
              initial={{ width: index < currentChunkIndex ? '100%' : '0%' }}
              animate={{ 
                width: index < currentChunkIndex 
                  ? '100%' 
                  : index === currentChunkIndex 
                    ? '100%' 
                    : '0%' 
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
        ))}
      </div>

      {/* Chunk Content - Tappable */}
      <div className="relative h-full flex">
        {/* Left Tap Area - Previous Chunk */}
        <button
          onClick={prevChunk}
          className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        />

        {/* Right Tap Area - Next Chunk */}
        <button
          onClick={nextChunk}
          className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        />

        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${currentChunk.image})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black/80" />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col justify-end p-8 pb-16 w-full">
          <motion.div
            key={currentChunkIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Story Title */}
            <p className="text-white/50 text-sm">
              {story.title}
            </p>

            {/* Chunk Counter */}
            <p className="text-white/70 uppercase tracking-wider text-sm">
              Chunk {currentChunkIndex + 1} of {chunks.length}
            </p>

            {/* Chunk Title */}
            <h1 className="text-white text-2xl font-bold">
              {currentChunk.title}
            </h1>

            {/* Chunk Content */}
            <p className="text-white/90 text-lg leading-relaxed">
              {currentChunk.content}
            </p>
            
            {/* Navigation Hint */}
            <div className="pt-8 flex justify-between text-white/40 text-sm">
              <span>{currentChunkIndex > 0 ? '← Tap left' : ''}</span>
              <span>
                {currentChunkIndex < chunks.length - 1 
                  ? 'Tap right →' 
                  : 'Tap right to finish →'}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

