import React, { useEffect, useState } from 'react';
import JsonViewer from './JsonViewer';

interface VersionHistory {
    json: string[];
    images: string[];
}

interface VersionHistoryTabProps {
    cardId: string;
    onRevert: () => void; // Callback to notify parent to refetch data
}

const PreviewModal: React.FC<{ content: any; type: 'json' | 'image'; onClose: () => void }> = ({ content, type, onClose }) => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
        <div style={{ background: '#2b2b2b', padding: '2rem', borderRadius: '8px', maxWidth: '80vw', maxHeight: '80vh', overflow: 'auto', position: 'relative' }}>
            <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            {type === 'image' ? (
                <img src={content} alt="Version Preview" style={{ maxWidth: '100%', maxHeight: '100%' }} />
            ) : (
                <JsonViewer label="Version Preview" data={content} />
            )}
        </div>
    </div>
);


const VersionHistoryTab: React.FC<VersionHistoryTabProps> = ({ cardId, onRevert }) => {
    const [history, setHistory] = useState<VersionHistory>({ json: [], images: [] });
    const [loading, setLoading] = useState(true);
    const [preview, setPreview] = useState<{ type: 'json' | 'image'; content: any } | null>(null);

    const fetchHistory = async () => {
        if (!cardId) return;
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3001/api/cards/${cardId}/versions`);
            if (response.ok) {
                const data = await response.json();
                setHistory(data);
            }
        } catch (error) {
            console.error("Failed to fetch version history", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [cardId]);

    const handlePreview = async (filename: string) => {
        const type = filename.endsWith('.png') ? 'image' : 'json';
        const url = `http://localhost:3001/api/cards/${cardId}/versions/${filename}`;
        
        if (type === 'image') {
            setPreview({ type, content: url });
        } else {
            const response = await fetch(url);
            const data = await response.json();
            setPreview({ type, content: data });
        }
    };

    const handleRevertJson = async (filename: string) => {
        if (!window.confirm("Are you sure you want to revert to this text version? This will create a new version of the current state before reverting.")) {
            return;
        }
        try {
            const response = await fetch(`http://localhost:3001/api/cards/${cardId}/versions/${filename}`);
            const versionData = await response.json();

            const revertResponse = await fetch(`http://localhost:3001/api/cards/${cardId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(versionData),
            });

            if (revertResponse.ok) {
                alert('Card reverted successfully!');
                fetchHistory(); // Refresh history
                onRevert(); // Tell parent to refetch card data
            } else {
                alert('Failed to revert card.');
            }
        } catch (error) {
            console.error("Error reverting card:", error);
            alert('An error occurred while reverting.');
        }
    };
    
    const handleRevertImage = async (filename: string) => {
        if (!window.confirm("Are you sure you want to revert to this image? This will create a new version of the current avatar before reverting.")) {
            return;
        }
        try {
            const response = await fetch(`http://localhost:3001/api/cards/${cardId}/versions/${filename}`);
            const imageBlob = await response.blob();
            
            const formData = new FormData();
            formData.append('avatar', imageBlob, filename);

            const revertResponse = await fetch(`http://localhost:3001/api/cards/${cardId}/update-avatar`, {
                method: 'POST',
                body: formData,
            });

            if (revertResponse.ok) {
                alert('Avatar reverted successfully!');
                fetchHistory(); // Refresh history
                onRevert(); // Tell parent to refetch card data
            } else {
                alert('Failed to revert avatar.');
            }
        } catch (error) {
            console.error("Error reverting avatar:", error);
            alert('An error occurred while reverting.');
        }
    };


    if (loading) {
        return <div>Loading history...</div>;
    }

    return (
        <>
            {preview && <PreviewModal content={preview.content} type={preview.type} onClose={() => setPreview(null)} />}
            <div style={{ display: 'flex', gap: '2rem' }}>
                {/* JSON Versions */}
                <div style={{ flex: 1 }}>
                    <h3 style={{ borderBottom: '1px solid #444', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                        Text Data History ({history.json.length})
                    </h3>
                    {history.json.length === 0 ? (
                        <p>No text versions saved.</p>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '400px', overflowY: 'auto' }}>
                            {history.json.map((version) => {
                                const date = new Date(parseInt(version.split('.')[0]) * 1000);
                                return (
                                    <li key={version} style={{ background: '#333', padding: '0.75rem', borderRadius: '4px', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>{date.toLocaleString()}</span>
                                        <div>
                                            <button onClick={() => handlePreview(version)} style={{ marginLeft: '0.5rem' }}>Preview</button>
                                            <button onClick={() => handleRevertJson(version)} style={{ marginLeft: '0.5rem' }}>Revert</button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* Image Versions */}
                <div style={{ flex: 1 }}>
                    <h3 style={{ borderBottom: '1px solid #444', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                        Image History ({history.images.length})
                    </h3>
                    {history.images.length === 0 ? (
                        <p>No image versions saved.</p>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '400px', overflowY: 'auto' }}>
                            {history.images.map((version) => {
                                const date = new Date(parseInt(version.split('.')[0]) * 1000);
                                return (
                                    <li key={version} style={{ background: '#333', padding: '0.75rem', borderRadius: '4px', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>{date.toLocaleString()}</span>
                                        <div>
                                            <button onClick={() => handlePreview(version)} style={{ marginLeft: '0.5rem' }}>Preview</button>
                                            <button onClick={() => handleRevertImage(version)} style={{ marginLeft: '0.5rem' }}>Revert</button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </>
    );
};

export default VersionHistoryTab;