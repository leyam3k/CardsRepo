import React, { useEffect, useState } from 'react';
import { useCardStore } from '../store/cardStore';
import { Link } from 'react-router-dom';
import TagInput from '../components/TagInput'; // Import TagInput for filtering

interface Card {
  id: string;
  image: string;
  name: string;
  description: string;
  tags: string[];
}

const CardGallery: React.FC = () => {
  const cards = useCardStore((state) => state.cards);
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
    <div className="container mx-auto p-4">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link to={`/card/${card.id}`} key={card.id} className="block border rounded shadow-md p-4 hover:shadow-lg transition-shadow bg-white dark:bg-gray-700">
            <img src={`http://localhost:3001/api/images/${card.image}`} alt={card.name} className="w-full h-48 object-cover mb-2 rounded" />
            <h2 className="text-lg font-semibold truncate text-gray-900 dark:text-gray-100">{card.name}</h2>
            {card.description && <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 line-clamp-2">{card.description}</p>}
            {card.tags && card.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {card.tags.map((tag) => (
                  <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium dark:bg-blue-900 dark:text-blue-100">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CardGallery;