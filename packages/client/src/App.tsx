import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CardGallery from './pages/CardGallery';
import CardDetails from './pages/CardDetails';
import UploadCard from './components/UploadCard';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <header className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center">
          <h1 className="text-3xl font-bold">Cards Repo</h1>
          <button
            onClick={toggleDarkMode}
            className="px-4 py-2 rounded-full bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </header>
        <main className="p-4">
          <UploadCard />
          <Routes>
            <Route path="/" element={<CardGallery />} />
            <Route path="/card/:id" element={<CardDetails />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
