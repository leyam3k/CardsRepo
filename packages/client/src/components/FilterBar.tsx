import React, { useEffect, useState } from 'react';
import { useCardStore } from '../store/cardStore';
import styles from './FilterBar.module.css';

export const FilterBar: React.FC = () => {
  const cardCount = useCardStore((state) => state.cards.length);
  const {
    availableTags,
    fetchAvailableTags,
    selectedTags,
    toggleTag,
    sortOrder,
    setSortOrder,
    startDate,
    setStartDate,
    endDate,
    setEndDate
  } = useCardStore();
  const [tagSearch, setTagSearch] = useState('');

  useEffect(() => {
    fetchAvailableTags();
  }, [fetchAvailableTags]);

  return (
    <div className={styles.filterBar}>
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${styles.active}`}>All</button>
        <button className={styles.tab}>Favorites</button>
      </div>
      <div className={styles.tags}>
        <div className={styles.tagSearchContainer}>
            <input
                type="text"
                placeholder="Search tags..."
                className={styles.tagSearchInput}
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
            />
        </div>
        <div className={styles.tagList}>
            {selectedTags.map(tag => (
                <button
                    key={tag}
                    className={`${styles.tagButton} ${styles.activeTag}`}
                    onClick={() => toggleTag(tag)}
                >
                    {tag}
                </button>
            ))}
            {availableTags
                .filter(tag => !selectedTags.includes(tag) && tag.toLowerCase().includes(tagSearch.toLowerCase()))
                .map(tag => (
                    <button
                        key={tag}
                        className={styles.tagButton}
                        onClick={() => toggleTag(tag)}
                    >
                        {tag}
                    </button>
            ))}
        </div>
      </div>
      <div className={styles.controls}>
        <span className={styles.characterCount}>{cardCount} characters</span>
        <div className={styles.dateFilters}>
            <label>From:</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={styles.dateInput} />
            <label>To:</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={styles.dateInput} />
        </div>
        <select className={styles.sortDropdown} value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
        </select>
      </div>
    </div>
  );
};