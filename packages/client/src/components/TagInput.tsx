import React, { useState, useEffect } from 'react';

interface TagInputProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

const TagInput: React.FC<TagInputProps> = ({ selectedTags, onTagsChange }) => {
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const fetchAvailableTags = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/tags');
        if (response.ok) {
          const data = await response.json();
          setAvailableTags(data);
        } else {
          console.error('Failed to fetch available tags:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching available tags:', error);
      }
    };
    fetchAvailableTags();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      e.preventDefault();
      const newTags = inputValue.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      const uniqueNewTags = newTags.filter(tag => !selectedTags.includes(tag));
      if (uniqueNewTags.length > 0) {
        onTagsChange([...selectedTags, ...uniqueNewTags]);
      }
      setInputValue('');
    }
  };
  
  const toggleTagSelection = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const filteredAvailableTags = availableTags.filter(
    (tag) => tag.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div>
      <div style={{ backgroundColor: '#333', borderRadius: '4px', padding: '5px', marginBottom: '10px' }}>
        <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            placeholder="Add new tags or filter existing..."
            style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                outline: 'none',
                width: '100%',
                padding: '5px'
            }}
        />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '150px', overflowY: 'auto', padding: '10px', backgroundColor: '#2b2b2b', borderRadius: '4px' }}>
        {filteredAvailableTags.map(tag => (
          <button
            key={tag}
            onClick={() => toggleTagSelection(tag)}
            className="tag-suggestion-item"
            style={{
              padding: '8px 12px',
              border: '1px solid #555',
              borderRadius: '16px',
              background: selectedTags.includes(tag) ? '#0078d4' : '#444',
              color: 'white',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TagInput;