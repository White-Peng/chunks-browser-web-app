import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Plus, Link, Trash2, Upload, FileText, Filter, X, AlertTriangle } from 'lucide-react';
import { storageService } from '@/services/storageService';
import { blacklistService } from '@/services/blacklist';
import { generateStoriesWithChunks } from '@/services/contentGenerator';
import { readJsonlFile } from '@/utils/jsonlParser';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface FilteredResult {
  accepted: string[];
  rejected: string[];
}

interface GenerationProgress {
  phase: 'stories' | 'chunks';
  current: number;
  total: number;
  storyTitle?: string;
}

export function AddHistoryPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [urlInput, setUrlInput] = useState('');
  const [urls, setUrls] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [error, setError] = useState('');
  const [showFilterInfo, setShowFilterInfo] = useState(false);
  const [lastFilterResult, setLastFilterResult] = useState<FilteredResult | null>(null);
  const [importStats, setImportStats] = useState<{ total: number; imported: number; filtered: number } | null>(null);

  // Load saved URLs on mount
  useEffect(() => {
    const savedUrls = storageService.getBrowsingHistory();
    setUrls(savedUrls);
  }, []);

  // Filter URLs using blacklist
  const filterAndAddUrls = (newUrls: string[]): FilteredResult => {
    const result = blacklistService.filterUrls(newUrls);
    return {
      accepted: result.filtered,
      rejected: result.removedUrls,
    };
  };

  // Add URL to browsing history
  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    
    // Parse multiple URLs (one per line or comma-separated)
    const rawUrls = urlInput
      .split(/[\n,]/)
      .map(url => url.trim())
      .filter(url => url && url.startsWith('http'));
    
    if (rawUrls.length === 0) {
      setError('Please enter valid URLs (starting with http:// or https://)');
      return;
    }

    // Filter using blacklist
    const filterResult = filterAndAddUrls(rawUrls);
    setLastFilterResult(filterResult);

    if (filterResult.accepted.length === 0) {
      setError(`All ${rawUrls.length} URLs were filtered out by blacklist`);
      setShowFilterInfo(true);
      return;
    }

    // Add accepted URLs
    const updatedUrls = [...new Set([...urls, ...filterResult.accepted])];
    setUrls(updatedUrls);
    storageService.setBrowsingHistory(updatedUrls);
    setUrlInput('');
    setError('');

    // Show filter info if some URLs were rejected
    if (filterResult.rejected.length > 0) {
      setShowFilterInfo(true);
    }
  };

  // Handle JSONL file import
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file extension
    if (!file.name.endsWith('.jsonl') && !file.name.endsWith('.json')) {
      setError('Please select a .jsonl or .json file');
      return;
    }

    try {
      const result = await readJsonlFile(file);
      
      if (result.urls.length === 0) {
        setError(`No valid URLs found in ${file.name}. ${result.errors.length > 0 ? `Errors: ${result.errors.slice(0, 3).join('; ')}` : ''}`);
        return;
      }

      // Filter using blacklist
      const filterResult = filterAndAddUrls(result.urls);
      setLastFilterResult(filterResult);

      // Add accepted URLs
      const updatedUrls = [...new Set([...urls, ...filterResult.accepted])];
      setUrls(updatedUrls);
      storageService.setBrowsingHistory(updatedUrls);

      // Show import stats
      setImportStats({
        total: result.urls.length,
        imported: filterResult.accepted.length,
        filtered: filterResult.rejected.length,
      });

      if (filterResult.rejected.length > 0) {
        setShowFilterInfo(true);
      }

      setError('');
    } catch (err) {
      setError(`Failed to parse file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove URL
  const handleRemoveUrl = (urlToRemove: string) => {
    const updatedUrls = urls.filter(url => url !== urlToRemove);
    setUrls(updatedUrls);
    storageService.setBrowsingHistory(updatedUrls);
  };

  // Clear all URLs
  const handleClearUrls = () => {
    setUrls([]);
    storageService.clearBrowsingHistory();
    setLastFilterResult(null);
    setImportStats(null);
  };

  // Generate Stories with pre-loaded Chunks
  const handleGenerateStories = async () => {
    if (urls.length === 0) {
      setError('Please add some URLs first');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(null);
    setError('');

    try {
      const stories = await generateStoriesWithChunks(urls, (progress) => {
        setGenerationProgress(progress);
      });
      storageService.setStories(stories);
      storageService.setHasStarted(true);
      navigate('/stories');
    } catch (err) {
      console.error('Generate error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate stories');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-4 px-4 py-4 bg-white border-b">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold">Add Browsing History</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Import Stats */}
        <AnimatePresence>
          {importStats && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-green-50 text-green-700 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Import Successful!</p>
                  <p className="text-sm">
                    {importStats.imported} URLs imported, {importStats.filtered} filtered out of {importStats.total} total
                  </p>
                </div>
                <button 
                  onClick={() => setImportStats(null)}
                  className="p-1 hover:bg-green-100 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions */}
        <div className="text-center py-4">
          <p className="text-gray-600">
            Paste URLs or import a JSONL file to generate personalized stories
          </p>
        </div>

        {/* URL Input Section */}
        <section className="bg-gray-50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your URLs</h2>
            <div className="flex items-center gap-2">
              {urls.length > 0 && (
                <button
                  onClick={handleClearUrls}
                  className="text-red-500 text-sm flex items-center gap-1 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* URL Input */}
          <div className="mb-4">
            <textarea
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste URLs here (one per line or comma-separated)&#10;&#10;Example:&#10;https://www.example.com/article1&#10;https://www.example.com/article2"
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleAddUrl}
                className="flex-1 py-3 bg-purple-500 text-white rounded-full font-medium flex items-center justify-center gap-2 hover:bg-purple-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add URLs
              </button>
              
              {/* JSONL Import Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-3 px-4 bg-purple-100 text-purple-700 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-purple-200 transition-colors"
              >
                <Upload className="w-5 h-5" />
                Import JSONL
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jsonl,.json"
                onChange={handleFileImport}
                className="hidden"
              />
            </div>
          </div>

          {/* Filter Info Toggle */}
          <div className="mb-4">
            <button
              onClick={() => setShowFilterInfo(!showFilterInfo)}
              className="text-sm text-gray-500 flex items-center gap-1 hover:text-gray-700"
            >
              <Filter className="w-4 h-4" />
              {showFilterInfo ? 'Hide' : 'Show'} filter details
            </button>
          </div>

          {/* Filter Info Panel */}
          <AnimatePresence>
            {showFilterInfo && lastFilterResult && lastFilterResult.rejected.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200"
              >
                <h3 className="text-sm font-medium text-yellow-800 mb-2">
                  Filtered URLs ({lastFilterResult.rejected.length})
                </h3>
                <p className="text-xs text-yellow-600 mb-2">
                  These URLs were filtered out by the blacklist (social media, search engines, etc.)
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {lastFilterResult.rejected.map((url, index) => (
                    <div key={index} className="text-xs text-yellow-700 truncate flex items-center gap-1">
                      <X className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{url}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* URL List */}
          {urls.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {urls.map((url, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200"
                >
                  <Link className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate flex-1">{url}</span>
                  <button
                    onClick={() => handleRemoveUrl(url)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {urls.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No URLs added yet</p>
              <p className="text-gray-300 text-xs mt-1">Paste URLs above or import a JSONL file</p>
            </div>
          )}

          <p className="text-gray-400 text-xs mt-4 text-center">
            {urls.length} URL{urls.length !== 1 ? 's' : ''} ready for analysis
          </p>
        </section>

        {/* Generate Stories Button */}
        <section className="space-y-3">
          <button
            onClick={handleGenerateStories}
            disabled={isGenerating || urls.length === 0}
            className="w-full py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-full font-semibold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner size="sm" />
                <span>
                  {generationProgress?.phase === 'stories' 
                    ? 'Analyzing URLs...' 
                    : generationProgress?.phase === 'chunks'
                      ? `Generating Chunks (${generationProgress.current}/${generationProgress.total})...`
                      : 'Generating...'}
                </span>
              </>
            ) : (
              'Generate Stories'
            )}
          </button>
          
          {/* Progress Details */}
          <AnimatePresence>
            {isGenerating && generationProgress && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center"
              >
                <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"
                    initial={{ width: 0 }}
                    animate={{ 
                      width: generationProgress.phase === 'stories' 
                        ? '20%' 
                        : `${20 + (generationProgress.current / generationProgress.total) * 80}%` 
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                {generationProgress.storyTitle && (
                  <p className="text-sm text-gray-500 mt-2">
                    Creating chunks for "{generationProgress.storyTitle}"
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Blacklist Info */}
        <section className="text-center text-xs text-gray-400 py-4">
          <p>
            URLs from social media, search engines, and other non-content sites are automatically filtered.
          </p>
        </section>
      </div>
    </div>
  );
}
