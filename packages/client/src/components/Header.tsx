import React from 'react';
import { Link } from 'react-router-dom'; // Import Link
import styles from './Header.module.css';
import UploadCard from './UploadCard';
import { useCardStore } from '../store/cardStore';

export const Header: React.FC = () => {
  const searchTerm = useCardStore((state) => state.searchTerm);
  const setSearchTerm = useCardStore((state) => state.setSearchTerm);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link to="/" className={styles.logo}>Cards Repo</Link>
        <nav className={styles.nav}>
          <Link to="/manage/tags" className={styles.navLink}>Manage Tags</Link>
          <Link to="/manage/collections" className={styles.navLink}>Manage Collections</Link>
        </nav>
      </div>
      <div className={styles.center}>
        <input
          type="text" 
          placeholder="Search by name, creator, or description..."
          className={styles.searchBar}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className={styles.resetButton} onClick={() => setSearchTerm('')}>Clear</button>
      </div>
      <div className={styles.right}>
        <UploadCard />
        <div className={styles.userIcon}>U</div>
      </div>
    </header>
  );
};