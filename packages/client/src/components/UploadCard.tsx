import React, { useCallback } from 'react';
import { useCardStore } from '../store/cardStore';
import { Png } from '../lib/card-parser';

const UploadCard: React.FC = () => {
  const addCard = useCardStore((state) => state.addCard);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const characterData = Png.Parse(arrayBuffer);

      const formData = new FormData();
      formData.append('card', file);

      const response = await fetch('http://localhost:3001/api/cards/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Upload successful:', result);
        // Optionally, fetch all cards again to update the store, or add the new card directly
        // For now, let's assume the backend returns the full card data
        addCard({ id: result.cardId, image: `${result.cardId}.png`, ...JSON.parse(characterData) }); // Placeholder for actual card data
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

  return (
    <div className="upload-card-container">
      <h2 className="text-xl font-bold mb-4">Upload Character Card (PNG)</h2>
      <input
        type="file"
        accept="image/png"
        onChange={handleFileUpload}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100"
      />
    </div>
  );
};

export default UploadCard;