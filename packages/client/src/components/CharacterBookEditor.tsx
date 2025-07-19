import React, { useState } from 'react';
import { type Lorebook, type LorebookEntry } from '../store/cardStore';
import FullScreenTextEditor from './FullScreenTextEditor';
import TagInput from './TagInput'; // We'll reuse this for keywords

interface CharacterBookEditorProps {
  book: Lorebook | undefined;
  onChange: (newBook: Lorebook) => void;
}

const CharacterBookEditor: React.FC<CharacterBookEditorProps> = ({ book, onChange }) => {
  const [openEntryIndex, setOpenEntryIndex] = useState<number | null>(null);
  const currentBook: Lorebook = book || { name: '', description: '', extensions: {}, entries: [] };

  const handleBookNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...currentBook, name: e.target.value });
  };

  const handleAddEntry = () => {
    const newEntry: LorebookEntry = {
      id: new Date().getTime(), // Simple unique ID for keys
      keys: [],
      content: '',
      enabled: true,
      insertion_order: currentBook.entries.length,
      extensions: {},
    };
    onChange({ ...currentBook, entries: [...currentBook.entries, newEntry] });
  };

  const handleDeleteEntry = (indexToDelete: number) => {
    if (window.confirm('Are you sure you want to delete this lorebook entry?')) {
      const updatedEntries = currentBook.entries.filter((_, index) => index !== indexToDelete);
      onChange({ ...currentBook, entries: updatedEntries });
    }
  };

  const handleEntryChange = (index: number, updatedEntry: Partial<LorebookEntry>) => {
    const updatedEntries = currentBook.entries.map((entry, i) =>
      i === index ? { ...entry, ...updatedEntry } : entry
    );
    onChange({ ...currentBook, entries: updatedEntries });
  };

  const toggleEntry = (index: number) => {
    setOpenEntryIndex(openEntryIndex === index ? null : index);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <label style={{ flex: '0 0 120px' }}>Book Name:</label>
        <input
          type="text"
          name="bookName"
          value={currentBook.name || ''}
          onChange={handleBookNameChange}
          style={{ flex: 1, padding: '8px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
          placeholder="e.g., Eldoria Chronicles"
        />
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {currentBook.entries.map((entry, index) => (
          <div key={entry.id || index} style={{ border: '1px solid #444', borderRadius: '4px', overflow: 'hidden' }}>
            <button onClick={() => toggleEntry(index)} style={{
              width: '100%',
              padding: '0.75rem 1rem',
              background: '#3a3a3a',
              border: 'none',
              textAlign: 'left',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span>Entry {index + 1}: ({entry.keys.slice(0, 2).join(', ') || 'No Keywords'}{entry.keys.length > 2 ? ', ...' : ''})</span>
              <span>{openEntryIndex === index ? '▲' : '▼'}</span>
            </button>
            {openEntryIndex === index && (
              <div style={{ padding: '1rem', background: '#2b2b2b', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <label style={{ flex: '0 0 120px', paddingTop: '8px' }}>Keywords:</label>
                  <div style={{ flex: 1 }}>
                    <TagInput
                      selectedTags={entry.keys}
                      onTagsChange={(newKeys) => handleEntryChange(index, { keys: newKeys })}
                      placeholder="Add keywords..."
                    />
                  </div>
                </div>

                <FullScreenTextEditor
                  label="Content"
                  value={entry.content}
                  onChange={(newContent) => handleEntryChange(index, { content: newContent })}
                />

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                   <label style={{ flex: '0 0 120px' }}>Enabled:</label>
                   <input
                        type="checkbox"
                        checked={entry.enabled}
                        onChange={(e) => handleEntryChange(index, { enabled: e.target.checked })}
                        style={{ width: '20px', height: '20px' }}
                    />
                </div>
                {/* Add other fields like case_sensitive, constant etc. here as checkboxes/inputs */}

                <button
                  onClick={() => handleDeleteEntry(index)}
                  style={{ padding: '8px', background: 'darkred', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', alignSelf: 'flex-end' }}
                >
                  Delete Entry
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleAddEntry}
        style={{ padding: '10px', background: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', alignSelf: 'flex-start' }}
      >
        + Add Entry
      </button>
    </div>
  );
};

export default CharacterBookEditor;