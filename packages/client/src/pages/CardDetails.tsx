import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FullScreenTextEditor from '../components/FullScreenTextEditor';
import TagInput from '../components/TagInput'; // Import the new TagInput component

interface Card {
  id: string;
  image: string;
  name: string;
  description: string;
  creator?: string;
  character?: string;
  scenario?: string;
  system?: string;
  tags: string[]; // Add tags property
  // Add other card properties as needed
}

const CardDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editableCard, setEditableCard] = useState<Card | null>(null);

  useEffect(() => {
    const fetchCardDetails = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/cards/${id}`);
        if (response.ok) {
          const data = await response.json();
          setCard(data);
          setEditableCard(data); // Initialize editable card with fetched data
        } else {
          setError('Card not found.');
          console.error('Failed to fetch card details:', response.statusText);
        }
      } catch (err) {
        setError('Error fetching card details.');
        console.error('Error fetching card details:', err);
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
          navigate('/'); // Redirect to gallery page
        } else {
          alert('Failed to delete card.');
          console.error('Failed to delete card:', response.statusText);
        }
      } catch (err) {
        alert('Error deleting card.');
        console.error('Error deleting card:', err);
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
        setCard(editableCard); // Update main card state
        setIsEditing(false); // Exit edit mode
        alert('Card updated successfully!');
      } else {
        alert('Failed to update card.');
        console.error('Failed to update card:', response.statusText);
      }
    } catch (err) {
      alert('Error updating card.');
      console.error('Error updating card:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditableCard(prev => (prev ? { ...prev, [name]: value } : null));
  };

  const handleTagsChange = (newTags: string[]) => {
    setEditableCard(prev => (prev ? { ...prev, tags: newTags } : null));
  };

  if (loading) {
    return <div className="text-center p-4">Loading card details...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  if (!card) {
    return <div className="text-center p-4">No card data available.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-end mb-4">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Delete
            </button>
          </>
        )}
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <img src={`http://localhost:3001/api/images/${card.image}`} alt={card.name} className="w-full h-auto rounded shadow-lg" />
        </div>
        <div className="md:w-2/3">
          {isEditing ? (
            <form>
              <div className="mb-4">
                <label htmlFor="name" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Name:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={editableCard?.name || ''}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <FullScreenTextEditor
                  label="Description"
                  value={editableCard?.description || ''}
                  onChange={(value) => handleChange({ target: { name: 'description', value } } as React.ChangeEvent<HTMLTextAreaElement>)}
                  placeholder="Enter description..."
                />
              </div>
              <div className="mb-4">
                <label htmlFor="creator" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Creator:</label>
                <input
                  type="text"
                  id="creator"
                  name="creator"
                  value={editableCard?.creator || ''}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <FullScreenTextEditor
                  label="Character"
                  value={editableCard?.character || ''}
                  onChange={(value) => handleChange({ target: { name: 'character', value } } as React.ChangeEvent<HTMLTextAreaElement>)}
                  placeholder="Enter character details..."
                />
              </div>
              <div className="mb-4">
                <FullScreenTextEditor
                  label="Scenario"
                  value={editableCard?.scenario || ''}
                  onChange={(value) => handleChange({ target: { name: 'scenario', value } } as React.ChangeEvent<HTMLTextAreaElement>)}
                  placeholder="Enter scenario details..."
                />
              </div>
              <div className="mb-4">
                <FullScreenTextEditor
                  label="System"
                  value={editableCard?.system || ''}
                  onChange={(value) => handleChange({ target: { name: 'system', value } } as React.ChangeEvent<HTMLTextAreaElement>)}
                  placeholder="Enter system details..."
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Tags:</label>
                <TagInput selectedTags={editableCard?.tags || []} onTagsChange={handleTagsChange} />
              </div>
            </form>
          ) : (
            <>
              <h1 className="text-3xl font-bold mb-4">{card.name}</h1>
              <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>Creator:</strong> {card.creator}</p>
              <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>Description:</strong> {card.description}</p>
              <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>Character:</strong> {card.character}</p>
              <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>Scenario:</strong> {card.scenario}</p>
              <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>System:</strong> {card.system}</p>
              {card.tags && card.tags.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Tags:</h3>
                  <div className="flex flex-wrap gap-2">
                    {card.tags.map((tag) => (
                      <span key={tag} className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-sm font-medium dark:bg-blue-900 dark:text-blue-100">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardDetails;