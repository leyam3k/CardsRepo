import React, { useEffect, useState } from 'react';
import { useCardStore } from '../store/cardStore';
import styles from './FilterBar.module.css';

export const FilterBar: React.FC = () => {
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const cardCount = useCardStore((state) => state.cards.length);
  const selectedTags = useCardStore((state) => state.selectedTags);
  const toggleTag = useCardStore((state) => state.toggleTag);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/tags');
        if (response.ok) {
          const tags = await response.json();
          setAvailableTags(tags);
        } else {
          console.error('Failed to fetch tags');
        }
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };
    fetchTags();
  }, []);

  return (
    <div className={styles.filterBar}>
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${styles.active}`}>All</button>
        <button className={styles.tab}>Favorites</button>
      </div>
      <div className={styles.tags}>
        {availableTags.map(tag => (
          <button 
            key={tag} 
            className={`${styles.tagButton} ${selectedTags.includes(tag) ? styles.activeTag : ''}`}
            onClick={() => toggleTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
      <div className={styles.controls}>
        <span className={styles.characterCount}>{cardCount} characters</span>
        <select className={styles.sortDropdown}>
          <option>Popular</option>
          <option>Latest</option>
        </select>
      </div>
    </div>
  );
};