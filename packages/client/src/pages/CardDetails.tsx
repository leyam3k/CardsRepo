import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FullScreenTextEditor from '../components/FullScreenTextEditor';
import TagInput from '../components/TagInput';
import TextArrayEditor from '../components/TextArrayEditor';
import JsonViewer from '../components/JsonViewer';
import CharacterBookEditor from '../components/CharacterBookEditor';
import ToolTab from '../components/ToolTab';
import FilesTab from '../components/FilesTab';
import VersionHistoryTab from '../components/VersionHistoryTab';
import { useCardStore, type Card, type Lorebook } from '../store/cardStore';

const convertToSpec = (card: Card, specVersion: 'v2' | 'v3' | 'max') => {
  // Create a deep copy to avoid modifying the original object
  const cardData = JSON.parse(JSON.stringify(card));

  // Remove app-specific fields that are not part of the spec's 'data' object
  const {
    id,
    imageUrl,
    originalFilename,
    isCopy,
    ...data
  } = cardData;

  if (specVersion === 'v2') {
    // V2 spec does not include these fields in the data block
    delete data.nickname;
    delete data.group_only_greetings;
    delete data.assets;
    delete data.creator_notes_multilingual;
    delete data.source;
    delete data.creation_date;
    delete data.modification_date;

    return {
      spec: 'chara_card_v2',
      spec_version: '2.0',
      data: {
        ...data,
        alternate_greetings: data.alternate_greetings || [],
        tags: data.tags || [],
        extensions: data.extensions || {},
      },
    };
  }

  // For v3 and max, we use the same structure for now
  return {
    spec: "chara_card_v3",
    spec_version: "3.0",
    data: {
        ...data,
        // Ensure required fields that might be empty are present
        alternate_greetings: data.alternate_greetings || [],
        group_only_greetings: data.group_only_greetings || [],
        tags: data.tags || [],
    },
    metadata: {
      tool: {
        name: "CardsRepo",
        version: "0.1.0", // Replace with actual app version if available
      },
      modified: Date.now(),
    },
  };
};

const TabButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: '10px 15px',
      border: 'none',
      borderBottom: isActive ? '2px solid #0078d4' : '2px solid transparent',
      background: 'transparent',
      color: 'white',
      cursor: 'pointer',
      fontSize: '1rem',
    }}
  >
    {label}
  </button>
);

const CardDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fetchAvailableTags = useCardStore((state) => state.fetchAvailableTags);
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editableCard, setEditableCard] = useState<Card | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [specVersion, setSpecVersion] = useState('v3');
  const [toolTabSelectedTemplateId, setToolTabSelectedTemplateId] = useState<string | null>(null);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

  const fetchCardDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/cards/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCard(data);
        setEditableCard(data);
      } else {
        setError('Card not found.');
      }
    } catch (err) {
      setError('Error fetching card details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchDetails = async () => {
        await fetchCardDetails();
    };
    fetchDetails();
  }, [id]);

  const handleRevert = () => {
    // This function will be passed to the child to trigger a refetch
    // We fetch details and then append a timestamp to the image URL to bust the cache
    fetchCardDetails().then(() => {
        setCard(prev => {
            if (!prev) return null;
            return { ...prev, imageUrl: `${prev.imageUrl.split('?')[0]}?t=${new Date().getTime()}` };
        });
    });
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this card permanently?')) {
      try {
        const response = await fetch(`http://localhost:3001/api/cards/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          alert('Card deleted successfully!');
          navigate('/');
        } else {
          alert('Failed to delete card.');
        }
      } catch (err) {
        alert('Error deleting card.');
      }
    }
  };

  const handleDuplicate = async () => {
    if (!id) return;
    if (window.confirm('Are you sure you want to duplicate this card?')) {
      try {
        const response = await fetch(`http://localhost:3001/api/cards/${id}/duplicate`, {
          method: 'POST',
        });
        if (response.ok) {
          const { card: newCard } = await response.json();
          alert('Card duplicated successfully!');
          navigate(`/card/${newCard.id}`);
        } else {
          alert('Failed to duplicate card.');
        }
      } catch (err) {
        alert('Error duplicating card.');
      }
    }
  };

  const handleDownloadJson = () => {
    if (!card) return;
    const specCard = convertToSpec(card, specVersion as any);
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(specCard, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `${card.name || 'character'}.json`;
    link.click();
  };

  const handleDownloadPng = async () => {
      // For now, we just download the existing avatar.
      // In a future phase, we would embed the JSON data into the PNG before downloading.
      if (!card?.imageUrl) return;
      const response = await fetch(`http://localhost:3001${card.imageUrl}`);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${card.name || 'character'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };


  const handleSave = async () => {
    if (!editableCard) return;

    try {
      const response = await fetch(`http://localhost:3001/api/cards/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editableCard),
      });

      if (response.ok) {
        const updatedCard = await response.json();
        setCard(updatedCard.card);
        setEditableCard(updatedCard.card);
        // Don't exit edit mode automatically
        // setIsEditing(false);
        alert('Card saved successfully and new version entry created!');
        fetchAvailableTags(); // Re-fetch tags to update the global list
      } else {
        alert('Failed to update card.');
      }
    } catch (err) {
      alert('Error updating card.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditableCard(prev => (prev ? { ...prev, [name]: value } : null));
  };

  const handleTagsChange = (newTags: string[]) => {
    setEditableCard(prev => (prev ? { ...prev, tags: newTags } : null));
  };

  const handleArrayChange = (name: keyof Card, values: string[]) => {
    setEditableCard(prev => (prev ? { ...prev, [name]: values } : null));
  };

  const handleBookChange = (newBook: Lorebook) => {
    setEditableCard(prev => (prev ? { ...prev, character_book: newBook } : null));
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;
  if (!card || !editableCard) return <div style={{ padding: '2rem' }}>Card not found.</div>;

  const renderContent = () => {
    const displayCard = isEditing ? editableCard : card;
    if (!displayCard) return null;

    if (!isEditing) {
      return (
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            {displayCard.name}
            {displayCard.isCopy && <span style={{ color: '#aaa', marginLeft: '1rem', fontSize: '1.2rem', fontWeight: 'normal' }}>(Copy)</span>}
          </h1>
          <p><strong>Creator:</strong> {displayCard.creator}</p>
          <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            {displayCard.tags.map(tag => (
              <span key={tag} style={{ backgroundColor: '#444', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', marginRight: '5px' }}>
                {tag}
              </span>
            ))}
          </div>
          <p><strong>Description:</strong> {displayCard.description}</p>
          <p><strong>Personality:</strong> {displayCard.personality}</p>
          <p><strong>Scenario:</strong> {displayCard.scenario}</p>
          {/* Add other read-only fields here */}
        </div>
      );
    }
    
    // Editing mode content based on tab
    switch (activeTab) {
      case 'basic':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{ flex: '0 0 120px' }}>Name:</label>
              <input type="text" name="name" value={editableCard.name || ''} onChange={handleChange} style={{ flex: 1, padding: '8px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{ flex: '0 0 120px' }}>Creator:</label>
              <input type="text" name="creator" value={editableCard.creator || ''} onChange={handleChange} style={{ flex: 1, padding: '8px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }} />
            </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{ flex: '0 0 120px' }}>Nickname:</label>
                <input type="text" name="nickname" value={editableCard.nickname || ''} onChange={handleChange} style={{ flex: 1, padding: '8px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{ flex: '0 0 120px' }}>Character Version:</label>
                <input type="text" name="character_version" value={editableCard.character_version || ''} onChange={handleChange} style={{ flex: 1, padding: '8px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }} />
            </div>
             <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <label style={{ flex: '0 0 120px', paddingTop: '8px' }}>Tags:</label>
                <div style={{ flex: 1 }}>
                    <TagInput selectedTags={editableCard.tags || []} onTagsChange={handleTagsChange} />
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{ flex: '0 0 120px' }}>Language:</label>
              <input type="text" name="language" value={editableCard.language || ''} onChange={handleChange} style={{ flex: 1, padding: '8px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <label style={{ flex: '0 0 120px', paddingTop: '8px' }}>URL/Link:</label>
              <textarea name="url" value={editableCard.url || ''} onChange={handleChange} style={{ flex: 1, padding: '8px', backgroundColor: '#333', color: 'white', border: '1px solid #555', minHeight: '80px', resize: 'vertical' }} />
            </div>
          </div>
        );
      case 'details':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <FullScreenTextEditor label="Description" value={editableCard.description || ''} onChange={(value) => handleChange({ target: { name: 'description', value } } as React.ChangeEvent<HTMLTextAreaElement>)} />
                <FullScreenTextEditor label="Personality" value={editableCard.personality || ''} onChange={(value) => handleChange({ target: { name: 'personality', value } } as React.ChangeEvent<HTMLTextAreaElement>)} />
                <FullScreenTextEditor label="Scenario" value={editableCard.scenario || ''} onChange={(value) => handleChange({ target: { name: 'scenario', value } } as React.ChangeEvent<HTMLTextAreaElement>)} />
                <FullScreenTextEditor label="First Message" value={editableCard.first_mes || ''} onChange={(value) => handleChange({ target: { name: 'first_mes', value } } as React.ChangeEvent<HTMLTextAreaElement>)} />
                <FullScreenTextEditor label="Message Example" value={editableCard.mes_example || ''} onChange={(value) => handleChange({ target: { name: 'mes_example', value } } as React.ChangeEvent<HTMLTextAreaElement>)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <TextArrayEditor label="Alternate Greetings" values={editableCard.alternate_greetings || []} onChange={(values) => handleArrayChange('alternate_greetings', values)} />
                <TextArrayEditor label="Group Only Greetings" values={editableCard.group_only_greetings || []} onChange={(values) => handleArrayChange('group_only_greetings', values)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <FullScreenTextEditor label="System Prompt" value={editableCard.system_prompt || ''} onChange={(value) => handleChange({ target: { name: 'system_prompt', value } } as React.ChangeEvent<HTMLTextAreaElement>)} />
                <FullScreenTextEditor label="Post History Instructions" value={editableCard.post_history_instructions || ''} onChange={(value) => handleChange({ target: { name: 'post_history_instructions', value } } as React.ChangeEvent<HTMLTextAreaElement>)} />
                <FullScreenTextEditor label="Creator Notes" value={editableCard.creator_notes || ''} onChange={(value) => handleChange({ target: { name: 'creator_notes', value } } as React.ChangeEvent<HTMLTextAreaElement>)} />
            </div>
          </div>
        );
      case 'advanced':
       return (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           <JsonViewer label="Assets (JSON Array)" data={editableCard.assets} />
           <JsonViewer label="Creator Notes Multilingual (JSON Object)" data={editableCard.creator_notes_multilingual} />
           <JsonViewer label="Extensions (JSON Object)" data={editableCard.extensions} />
         </div>
       );
      case 'book':
        return (
            <CharacterBookEditor
                book={editableCard.character_book}
                onChange={handleBookChange}
            />
        );
      case 'tool':
        return <ToolTab card={editableCard} selectedTemplateId={toolTabSelectedTemplateId} setSelectedTemplateId={setToolTabSelectedTemplateId} />;
      case 'files':
        return <FilesTab cardId={editableCard.id} />;
      case 'history':
        return <VersionHistoryTab cardId={editableCard.id} onRevert={handleRevert} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 48px)', padding: '1rem', gap: '1rem' }}>
      {/* Left Panel: Avatar & Actions */}
      <div style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', backgroundColor: '#202020', borderRadius: '8px' }}>
            <img
                src={`http://localhost:3001${card.imageUrl}`}
                alt={card.name}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                }}
            />
            <button
                onClick={() => setIsImagePreviewOpen(true)}
                aria-label="Zoom image"
                style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'transparent',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    opacity: 0.6,
                    transition: 'opacity 0.2s',
                    padding: '4px' // Added padding
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z"/>
                </svg>
            </button>
        </div>
        
        {/* Card Info Box */}
        <div style={{ background: '#2b2b2b', padding: '1rem', borderRadius: '8px', color: '#ccc', fontSize: '0.9rem' }}>
            <p><strong>Filename:</strong> {card.originalFilename || 'N/A'}</p>
            {/* <p><strong>Spec Version:</strong> {card.spec || 'N/A'}</p> */}
            <hr style={{ border: '1px solid #444', margin: '0.5rem 0' }} />
            <p><strong>Imported:</strong> {card.creation_date ? new Date(card.creation_date * 1000).toLocaleString() : 'N/A'}</p>
            <p><strong>Modified:</strong> {card.modification_date ? new Date(card.modification_date * 1000).toLocaleString() : 'N/A'}</p>
        </div>
        
        {/* Spec Version Selector */}
        <div style={{ background: '#2b2b2b', padding: '1rem', borderRadius: '8px' }}>
            <label htmlFor="spec-version-selector" style={{ display: 'block', marginBottom: '0.5rem' }}>Export Spec:</label>
            <select
                id="spec-version-selector"
                value={specVersion}
                onChange={(e) => setSpecVersion(e.target.value)}
                style={{ width: '100%', padding: '8px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
            >
                <option value="v2">V2</option>
                <option value="v3">V3 (Default)</option>
                <option value="max">Max Compatible</option>
            </select>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {!isEditing ? (
                <button onClick={() => setIsEditing(true)} style={{ padding: '10px', background: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
            ) : (
                <>
                    <button onClick={handleSave} style={{ padding: '10px', background: 'green', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
                    <button onClick={() => { setIsEditing(false); setEditableCard(card); }} style={{ padding: '10px', background: '#555', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                </>
            )}
            <button onClick={handleDownloadPng} style={{ padding: '10px', background: '#1a4a7e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Download PNG</button>
            <button onClick={handleDownloadJson} style={{ padding: '10px', background: '#1a4a7e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Download JSON</button>
            <button onClick={handleDuplicate} style={{ padding: '10px', background: '#7e571a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Duplicate Card</button>
            <button onClick={handleDelete} style={{ padding: '10px', background: 'darkred', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete Card</button>
        </div>
      </div>

      {/* Right Panel: Tabs and Content */}
      <div style={{ flex: 1, background: '#2b2b2b', padding: '1.5rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {isEditing && (
          <div style={{ borderBottom: '1px solid #444', paddingBottom: '0.5rem' }}>
            <TabButton label="Basic Info" isActive={activeTab === 'basic'} onClick={() => setActiveTab('basic')} />
            <TabButton label="Details" isActive={activeTab === 'details'} onClick={() => setActiveTab('details')} />
            <TabButton label="Advanced" isActive={activeTab === 'advanced'} onClick={() => setActiveTab('advanced')} />
            <TabButton label="Character Book" isActive={activeTab === 'book'} onClick={() => setActiveTab('book')} />
            <TabButton label="Files" isActive={activeTab === 'files'} onClick={() => setActiveTab('files')} />
            <TabButton label="Tool" isActive={activeTab === 'tool'} onClick={() => setActiveTab('tool')} />
            <TabButton label="Version History" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingRight: '1rem' }}>
            {renderContent()}
        </div>
      </div>

      {isImagePreviewOpen && (
        <div
            onClick={() => setIsImagePreviewOpen(false)}
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.85)',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                zIndex: 1000
            }}
        >
            <img
                onClick={(e) => e.stopPropagation()}
                src={`http://localhost:3001${card.imageUrl}`}
                alt="Preview"
                style={{
                    maxHeight: '90vh',
                    maxWidth: '90vw',
                    objectFit: 'contain',
                    borderRadius: '8px'
                }}
            />
        </div>
      )}
    </div>
  );
};

export default CardDetails;