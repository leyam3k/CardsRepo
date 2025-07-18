import React, { useState } from 'react';

interface JsonViewerProps {
  label: string;
  data: any;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ label, data }) => {
  const [isPoppedOut, setIsPoppedOut] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert(`${label} data copied to clipboard!`);
  };

  const togglePopout = () => {
    setIsPoppedOut(!isPoppedOut);
  };

  const viewerContent = (
    <pre style={{
      background: '#1e1e1e',
      color: '#d4d4d4',
      padding: '1rem',
      borderRadius: '4px',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
      maxHeight: isPoppedOut ? '80vh' : '150px',
      overflowY: 'auto',
      margin: 0,
    }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <label className="block text-sm font-bold">{label}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={handleCopy}
            aria-label="Copy JSON to clipboard"
            className="opacity-50 hover:opacity-100 transition-opacity"
            style={{ backgroundColor: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '0.1rem' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
              <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
            </svg>
          </button>
          <button
            onClick={togglePopout}
            aria-label="Open full-screen JSON viewer"
            className="opacity-50 hover:opacity-100 transition-opacity"
            style={{ backgroundColor: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '0.1rem' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
               <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z"/>
            </svg>
          </button>
        </div>
      </div>
      {viewerContent}
      {isPoppedOut && (
        <div 
            onClick={togglePopout}
            style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                background: 'rgba(0,0,0,0.7)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                zIndex: 1000 
            }}
        >
            <div 
                onClick={(e) => e.stopPropagation()} 
                style={{ 
                    background: '#2b2b2b', 
                    padding: '2rem', 
                    borderRadius: '8px',
                    width: '80%',
                    height: '90%',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>{label}</h3>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    {viewerContent}
                </div>
                 <button onClick={togglePopout} style={{ marginTop: '1rem', padding: '10px' }}>
                    Close
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default JsonViewer;