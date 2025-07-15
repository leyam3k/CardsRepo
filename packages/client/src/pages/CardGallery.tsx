import React, { useEffect, useState } from 'react';
import { useCardStore, type Card } from '../store/cardStore';
import { Link } from 'react-router-dom';
import TagInput from '../components/TagInput'; // Import TagInput for filtering

const CardGallery: React.FC = () => {
  const cards: Card[] = useCardStore((state) => state.cards);
  const setCards = useCardStore((state) => state.setCards);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (searchTerm) {
          queryParams.append('q', searchTerm);
        }
        if (selectedTags.length > 0) {
          queryParams.append('tags', selectedTags.join(','));
        }

        const response = await fetch(`http://localhost:3001/api/cards?${queryParams.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setCards(data);
        } else {
          console.error('Failed to fetch cards:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching cards:', error);
      }
    };
    const handler = setTimeout(() => {
      fetchCards();
    }, 300); // Debounce search input

    return () => {
      clearTimeout(handler);
    };
  }, [setCards, searchTerm, selectedTags]);

  return (
    <div className="card-gallery-container">
      <h1 className="text-2xl font-bold mb-4">Card Gallery</h1>

      {/* Search and Filter Section */}
      <div className="mb-4 p-4 border rounded shadow-sm bg-white dark:bg-gray-800">
        <input
          type="text"
          placeholder="Search cards by name, description, or creator..."
          className="w-full p-2 border rounded mb-4 shadow-sm dark:bg-gray-700 dark:text-gray-100"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Filter by Tags:</h3>
          <TagInput selectedTags={selectedTags} onTagsChange={setSelectedTags} />
        </div>
      </div>

      <div className="card-gallery-grid">
        {cards.map((card) => (
          <Link to={`/card/${card.id}`} key={card.id} className="card-item">
            <img src={`http://localhost:3001/api/images/${card.image}`} alt={card.name} className="w-full h-48 object-cover" />
            <div className="p-4">
              <h2 className="text-lg font-semibold truncate text-gray-900 dark:text-gray-100">{card.name}</h2>
              {card.description && <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 line-clamp-2">{card.description}</p>}
              {card.tags && card.tags.length > 0 && (
                <div className="tag-container">
                  {card.tags.map((tag) => (
                    <span key={tag} className="tag-item">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CardGallery;