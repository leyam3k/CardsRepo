import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CardGallery from './pages/CardGallery';
import CardDetails from './pages/CardDetails';
import UploadCard from './components/UploadCard';
import './App.css';

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
      <div className={`app-container ${isDarkMode ? 'dark' : ''}`}>
        <header className="app-header">
          <h1 className="header-title">Cards Repo</h1>
          <button onClick={toggleDarkMode} className="theme-toggle-button">
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </header>
        <main className="app-main">
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
