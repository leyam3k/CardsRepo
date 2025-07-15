import React, { useState, useRef, useEffect } from 'react';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditorValue(value);
  }, [value]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSave = () => {
    onChange(editorValue);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setEditorValue(value); // Revert to original value
    setIsOpen(false);
  };

  return (
    <div>
      {label && <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">{label}:</label>}
      <div
        className="border rounded p-2 min-h-[100px] cursor-pointer bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 overflow-hidden relative"
        onClick={handleOpen}
      >
        <div className="whitespace-pre-wrap text-sm">
          {value || <span className="text-gray-400">{placeholder || 'Click to edit...'}</span>}
        </div>
        <button
          onClick={handleOpen}
          className="absolute top-1 right-1 bg-blue-500 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-in-out"
        >
          Edit
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-3xl h-3/4 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{label || 'Edit Text'}</h2>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                &times;
              </button>
            </div>
            <div className="flex-grow p-4">
              <textarea
                ref={textareaRef}
                className="w-full h-full p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                value={editorValue}
                onChange={(e) => setEditorValue(e.target.value)}
                placeholder={placeholder}
              ></textarea>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={handleCancel}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullScreenTextEditor;