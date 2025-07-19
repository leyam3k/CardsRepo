import React, { useRef } from 'react';

interface FilesTabProps {
  cardId: string;
}

const FileInputSection: React.FC<{
  label: string;
  fileType: string;
  cardId: string;
  accept: string;
}> = ({ label, fileType, cardId, accept }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (fileInputRef.current?.files?.length) {
      const file = fileInputRef.current.files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);

      try {
        const response = await fetch(`http://localhost:3001/api/cards/${cardId}/upload-file`, {
          method: 'POST',
          body: formData,
        });
        if (response.ok) {
          alert(`${label} uploaded successfully!`);
          // We might want to refresh some state here to show the file is available
        } else {
          alert(`Failed to upload ${label}.`);
        }
      } catch (err) {
        alert(`Error uploading ${label}.`);
      }
    }
  };

  const handleView = () => {
    window.open(`http://localhost:3001/api/cards/${cardId}/file/${fileType}`, '_blank');
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete the ${label} file?`)) {
        try {
            const response = await fetch(`http://localhost:3001/api/cards/${cardId}/file/${fileType}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                alert(`${label} deleted successfully!`);
            } else {
                alert(`Failed to delete ${label}.`);
            }
        } catch (err) {
            alert(`Error deleting ${label}.`);
        }
    }
  };


  return (
    <div style={{ border: '1px solid #444', borderRadius: '4px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <p>{label}</p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <input type="file" ref={fileInputRef} accept={accept} style={{ display: 'none' }} onChange={handleUpload} />
        <button onClick={() => fileInputRef.current?.click()} style={{ padding: '8px 12px', background: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Upload
        </button>
        <button onClick={handleView} style={{ padding: '8px 12px', background: '#555', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          View
        </button>
        <button onClick={handleDelete} style={{ padding: '8px 12px', background: 'darkred', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Delete
        </button>
      </div>
    </div>
  );
};


const FilesTab: React.FC<FilesTabProps> = ({ cardId }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <FileInputSection label="Card HTML File" fileType="cardHtml" cardId={cardId} accept=".html" />
      <FileInputSection label="Creator Notes HTML" fileType="creatorNotesHtml" cardId={cardId} accept=".html" />
      <FileInputSection label="Favorite Chats JSON" fileType="chatsJson" cardId={cardId} accept=".json" />
    </div>
  );
};

export default FilesTab;