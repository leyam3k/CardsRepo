import React from 'react';
import { Outlet } from 'react-router-dom';
import styles from './Layout.module.css';

export const Layout: React.FC = () => {
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logo}>🎭</span>
          <h1 className={styles.appName}>Cards Repo</h1>
        </div>
        <div className={styles.headerRight}>
          {/* Theme toggle, etc. will go here */}
        </div>
      </header>
      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
};