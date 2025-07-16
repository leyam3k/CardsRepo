import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { FilterBar } from './FilterBar';
import styles from './Layout.module.css';

export const Layout: React.FC = () => {
  return (
    <div className={styles.root}>
      <div className={styles.contentWrapper}>
        <Header />
        <FilterBar />
        <main className={styles.mainContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};