import React, { useEffect } from 'react';
import { useCardStore } from '../store/cardStore';
import { Link } from 'react-router-dom';

const CardGallery: React.FC = () => {
  const cards = useCardStore((state) => state.cards);
  const setCards = useCardStore((state) => state.setCards);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/cards');
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
    fetchCards();
  }, [setCards]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Card Gallery</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link to={`/card/${card.id}`} key={card.id} className="block border rounded shadow-md p-4 hover:shadow-lg transition-shadow">
            <img src={`http://localhost:3001/api/images/${card.image}`} alt={card.name} className="w-full h-48 object-cover mb-2 rounded" />
            <h2 className="text-lg font-semibold truncate">{card.name}</h2>
            {/* Add more card details here */}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CardGallery;