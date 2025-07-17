import React, { useEffect } from 'react';
import { useCardStore } from '../store/cardStore';
import styles from './FilterBar.module.css';

export const FilterBar: React.FC = () => {
  const cardCount = useCardStore((state) => state.cards.length);
  const {
    availableTags,
    fetchAvailableTags,
    selectedTags,
    toggleTag,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    dateFilterType,
    setDateFilterType,
    tagSearch,
    setTagSearch,
    clearTagFilters,
    clearDateFilters,
  } = useCardStore();

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
            <button onClick={clearTagFilters} className={styles.clearButton}>Clear</button>
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
            <select className={styles.sortDropdown} value={dateFilterType} onChange={e => setDateFilterType(e.target.value)}>
                <option value="importDate">Imported</option>
                <option value="lastModified">Last Modified</option>
                {/* Future options:
                <option value="downloaded">Downloaded</option>
                <option value="created">Created (JSON)</option>
                <option value="modified">Modified (JSON)</option>
                */}
            </select>
            <label>From:</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={styles.dateInput} />
            <label>To:</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={styles.dateInput} />
            <button onClick={clearDateFilters} className={styles.clearButton}>Clear</button>
        </div>
        <div className={styles.sortControls}>
            <select className={styles.sortDropdown} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="importDate">Import Date</option>
                <option value="lastModified">Modified Date</option>
                <option value="name">Name</option>
                {/* Future options:
                <option value="downloadDate">Download Date</option>
                <option value="creationDate">Creation Date (JSON)</option>
                <option value="modifiedDate">Modified Date (JSON)</option>
                */}
            </select>
            <select className={styles.sortDropdown} value={sortDirection} onChange={e => setSortDirection(e.target.value)}>
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
            </select>
        </div>
      </div>
    </div>
  );
};