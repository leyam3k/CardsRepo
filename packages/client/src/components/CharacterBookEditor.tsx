import React, { useMemo, useState } from 'react';
import { type Lorebook, type LorebookEntry } from '../store/cardStore';
import FullScreenTextEditor from './FullScreenTextEditor';
import TagInput from './TagInput';
import JsonViewer from './JsonViewer';

interface CharacterBookEditorProps {
  book: Lorebook | undefined;
  onChange: (newBook: Lorebook) => void;
}

const positionOptions = [
    { key: 'after_char', text: 'After Character' },
    { key: 'before_char', text: 'Before Character' },
    { key: 'before_authors_note', text: "Before Author's Note" },
    { key: 'after_authors_note', text: "After Author's Note" },
];

const CharacterBookEditor: React.FC<CharacterBookEditorProps> = ({ book, onChange }) => {
  const [openEntryIndex, setOpenEntryIndex] = useState<number | null>(null);
  const currentBook: Lorebook = book || { name: '', description: '', extensions: {}, entries: [] };

  const handleBookPropertyChange = (field: keyof Lorebook, value: any) => {
    onChange({ ...currentBook, [field]: value });
  };

  const handleAddEntry = () => {
    const newEntry: LorebookEntry = {
      id: new Date().getTime(),
      keys: [],
      secondary_keys: [],
      content: '',
      comment: '',
      position: 'before_char',
      insertion_order: (currentBook.entries?.length || 0) * 10,
      enabled: true,
      constant: false,
      selective: false,
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

  const availableKeywords = useMemo(() => {
    return Array.from(
      new Set(
        currentBook.entries.flatMap(entry => [...(entry.keys || []), ...(entry.secondary_keys || [])])
      )
    );
  }, [currentBook.entries]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <label style={{ flex: '0 0 120px' }}>Book Name:</label>
        <input
          type="text"
          name="bookName"
          value={currentBook.name || ''}
          onChange={(e) => handleBookPropertyChange('name', e.target.value)}
          style={{ flex: 1, padding: '8px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
          placeholder="e.g., Eldoria Chronicles"
        />
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {currentBook.entries.map((entry, index) => (
          <div key={entry.id || index} style={{ border: '1px solid #444', borderRadius: '4px', overflow: 'hidden' }}>
            <button onClick={() => toggleEntry(index)} style={{
              width: '100%', padding: '0.75rem 1rem', background: '#3a3a3a', border: 'none',
              textAlign: 'left', color: 'white', cursor: 'pointer', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>Entry {index + 1}: {entry.comment || `(${entry.keys.slice(0, 2).join(', ') || 'No Keywords'}${entry.keys.length > 2 ? ', ...' : ''})`}</span>
              <span>{openEntryIndex === index ? '▲' : '▼'}</span>
            </button>
            {openEntryIndex === index && (
              <div style={{ padding: '0.75rem', background: '#2b2b2b', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                
                {/* Keywords and Secondary Keys */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{display: 'block', marginBottom: '4px'}}>Keywords:</label>
                    <TagInput
                      selectedTags={entry.keys}
                      availableTags={availableKeywords}
                      onTagsChange={(newKeys) => handleEntryChange(index, { keys: newKeys })}
                      placeholder="Add keywords..."
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', marginBottom: '4px'}}>Secondary Keys:</label>
                    <TagInput
                      selectedTags={entry.secondary_keys || []}
                      availableTags={availableKeywords}
                      onTagsChange={(newKeys) => handleEntryChange(index, { secondary_keys: newKeys })}
                      placeholder="Add secondary keywords..."
                    />
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label style={{display: 'block', marginBottom: '4px'}}>Comment:</label>
                  <input
                    type="text"
                    value={entry.comment || ''}
                    onChange={(e) => handleEntryChange(index, { comment: e.target.value })}
                    style={{ width: '100%', padding: '6px', backgroundColor: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px' }}
                  />
                </div>

                {/* Content */}
                <FullScreenTextEditor
                  label="Content"
                  value={entry.content}
                  onChange={(newContent) => handleEntryChange(index, { content: newContent })}
                />

                {/* Order and Position */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{display: 'block', marginBottom: '4px'}}>Insertion Order:</label>
                    <input
                      type="number"
                      value={entry.insertion_order}
                      onChange={(e) => handleEntryChange(index, { insertion_order: parseInt(e.target.value, 10) || 0 })}
                      style={{ width: '100%', padding: '6px', backgroundColor: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', marginBottom: '4px'}}>Position:</label>
                    <select
                      value={entry.position || 'before_char'}
                      onChange={(e) => handleEntryChange(index, { position: e.target.value as any })}
                      style={{ width: '100%', padding: '6px', backgroundColor: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px' }}
                    >
                      {positionOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.text}</option>)}
                    </select>
                  </div>
                </div>
                
                {/* Toggles */}
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><input type="checkbox" checked={entry.enabled} onChange={(e) => handleEntryChange(index, { enabled: e.target.checked })}/> Enabled</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><input type="checkbox" checked={!!entry.constant} onChange={(e) => handleEntryChange(index, { constant: e.target.checked })}/> Constant</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><input type="checkbox" checked={!!entry.selective} onChange={(e) => handleEntryChange(index, { selective: e.target.checked })}/> Selective</label>
                </div>
                
                {/* Extensions and Delete Button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{flex: 1}}>
                        <JsonViewer label="Extensions (Read-only)" data={entry.extensions} />
                    </div>
                    <button
                      onClick={() => handleDeleteEntry(index)}
                      style={{ padding: '6px 12px', background: 'darkred', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', alignSelf: 'flex-end' }}
                    >
                      Delete
                    </button>
                </div>
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