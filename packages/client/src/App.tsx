import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import CardGallery from './pages/CardGallery';
import CardDetails from './pages/CardDetails';
import TagManagementPage from './pages/TagManagementPage'; // Import the new page
import CollectionManagementPage from './pages/CollectionManagementPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Routes with the main Janitor AI Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<CardGallery />} />
          {/* Add the new route for tag management */}
          <Route path="manage/tags" element={<TagManagementPage />} />
          <Route path="manage/collections" element={<CollectionManagementPage />} />
        </Route>
        
        {/* Standalone route for CardDetails without the main layout */}
        <Route path="card/:id" element={<CardDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
