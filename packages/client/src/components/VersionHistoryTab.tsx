import React, { useEffect, useState } from 'react';
import JsonViewer from './JsonViewer';

interface VersionHistory {
    json: string[];
    images: string[];
    labels: { [key: string]: string };
}

interface VersionHistoryTabProps {
    cardId: string;
    onRevert: () => void; // Callback to notify parent to refetch data
}

const VersionHistoryTab: React.FC<VersionHistoryTabProps> = ({ cardId, onRevert }) => {
    const [history, setHistory] = useState<VersionHistory>({ json: [], images: [], labels: {} });
    const [loading, setLoading] = useState(true);
    const [preview, setPreview] = useState<{ type: 'json' | 'image'; content: any; filename: string; } | null>(null);
    const [editingVersion, setEditingVersion] = useState<{ id: string; type: 'json' | 'image' } | null>(null);
    const [labelText, setLabelText] = useState('');

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
            setPreview({ type, content: url, filename });
        } else {
            const response = await fetch(url);
            const data = await response.json();
            setPreview({ type, content: data, filename });
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

    const handleEditLabel = (version: string, type: 'json' | 'image') => {
        setEditingVersion({ id: version, type });
        setLabelText(history.labels[version] || '');
    };

    const handleSaveLabel = async () => {
        if (!editingVersion) return;

        try {
            const response = await fetch(`http://localhost:3001/api/cards/${cardId}/versions/label`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: editingVersion.id, label: labelText }),
            });

            if (response.ok) {
                // Optimistically update the UI
                setHistory(prev => ({
                    ...prev,
                    labels: { ...prev.labels, [editingVersion.id]: labelText }
                }));
                setEditingVersion(null);
                setLabelText('');
            } else {
                alert('Failed to save label.');
            }
        } catch (error) {
            console.error("Error saving label:", error);
            alert('An error occurred while saving the label.');
        }
    };


    if (loading) {
        return <div>Loading history...</div>;
    }

    return (
        <>
            {preview && (
                <div
                    onClick={() => setPreview(null)}
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        zIndex: 1000
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'relative',
                            background: '#2b2b2b', padding: '2rem', borderRadius: '8px',
                            width: '80vw', height: '90vh', display: 'flex', flexDirection: 'column'
                        }}
                    >
                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', alignItems: 'center', zIndex: 1001 }}>
                           {preview.type === 'json' && (
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(JSON.stringify(preview.content, null, 2));
                                        alert('Version data copied to clipboard!');
                                    }}
                                    aria-label="Copy JSON to clipboard"
                                    className="opacity-50 hover:opacity-100 transition-opacity"
                                    style={{ backgroundColor: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                                        <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                                    </svg>
                                </button>
                           )}
                            <button onClick={() => setPreview(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>
                        {preview.type === 'image' ? (
                            <img src={preview.content} alt="Version Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                            <JsonViewer
                                label={`Version Preview: ${new Date(parseInt(preview.filename.split('.')[0]) * 1000).toLocaleString()} ${history.labels[preview.filename] ? ` - ${history.labels[preview.filename]}` : ''}`}
                                data={preview.content}
                                isPoppedOut={true}
                            />
                        )}
                    </div>
                </div>
            )}
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
                            {history.json.filter(v => v !== 'version_labels.json').map((version, index, arr) => {
                                const date = new Date(parseInt(version.split('.')[0]) * 1000);
                                const isInitial = index === arr.length - 1;
                                return (
                                    <li key={version} style={{ background: '#333', padding: '0.75rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <span>
                                                {date.toLocaleString()}
                                                {isInitial && <span style={{ color: '#aaa', marginLeft: '0.5rem' }}>(Initial)</span>}
                                            </span>
                                            <div>
                                                <button onClick={() => handlePreview(version)} style={{ marginLeft: '0.5rem' }}>Preview</button>
                                                <button onClick={() => handleRevertJson(version)} style={{ marginLeft: '0.5rem' }}>Revert</button>
                                            </div>
                                        </div>
                                        {editingVersion?.id === version ? (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input
                                                    type="text"
                                                    value={labelText}
                                                    onChange={(e) => setLabelText(e.target.value)}
                                                    style={{ flex: 1, background: '#222', color: 'white', border: '1px solid #555', borderRadius: '4px', padding: '0.25rem' }}
                                                />
                                                <button onClick={handleSaveLabel}>Save</button>
                                                <button onClick={() => setEditingVersion(null)}>Cancel</button>
                                            </div>
                                        ) : (
                                            !isInitial && ( // Don't show edit for initial version
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ color: '#ccc', fontStyle: 'italic' }}>{history.labels[version] || 'No label'}</span>
                                                    <button onClick={() => handleEditLabel(version, 'json')}>Edit</button>
                                                </div>
                                            )
                                        )}
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
                            {history.images.filter(v => v !== 'version_labels.json').map((version, index, arr) => {
                                const date = new Date(parseInt(version.split('.')[0]) * 1000);
                                const isInitial = index === arr.length - 1;
                                return (
                                    <li key={version} style={{ background: '#333', padding: '0.75rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <span>
                                                {date.toLocaleString()}
                                                {isInitial && <span style={{ color: '#aaa', marginLeft: '0.5rem' }}>(Initial)</span>}
                                            </span>
                                            <div>
                                                <button onClick={() => handlePreview(version)} style={{ marginLeft: '0.5rem' }}>Preview</button>
                                                <button onClick={() => handleRevertImage(version)} style={{ marginLeft: '0.5rem' }}>Revert</button>
                                            </div>
                                        </div>
                                        {editingVersion?.id === version ? (
                                             <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input
                                                    type="text"
                                                    value={labelText}
                                                    onChange={(e) => setLabelText(e.target.value)}
                                                    style={{ flex: 1, background: '#222', color: 'white', border: '1px solid #555', borderRadius: '4px', padding: '0.25rem' }}
                                                />
                                                <button onClick={handleSaveLabel}>Save</button>
                                                <button onClick={() => setEditingVersion(null)}>Cancel</button>
                                            </div>
                                        ) : (
                                            !isInitial && ( // Don't show edit for initial version
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ color: '#ccc', fontStyle: 'italic' }}>{history.labels[version] || 'No label'}</span>
                                                    <button onClick={() => handleEditLabel(version, 'image')}>Edit</button>
                                                </div>
                                            )
                                        )}
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