import React, { useCallback, useRef } from 'react';
import { useCardStore } from '../store/cardStore';
import styles from './UploadCard.module.css';

const UploadCard: React.FC = () => {
  const addCard = useCardStore((state) => state.addCard);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('card', file);

      const response = await fetch('http://localhost:3001/api/cards/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const { card: newCard } = await response.json();
        addCard(newCard); // The server now returns the complete card object
      } else {
        const errorData = await response.json();
        console.error('Upload failed:', errorData.error || response.statusText);
        alert(`Upload failed: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      alert(`Error processing file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [addCard]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        accept="image/png,application/json"
        onChange={handleFileUpload}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />
      <button onClick={handleClick} className={styles.uploadButton}>
        Upload Card
      </button>
    </>
  );
};

export default UploadCard;