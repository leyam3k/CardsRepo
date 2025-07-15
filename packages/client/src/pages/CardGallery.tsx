import React, { useEffect, useState } from 'react';
import { useCardStore, type Card } from '../store/cardStore';
import { Link } from 'react-router-dom';
import TagInput from '../components/TagInput'; // Import TagInput for filtering
import UploadCard from '../components/UploadCard';

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
    <div style={{ padding: '1rem' }}>
      <UploadCard />
      {/* Search and Filter Section */}
      <div style={{ margin: '1rem 0', padding: '1rem', border: '1px solid #333', borderRadius: '8px' }}>
        <input
          type="text"
          placeholder="Search cards by name, description, or creator..."
          style={{ width: '100%', padding: '8px', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#333', color: 'white' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Filter by Tags:</h3>
          <TagInput selectedTags={selectedTags} onTagsChange={setSelectedTags} />
        </div>
      </div>

      {selectedTags.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <strong>Selected Tags:</strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {selectedTags.map(tag => (
              <span key={tag} style={{ backgroundColor: '#0078d4', color: 'white', padding: '8px 12px', borderRadius: '16px' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {cards.map((card) => (
          <Link to={`/card/${card.id}`} key={card.id} style={{ border: '1px solid #444', borderRadius: '8px', overflow: 'hidden', textDecoration: 'none', color: 'inherit', backgroundColor: '#2b2b2b' }}>
            <img src={`http://localhost:3001/api/images/${card.image}`} alt={card.name} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            <div style={{ padding: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>{card.name}</h2>
              {card.description && <p style={{ fontSize: '0.9rem', margin: '0 0 1rem 0', opacity: 0.8, height: '40px', overflow: 'hidden' }}>{card.description}</p>}
              {card.tags && card.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {card.tags.map((tag) => (
                    <span key={tag} style={{ backgroundColor: '#444', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
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