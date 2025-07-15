import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import CardGallery from './pages/CardGallery';
import CardDetails from './pages/CardDetails';
import UploadCard from './components/UploadCard';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<CardGallery />} />
          <Route path="card/:id" element={<CardDetails />} />
          {/* The UploadCard might be moved to a specific page or layout later */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
