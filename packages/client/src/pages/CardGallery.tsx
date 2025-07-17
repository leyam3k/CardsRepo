import React, { useEffect } from 'react';
import { useCardStore } from '../store/cardStore';
import { Card as CardComponent } from '../components/Card';
import styles from './CardGallery.module.css';

const CardGallery: React.FC = () => {
  const { cards, setCards, searchTerm, selectedTags, sortBy, sortDirection, startDate, endDate, dateFilterType, fetchAvailableTags } = useCardStore();

  useEffect(() => {
    fetchAvailableTags();
  }, [fetchAvailableTags]);

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
        queryParams.append('sortBy', sortBy);
        queryParams.append('sortDirection', sortDirection);

        if (startDate) {
          queryParams.append('startDate', startDate);
        }
        if (endDate) {
          queryParams.append('endDate', endDate);
        }
        queryParams.append('dateFilterType', dateFilterType);

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
  }, [setCards, searchTerm, selectedTags, sortBy, sortDirection, startDate, endDate, dateFilterType]);

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