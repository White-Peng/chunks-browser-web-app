import { useNavigate } from 'react-router-dom';
import { storageService } from '@/services/storageService';

export function WelcomePage() {
  const navigate = useNavigate();

  const handleStart = () => {
    const stories = storageService.getStories();
    if (stories.length > 0) {
      navigate('/stories');
    } else {
      navigate('/add-history');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white px-6">
      <div className="w-full max-w-md mx-auto">
        <div className="flex flex-col items-center space-y-8">
          {/* Logo/Title */}
          <h1 className="text-4xl font-bold text-center mt-[-10vh]">Chunks</h1>

          {/* Gradient Circle */}
          <div className="relative w-64 h-64 my-12">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 blur-2xl opacity-80"></div>
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500"></div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStart}
            className="w-full max-w-sm py-4 px-6 bg-white border-2 border-black rounded-full hover:bg-gray-50 transition-colors font-medium"
          >
            GET STARTED
          </button>
        </div>
      </div>
    </div>
  );
}
