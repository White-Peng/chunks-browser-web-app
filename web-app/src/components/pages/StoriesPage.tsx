import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate, type PanInfo } from 'motion/react';
import { ArrowLeft, Plus } from 'lucide-react';
import { storageService } from '@/services/storageService';
import { generateChunksFromStory, generateMockChunks } from '@/services/contentGenerator';
import type { Story } from '@/types';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

// Check if story has pre-generated chunks
function hasPreGeneratedChunks(story: Story): boolean {
  return Array.isArray(story.chunks) && story.chunks.length > 0;
}

// Single Story Card Component
function StoryCard({ story, style }: { story: Story; style?: React.CSSProperties }) {
  return (
    <div 
      className="absolute inset-0 w-full h-full"
      style={style}
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${story.image})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/70"></div>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-8 pb-16">
        <h1 className="text-white text-3xl font-bold mb-4 drop-shadow-lg">
          {story.title}
        </h1>
        <p className="text-white/90 text-lg drop-shadow-lg">
          {story.description}
        </p>
      </div>
    </div>
  );
}

export function StoriesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stories, setStories] = useState<Story[]>([]);
  const [isGeneratingChunks, setIsGeneratingChunks] = useState(false);
  const [error, setError] = useState('');
  
  // Motion values for horizontal and vertical dragging
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Opacity based on vertical drag (for swipe up effect)
  const opacity = useTransform(y, [-300, 0, 300], [0.5, 1, 0.5]);

  // Load stories on mount
  useEffect(() => {
    const savedStories = storageService.getStories();
    
    if (savedStories.length > 0) {
      setStories(savedStories);
      
      // Set initial index based on consumed stories
      const consumedStories = storageService.getConsumedStories();
      const firstUnconsumedIndex = savedStories.findIndex(story => !consumedStories.includes(story.id));
      if (firstUnconsumedIndex !== -1) {
        setCurrentIndex(firstUnconsumedIndex);
      } else {
        // All consumed, reset
        storageService.clearConsumedStories();
        setCurrentIndex(0);
      }
    } else {
      navigate('/add-history');
    }
  }, [location, navigate]);

  // Get visible cards (previous, current, next)
  const visibleIndices = [
    currentIndex - 1,
    currentIndex,
    currentIndex + 1
  ].filter(i => i >= 0 && i < stories.length);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 100;
    const velocity = info.velocity.x;
    const offset = info.offset.x;
    
    // Check for vertical swipe first (swipe up to dive in)
    if (Math.abs(info.offset.y) > Math.abs(info.offset.x)) {
      if (info.offset.y < -swipeThreshold) {
        navigateToChunks();
        return;
      }
      // Reset y position
      animate(y, 0, { type: 'spring', stiffness: 300, damping: 30 });
      return;
    }

    // Horizontal swipe logic
    let newIndex = currentIndex;
    
    // Determine direction based on offset and velocity
    if (offset < -swipeThreshold || velocity < -500) {
      // Swipe left - Next story
      if (currentIndex < stories.length - 1) {
        newIndex = currentIndex + 1;
      }
    } else if (offset > swipeThreshold || velocity > 500) {
      // Swipe right - Previous story
      if (currentIndex > 0) {
        newIndex = currentIndex - 1;
      }
    }

    // Animate to new position
    const targetX = (currentIndex - newIndex) * window.innerWidth;
    
    animate(x, targetX, {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      onComplete: () => {
        setCurrentIndex(newIndex);
        x.set(0);
      }
    });
  };

  const navigateToChunks = async () => {
    const currentStory = stories[currentIndex];
    
    // Use pre-generated chunks if available (instant navigation!)
    if (hasPreGeneratedChunks(currentStory)) {
      storageService.setCurrentStory(currentStory);
      storageService.setCurrentChunks(currentStory.chunks!);
      navigate('/chunks');
      return;
    }
    
    // Fallback: Generate chunks on-demand (for legacy stories without pre-generated chunks)
    setIsGeneratingChunks(true);
    setError('');

    try {
      let chunks;
      try {
        chunks = await generateChunksFromStory(currentStory);
      } catch {
        console.log('Using mock chunks');
        chunks = generateMockChunks(currentStory);
      }
      
      storageService.setCurrentStory(currentStory);
      storageService.setCurrentChunks(chunks);
      navigate('/chunks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate chunks');
    } finally {
      setIsGeneratingChunks(false);
    }
  };

  if (stories.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading stories..." />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-4">
        <button 
          onClick={() => navigate('/')}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h2 className="text-white font-medium">Stories</h2>
        <button 
          onClick={() => navigate('/add-history')}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute top-20 left-4 right-4 z-30 p-4 bg-red-500/90 text-white rounded-xl">
          {error}
        </div>
      )}

      {/* Loading Overlay for Chunk Generation */}
      {isGeneratingChunks && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" />
          <p className="text-white mt-4">Generating chunks...</p>
        </div>
      )}

      {/* Progress Indicators */}
      <div className="absolute top-20 left-0 right-0 flex justify-center gap-2 px-4 z-10">
        {stories.map((_, index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full transition-colors ${
              index === currentIndex ? 'bg-white' : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Carousel Container - Draggable */}
      <motion.div
        className="absolute inset-0"
        drag
        dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
        dragElastic={{ left: 0.2, right: 0.2, top: 0.5, bottom: 0.5 }}
        onDragEnd={handleDragEnd}
        style={{ x, y, opacity }}
      >
        {/* Render visible cards (previous, current, next) */}
        {visibleIndices.map((index) => {
          const offset = index - currentIndex;
          return (
            <StoryCard
              key={stories[index].id}
              story={stories[index]}
              style={{
                transform: `translateX(${offset * 100}%)`,
              }}
            />
          );
        })}
      </motion.div>

      {/* Swipe Hints */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center text-white/50 text-sm pointer-events-none z-10">
        <div className="text-center">↑ Swipe up to dive in</div>
      </div>
    </div>
  );
}
