import React from 'react';
import styles from './Header.module.css';
import UploadCard from './UploadCard';
import { useCardStore } from '../store/cardStore';

export const Header: React.FC = () => {
  const searchTerm = useCardStore((state) => state.searchTerm);
  const setSearchTerm = useCardStore((state) => state.setSearchTerm);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <span className={styles.logo}>Cards Repo</span>
      </div>
      <div className={styles.center}>
        <input 
          type="text" 
          placeholder="Search by name, creator, or description..."
          className={styles.searchBar}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className={styles.resetButton} onClick={() => setSearchTerm('')}>Reset</button>
      </div>
      <div className={styles.right}>
        <UploadCard />
        <div className={styles.userIcon}>U</div>
      </div>
    </header>
  );
};