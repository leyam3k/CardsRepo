import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

interface FullScreenTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

const FullScreenTextEditor: React.FC<FullScreenTextEditorProps> = ({
  value,
  onChange,
  label,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editorValue, setEditorValue] = useState(value);

  console.log('FullScreenTextEditor component rendered. Label:', label);

  useEffect(() => {
    setEditorValue(value);
  }, [value]);

  const handleOpen = () => {
    console.log('handleOpen called, setting isOpen to true');
    setIsOpen(true);
  };

  const handleSave = () => {
    onChange(editorValue);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setEditorValue(value); // Revert to original value
    setIsOpen(false);
  };
  
  const handleEditorChange = (newValue: string | undefined) => {
    setEditorValue(newValue || '');
  };

  return (
    <div className="mb-4">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        {label && <label className="block text-sm font-bold">{label}:</label>}
        <button
          onClick={handleOpen}
          aria-label="Open full-screen editor"
          className="opacity-50 hover:opacity-100 transition-opacity"
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '0.1rem',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z"/>
          </svg>
        </button>
      </div>
      <textarea
        className="border rounded p-2 bg-[#2b2b2b] text-gray-200 w-full whitespace-pre-wrap text-sm"
        style={{
          minHeight: '120px',
          maxHeight: '150px',
          overflowY: 'auto',
          resize: 'none',
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Click the icon to edit...'}
      />

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '2rem',
          }}
        >
          <div className="bg-[#1e1e1e] rounded-lg shadow-xl w-full h-full flex flex-col" style={{ maxWidth: '90vw', maxHeight: '90vh' }}>
            <div className="p-4 border-b border-gray-700 flex justify-between items-center" style={{ flexShrink: 0 }}>
              <h2 className="text-xl font-bold text-gray-100">{label || 'Edit Text'}</h2>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-200 text-3xl"
              >
                &times;
              </button>
            </div>
            <div className="flex-grow p-4" style={{ overflow: 'hidden' }}>
              <Editor
                height="100%"
                width="100%"
                language="markdown"
                theme="vs-dark"
                value={editorValue}
                onChange={handleEditorChange}
                loading="Loading Editor..."
                options={{
                  wordWrap: 'on',
                  minimap: { enabled: true },
                  fontSize: 14,
                }}
              />
            </div>
            <div className="p-4 border-t border-gray-700 flex justify-end space-x-4" style={{ flexShrink: 0 }}>
              <button
                onClick={handleCancel}
                className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullScreenTextEditor;