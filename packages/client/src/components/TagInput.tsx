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

  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const filteredAvailableTags = availableTags.filter(
    (tag) => !selectedTags.includes(tag) && tag.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="tag-input-container">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="bg-blue-500 text-white px-3 py-1 rounded-full flex items-center text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="ml-2 text-white hover:text-gray-200 focus:outline-none"
            >
              &times;
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        placeholder="Add new tags or select from below..."
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
      />
      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border p-2 rounded">
        {filteredAvailableTags.map((tag) => (
          <span
            key={tag}
            onClick={() => handleTagClick(tag)}
            className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full cursor-pointer hover:bg-gray-300 text-sm"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default TagInput;