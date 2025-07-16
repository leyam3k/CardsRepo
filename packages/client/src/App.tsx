import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import CardGallery from './pages/CardGallery';
import CardDetails from './pages/CardDetails';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Routes with the main Janitor AI Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<CardGallery />} />
        </Route>
        
        {/* Standalone route for CardDetails without the main layout */}
        <Route path="card/:id" element={<CardDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
