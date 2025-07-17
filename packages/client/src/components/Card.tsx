import React from 'react';
import { type Card as CardType } from '../store/cardStore';
import styles from './Card.module.css';
import { Link } from 'react-router-dom';

interface CardProps {
  card: CardType;
}

export const Card: React.FC<CardProps> = ({ card }) => {
  const fullImageUrl = `http://localhost:3001${card.imageUrl}`;

  return (
    <Link to={`/card/${card.id}`} className={styles.cardLink}>
      <div className={styles.card}>
        <img src={fullImageUrl} alt={card.name} className={styles.cardImage} />
        <div className={styles.cardOverlay}>
          <div className={styles.cardHeader}>
            <span className={styles.creator}>@{card.creator || 'Unknown'}</span>
          </div>
          <div className={styles.cardContent}>
            <h3 className={styles.cardName}>
              {card.name}
              {card.isCopy && <span style={{ color: '#aaa', marginLeft: '8px' }}>(Copy)</span>}
            </h3>
            <p className={styles.cardDescription}>{card.description}</p>
            <div className={styles.cardTags}>
              {card.tags?.map(tag => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};