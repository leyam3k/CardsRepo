import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FullScreenTextEditor from '../components/FullScreenTextEditor';
import TagInput from '../components/TagInput';

interface Card {
  id: string;
  image: string;
  name: string;
  description: string;
  creator?: string;
  character?: string;
  scenario?: string;
  system?: string;
  tags: string[];
}

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
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editableCard, setEditableCard] = useState<Card | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    const fetchCardDetails = async () => {
      try {
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

    fetchCardDetails();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this card?')) {
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
        setCard(editableCard);
        setIsEditing(false);
        alert('Card updated successfully!');
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

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;
  if (!card) return <div style={{ padding: '2rem' }}>Card not found.</div>;

  const renderContent = () => {
    if (!isEditing) {
      return (
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>{card.name}</h1>
          <p><strong>Creator:</strong> {card.creator}</p>
          <p><strong>Description:</strong> {card.description}</p>
          <div style={{ marginTop: '1rem' }}>
            {card.tags.map(tag => (
              <span key={tag} style={{ backgroundColor: '#444', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', marginRight: '5px' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      );
    }
    
    // Editing mode content based on tab
    switch (activeTab) {
      case 'basic':
        return (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Name:</label>
              <input type="text" name="name" value={editableCard?.name || ''} onChange={handleChange} style={{ width: '100%', padding: '8px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Creator:</label>
              <input type="text" name="creator" value={editableCard?.creator || ''} onChange={handleChange} style={{ width: '100%', padding: '8px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <label>Tags:</label>
                <TagInput selectedTags={editableCard?.tags || []} onTagsChange={handleTagsChange} />
            </div>
          </div>
        );
      case 'details':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <FullScreenTextEditor
              label="Description"
              value={editableCard?.description || ''}
              onChange={(value) => handleChange({ target: { name: 'description', value } } as React.ChangeEvent<HTMLTextAreaElement>)}
            />
            <FullScreenTextEditor
              label="Character/Personality"
              value={editableCard?.character || ''}
              onChange={(value) => handleChange({ target: { name: 'character', value } } as React.ChangeEvent<HTMLTextAreaElement>)}
            />
            <FullScreenTextEditor
              label="Scenario"
              value={editableCard?.scenario || ''}
              onChange={(value) => handleChange({ target: { name: 'scenario', value } } as React.ChangeEvent<HTMLTextAreaElement>)}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 48px)', padding: '1rem' }}>
      {/* Left Panel: Avatar */}
      <div style={{ flex: '0 0 300px', paddingRight: '1rem' }}>
        <img src={`http://localhost:3001/api/images/${card.image}`} alt={card.name} style={{ width: '100%', borderRadius: '8px' }} />
        <div style={{ marginTop: '1rem' }}>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} style={{ width: '100%', padding: '10px', background: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
          ) : (
            <>
              <button onClick={handleSave} style={{ width: '100%', padding: '10px', background: 'green', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '0.5rem' }}>Save</button>
              <button onClick={() => setIsEditing(false)} style={{ width: '100%', padding: '10px', background: '#555', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            </>
          )}
          <button onClick={handleDelete} style={{ width: '100%', padding: '10px', background: 'darkred', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '0.5rem' }}>Delete</button>
        </div>
      </div>

      {/* Right Panel: Tabs and Content */}
      <div style={{ flex: 1, background: '#2b2b2b', padding: '1.5rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {isEditing && (
          <div style={{ borderBottom: '1px solid #444', paddingBottom: '0.5rem' }}>
            <TabButton label="Basic Info" isActive={activeTab === 'basic'} onClick={() => setActiveTab('basic')} />
            <TabButton label="Details" isActive={activeTab === 'details'} onClick={() => setActiveTab('details')} />
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default CardDetails;