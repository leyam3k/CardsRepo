import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CardGallery from './pages/CardGallery';
import CardDetails from './pages/CardDetails';
import UploadCard from './components/UploadCard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <header className="bg-blue-600 text-white p-4 shadow-md">
          <h1 className="text-3xl font-bold">Cards Repo</h1>
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
