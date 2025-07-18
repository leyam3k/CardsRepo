import React, { useState, useEffect } from 'react';
import FullScreenTextEditor from './FullScreenTextEditor';

interface TextArrayItem {
  id: string;
  value: string;
}

interface TextArrayEditorProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}

const TextArrayEditor: React.FC<TextArrayEditorProps> = ({ label, values, onChange }) => {
  const [items, setItems] = useState<TextArrayItem[]>([]);

  useEffect(() => {
    setItems(values.map((value, index) => ({ id: `${index}-${Date.now()}`, value })));
  }, []);

  const handleItemChange = (id: string, newValue: string) => {
    const newItems = items.map(item => (item.id === id ? { ...item, value: newValue } : item));
    setItems(newItems);
    onChange(newItems.map(item => item.value));
  };

  const handleAddItem = () => {
    const newItems = [...items, { id: `${items.length}-${Date.now()}`, value: '' }];
    setItems(newItems);
    onChange(newItems.map(item => item.value));
  };

  const handleRemoveItem = (id: string) => {
    const newItems = items.filter(item => item.id !== id);
    setItems(newItems);
    onChange(newItems.map(item => item.value));
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const item = newItems[index];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    if (swapIndex < 0 || swapIndex >= newItems.length) {
      return;
    }

    newItems[index] = newItems[swapIndex];
    newItems[swapIndex] = item;
    setItems(newItems);
    onChange(newItems.map(item => item.value));
  };

  return (
    <div>
      <label>{label}</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
        {items.map((item, index) => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ flex: 1 }}>
                <FullScreenTextEditor 
                    label=''
                    value={item.value} 
                    onChange={(value) => handleItemChange(item.id, value)} 
                />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <button onClick={() => handleMoveItem(index, 'up')} disabled={index === 0} style={{ padding: '4px', cursor: 'pointer' }}>↑</button>
              <button onClick={() => handleMoveItem(index, 'down')} disabled={index === items.length - 1} style={{ padding: '4px', cursor: 'pointer' }}>↓</button>
              <button onClick={() => handleRemoveItem(item.id)} style={{ padding: '4px', cursor: 'pointer', color: 'red' }}>X</button>
            </div>
          </div>
        ))}
        <button onClick={handleAddItem} style={{ padding: '8px', marginTop: '0.5rem', background: '#0078d4', color: 'white', border: 'none', borderRadius: '4px' }}>
          Add New
        </button>
      </div>
    </div>
  );
};

export default TextArrayEditor;