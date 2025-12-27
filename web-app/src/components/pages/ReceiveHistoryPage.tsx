import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { storageService } from '@/services/storageService';
import { generateStoriesWithChunks } from '@/services/contentGenerator';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

// Storage key must match the extension's CONFIG.storageKey
const EXTENSION_STORAGE_KEY = 'chunks_browsing_history';

interface ExtensionData {
  urls: string[];
  timestamp: number;
  source: string;
  stats: {
    total: number;
    filtered: number;
    removed: number;
  };
}

interface GenerationProgress {
  phase: 'stories' | 'chunks';
  current: number;
  total: number;
  storyTitle?: string;
}

export function ReceiveHistoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [status, setStatus] = useState<'loading' | 'received' | 'generating' | 'error' | 'success'>('loading');
  const [urls, setUrls] = useState<string[]>([]);
  const [stats, setStats] = useState<{ total: number; filtered: number; removed: number } | null>(null);
  const [error, setError] = useState('');
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);

  // Check for extension data on mount
  useEffect(() => {
    const source = searchParams.get('source');
    
    // Set up event listener for data from extension
    const handleExtensionData = (event: CustomEvent<ExtensionData>) => {
      handleReceivedData(event.detail);
    };
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'CHUNKS_HISTORY_DATA') {
        handleReceivedData(event.data.payload);
      }
    };
    
    window.addEventListener('chunks-history-received', handleExtensionData as EventListener);
    window.addEventListener('message', handleMessage);
    
    if (source === 'extension') {
      // Try to get data from localStorage (extension may have already injected it)
      loadExtensionData();
    } else {
      // Check if there's any pending data in localStorage
      checkLocalStorage();
    }
    
    return () => {
      window.removeEventListener('chunks-history-received', handleExtensionData as EventListener);
      window.removeEventListener('message', handleMessage);
    };
  }, [searchParams]);

  const loadExtensionData = async () => {
    setStatus('loading');
    
    // Try multiple methods to get data from extension
    
    // Method 1: Check localStorage (extension might have written here)
    const localData = localStorage.getItem(EXTENSION_STORAGE_KEY);
    if (localData) {
      try {
        const parsed: ExtensionData = JSON.parse(localData);
        handleReceivedData(parsed);
        // Clear after reading
        localStorage.removeItem(EXTENSION_STORAGE_KEY);
        return;
      } catch (e) {
        console.error('Failed to parse localStorage data:', e);
      }
    }
    
    // Method 2: Try to receive via postMessage from extension
    const messageHandler = (event: MessageEvent) => {
      if (event.data && event.data.type === 'CHUNKS_HISTORY_DATA') {
        handleReceivedData(event.data.payload);
        window.removeEventListener('message', messageHandler);
      }
    };
    window.addEventListener('message', messageHandler);
    
    // Broadcast that we're ready to receive
    window.postMessage({ type: 'CHUNKS_READY_TO_RECEIVE' }, '*');
    
    // Wait for data with timeout
    setTimeout(() => {
      window.removeEventListener('message', messageHandler);
      
      // If still loading, show manual entry option
      if (status === 'loading') {
        setError('Could not receive data from extension. You can manually add URLs instead.');
        setStatus('error');
      }
    }, 3000);
  };

  const checkLocalStorage = () => {
    const localData = localStorage.getItem(EXTENSION_STORAGE_KEY);
    if (localData) {
      try {
        const parsed: ExtensionData = JSON.parse(localData);
        handleReceivedData(parsed);
        localStorage.removeItem(EXTENSION_STORAGE_KEY);
      } catch (e) {
        console.error('Failed to parse localStorage data:', e);
        setStatus('error');
        setError('Invalid data format');
      }
    } else {
      // No data, redirect to manual add page
      navigate('/add-history');
    }
  };

  const handleReceivedData = (data: ExtensionData) => {
    setUrls(data.urls);
    setStats(data.stats);
    setStatus('received');
    
    // Save URLs to storage
    storageService.setBrowsingHistory(data.urls);
  };

  const handleGenerateStories = async () => {
    if (urls.length === 0) {
      setError('No URLs to process');
      return;
    }

    setStatus('generating');
    setGenerationProgress(null);

    try {
      const stories = await generateStoriesWithChunks(urls, (progress) => {
        setGenerationProgress(progress);
      });
      
      storageService.setStories(stories);
      storageService.setHasStarted(true);
      
      setStatus('success');
      
      // Navigate to stories after a brief success message
      setTimeout(() => {
        navigate('/stories');
      }, 1500);
      
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate stories');
      setStatus('error');
    }
  };

  const handleManualAdd = () => {
    navigate('/add-history');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8"
      >
        {/* Loading State */}
        <AnimatePresence mode="wait">
          {status === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Receiving data from extension...</p>
            </motion.div>
          )}

          {/* Received State */}
          {status === 'received' && (
            <motion.div
              key="received"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </motion.div>
                <h1 className="text-2xl font-bold text-gray-900">History Received!</h1>
                <p className="text-gray-600 mt-2">
                  Your browsing history has been securely transferred
                </p>
              </div>

              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-3 gap-4 py-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{stats.total}</p>
                    <p className="text-xs text-gray-500 uppercase">Total URLs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.filtered}</p>
                    <p className="text-xs text-gray-500 uppercase">To Process</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-400">{stats.removed}</p>
                    <p className="text-xs text-gray-500 uppercase">Filtered</p>
                  </div>
                </div>
              )}

              {/* Preview */}
              <div className="bg-gray-50 rounded-xl p-4 max-h-40 overflow-y-auto">
                <p className="text-sm text-gray-500 mb-2">Preview:</p>
                <div className="space-y-1">
                  {urls.slice(0, 5).map((url, i) => (
                    <p key={i} className="text-xs text-gray-700 truncate">{url}</p>
                  ))}
                  {urls.length > 5 && (
                    <p className="text-xs text-gray-400 italic">... and {urls.length - 5} more</p>
                  )}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateStories}
                className="w-full py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-full font-semibold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all"
              >
                Generate Stories
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* Generating State */}
          {status === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 border-4 border-purple-200 border-t-purple-500 rounded-full mx-auto"
              />
              <p className="mt-6 text-gray-900 font-medium">
                {generationProgress?.phase === 'stories' && 'Analyzing your history...'}
                {generationProgress?.phase === 'chunks' && `Creating chunks for "${generationProgress.storyTitle}"...`}
                {!generationProgress && 'Processing...'}
              </p>
              {generationProgress && (
                <p className="text-sm text-gray-500 mt-2">
                  {generationProgress.current} / {generationProgress.total}
                </p>
              )}
            </motion.div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
                className="w-20 h-20 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-10 h-10 text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold text-gray-900">Stories Created!</h1>
              <p className="text-gray-600 mt-2">Redirecting to your stories...</p>
            </motion.div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </motion.div>
                <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
                <p className="text-red-600 mt-2">{error}</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={handleManualAdd}
                  className="w-full py-3 bg-purple-500 text-white rounded-full font-medium hover:bg-purple-600 transition-colors"
                >
                  Add URLs Manually
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

