import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface Card {
  id: string;
  image: string;
  name: string;
  description: string;
  // Add other card properties as needed
}

const CardDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCardDetails = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/cards/${id}`);
        if (response.ok) {
          const data = await response.json();
          setCard(data);
        } else {
          setError('Card not found.');
          console.error('Failed to fetch card details:', response.statusText);
        }
      } catch (err) {
        setError('Error fetching card details.');
        console.error('Error fetching card details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCardDetails();
  }, [id]);

  if (loading) {
    return <div className="text-center p-4">Loading card details...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  if (!card) {
    return <div className="text-center p-4">No card data available.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <img src={`http://localhost:3001/api/images/${card.image}`} alt={card.name} className="w-full h-auto rounded shadow-lg" />
        </div>
        <div className="md:w-2/3">
          <h1 className="text-3xl font-bold mb-4">{card.name}</h1>
          <p className="text-gray-700 dark:text-gray-300">{card.description}</p>
          {/* Add more card details here */}
        </div>
      </div>
    </div>
  );
};

export default CardDetails;