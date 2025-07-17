import React, { useEffect } from 'react';
import { useCardStore } from '../store/cardStore';
import { Card as CardComponent } from '../components/Card';
import styles from './CardGallery.module.css';

const CardGallery: React.FC = () => {
  const { cards, setCards, searchTerm, selectedTags, sortOrder, startDate, endDate } = useCardStore();

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
        if (sortOrder) {
          queryParams.append('sortOrder', sortOrder);
        }
        if (startDate) {
          queryParams.append('startDate', startDate);
        }
        if (endDate) {
          queryParams.append('endDate', endDate);
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
  }, [setCards, searchTerm, selectedTags, sortOrder, startDate, endDate]);

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