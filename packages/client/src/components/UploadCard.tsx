import React, { useCallback, useRef } from 'react';
import { useCardStore } from '../store/cardStore';
import { Png } from '../lib/card-parser';
import styles from './UploadCard.module.css';

const UploadCard: React.FC = () => {
  const addCard = useCardStore((state) => state.addCard);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const characterData = Png.Parse(arrayBuffer); // This is a string
      const parsedCharacterData = JSON.parse(characterData); // Parse it once here, accessible in scope

      const formData = new FormData();
      formData.append('card', file);

      const response = await fetch('http://localhost:3001/api/cards/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        // Backend only returns cardId, so we use parsedCharacterData for other fields
        const cardToAdd = {
          id: result.cardId,
          image: `${result.cardId}.png`,
          ...parsedCharacterData, // Spread the parsed data from PNG
          creator: parsedCharacterData.data?.creator || parsedCharacterData.creator || '', // Explicitly set creator
          tags: parsedCharacterData.tags || [], // Ensure tags is an array
        };
        addCard(cardToAdd);
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
        accept="image/png"
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