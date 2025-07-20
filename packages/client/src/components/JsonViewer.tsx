import React from 'react';

interface JsonViewerProps {
  label: string;
  data: any;
  isPoppedOut?: boolean; // Let parent control the "view"
}

const JsonViewer: React.FC<JsonViewerProps> = ({ label, data, isPoppedOut = false }) => {

  // The content is now just the <pre> block, which can be used anywhere.
  const viewerContent = (
    <pre style={{
      background: '#1e1e1e',
      color: '#d4d4d4',
      padding: '1rem',
      borderRadius: '4px',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
      maxHeight: isPoppedOut ? 'calc(90vh - 100px)' : '150px', // Adjust height for modal context
      overflowY: 'auto',
      margin: 0,
      flex: 1 // Make it fill available space in modal
    }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
        <label className="block text-sm font-bold">{label}</label>
      </div>
      {viewerContent}
    </div>
  );
};

export default JsonViewer;