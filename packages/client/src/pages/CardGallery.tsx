import React, { useEffect } from 'react';
import { useCardStore, type Card } from '../store/cardStore';
import { Card as CardComponent } from '../components/Card';
import styles from './CardGallery.module.css';

const CardGallery: React.FC = () => {
  const cards = useCardStore((state) => state.cards);
  const setCards = useCardStore((state) => state.setCards);
  const searchTerm = useCardStore((state) => state.searchTerm);
  const selectedTags = useCardStore((state) => state.selectedTags);

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
    
    // Debounce fetching
    const handler = setTimeout(() => {
      fetchCards();
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [setCards, searchTerm, selectedTags]);

  return (
    <div className={styles.galleryPage}>
      <div className={styles.cardGrid}>
        {cards.map((card) => (
          <CardComponent key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
};

export default CardGallery;