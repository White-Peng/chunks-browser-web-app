import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  WelcomePage, 
  AddHistoryPage,
  ReceiveHistoryPage,
  StoriesPage, 
  ChunksPage, 
  ChatbotPage 
} from './components/pages';
import { storageService } from './services/storageService';

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has started on mount
  useEffect(() => {
    const started = storageService.getHasStarted();
    const stories = storageService.getStories();
    
    // Consider started if they have stories
    setHasStarted(started && stories.length > 0);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Routes>
          {/* Welcome/Home Route */}
          <Route 
            path="/" 
            element={
              hasStarted ? (
                <Navigate to="/stories" replace />
              ) : (
                <WelcomePage />
              )
            } 
          />
          
          {/* Add History */}
          <Route path="/add-history" element={<AddHistoryPage />} />
          
          {/* Receive History from Extension */}
          <Route path="/receive" element={<ReceiveHistoryPage />} />
          
          {/* Stories */}
          <Route path="/stories" element={<StoriesPage />} />
          
          {/* Chunks */}
          <Route path="/chunks" element={<ChunksPage />} />
          
          {/* Chatbot */}
          <Route path="/chatbot" element={<ChatbotPage />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}
