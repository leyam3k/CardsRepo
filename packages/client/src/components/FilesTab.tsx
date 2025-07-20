import React, { useRef, useState, useEffect, useCallback } from 'react';

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
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const fetchFiles = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/cards/${cardId}/files/${fileType}`);
      if (response.ok) {
        const files = await response.json();
        setUploadedFiles(files);
      }
    } catch (err) {
      console.error(`Error fetching files for ${fileType}:`, err);
    }
  }, [cardId, fileType]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUpload = async () => {
    if (fileInputRef.current?.files?.length) {
      const file = fileInputRef.current.files[0];

      if (uploadedFiles.includes(file.name)) {
        if (!window.confirm(`A file named "${file.name}" already exists. Do you want to overwrite it?`)) {
          return; // User cancelled the overwrite
        }
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);

      try {
        const response = await fetch(`http://localhost:3001/api/cards/${cardId}/upload-file`, {
          method: 'POST',
          body: formData,
        });
        if (response.ok) {
          alert(`${file.name} uploaded successfully!`);
          fetchFiles(); // Refresh the file list
        } else {
          alert(`Failed to upload ${file.name}.`);
        }
      } catch (err) {
        alert(`Error uploading ${file.name}.`);
      } finally {
        // Reset the file input so the user can select the same file again
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleView = (filename: string) => {
    window.open(`http://localhost:3001/api/cards/${cardId}/file/${fileType}/${filename}?action=view`, '_blank');
  };

  const handleDownload = (filename: string) => {
    window.open(`http://localhost:3001/api/cards/${cardId}/file/${fileType}/${filename}?action=download`, '_blank');
  };

  const handleDelete = async (filename: string) => {
    if (window.confirm(`Are you sure you want to delete "${filename}"?`)) {
        try {
            const response = await fetch(`http://localhost:3001/api/cards/${cardId}/file/${fileType}/${filename}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                alert(`${filename} deleted successfully!`);
                fetchFiles(); // Refresh the file list
            } else {
                alert(`Failed to delete ${filename}.`);
            }
        } catch (err) {
            alert(`Error deleting ${filename}.`);
        }
    }
  };

  return (
    <div style={{ border: '1px solid #444', borderRadius: '4px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
        <div>
          <input type="file" ref={fileInputRef} accept={accept} style={{ display: 'none' }} onChange={handleUpload} />
          <button onClick={() => fileInputRef.current?.click()} style={{ padding: '8px 12px', background: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Upload New
          </button>
        </div>
      </div>
      {uploadedFiles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid #444', paddingTop: '1rem' }}>
            {uploadedFiles.map(filename => (
                <div key={filename} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#333', padding: '0.5rem', borderRadius: '4px' }}>
                    <span>{filename}</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleView(filename)} style={{ padding: '6px 10px', background: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            View
                        </button>
                        <button onClick={() => handleDownload(filename)} style={{ padding: '6px 10px', background: '#555', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Download
                        </button>
                        <button onClick={() => handleDelete(filename)} style={{ padding: '6px 10px', background: 'darkred', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Delete
                        </button>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

const FilesTab: React.FC<FilesTabProps> = ({ cardId }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <FileInputSection label="Card HTML File" fileType="cardHtml" cardId={cardId} accept=".html" />
      <FileInputSection label="Creator Notes HTML" fileType="creatorNotesHtml" cardId={cardId} accept=".html" />
      <FileInputSection label="Favorite Chats" fileType="chatsJson" cardId={cardId} accept=".json,.jsonl" />
    </div>
  );
};

export default FilesTab;