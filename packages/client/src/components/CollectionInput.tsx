import React, { useState, useEffect } from 'react';
import { useCardStore } from '../store/cardStore';

interface CollectionInputProps {
  selectedCollections: string[];
  onCollectionsChange: (collections: string[]) => void;
}

const CollectionInput: React.FC<CollectionInputProps> = ({ selectedCollections, onCollectionsChange }) => {
  const [inputValue, setInputValue] = useState('');
  const availableCollections = useCardStore((state) => state.collections);
  const fetchCollections = useCardStore((state) => state.fetchCollections);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newCollections = inputValue.split(',').map(c => c.trim()).filter(c => c && !selectedCollections.includes(c));
      if (newCollections.length > 0) {
        onCollectionsChange([...selectedCollections, ...newCollections]);
      }
      setInputValue('');
    }
  };

  const removeCollection = (collectionToRemove: string) => {
    onCollectionsChange(selectedCollections.filter(c => c !== collectionToRemove));
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
        {selectedCollections.map(collection => (
          <div key={collection} style={{ display: 'flex', alignItems: 'center', background: '#555', padding: '4px 8px', borderRadius: '12px', fontSize: '0.9rem' }}>
            {collection}
            <button onClick={() => removeCollection(collection)} style={{ background: 'transparent', border: 'none', color: 'white', marginLeft: '8px', cursor: 'pointer' }}>
              &times;
            </button>
          </div>
        ))}
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        placeholder="Add collections (comma-separated)..."
        style={{ width: '100%', padding: '8px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
        list="available-collections"
      />
      <datalist id="available-collections">
        {availableCollections.map(c => <option key={c} value={c} />)}
      </datalist>
    </div>
  );
};

export default CollectionInput;