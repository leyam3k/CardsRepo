import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3001/api';

const TagManagementPage: React.FC = () => {
    const [tags, setTags] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTags = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/tags`);
            if (!response.ok) {
                throw new Error('Failed to fetch tags.');
            }
            const data = await response.json();
            setTags(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTags();
    }, []);

    const handleRename = async (oldName: string) => {
        const newName = prompt(`Enter new name for "${oldName}":`, oldName);
        if (newName && newName !== oldName) {
            try {
                const response = await fetch(`${API_URL}/tags/rename`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ oldName, newName }),
                });
                if (!response.ok) throw new Error('Failed to rename tag.');
                alert('Tag renamed successfully!');
                fetchTags(); // Refresh the list
            } catch (err: any) {
                alert(`Error: ${err.message}`);
            }
        }
    };

    const handleDelete = async (name: string) => {
        if (window.confirm(`Are you sure you want to delete the tag "${name}"? This will remove it from all cards.`)) {
            try {
                const response = await fetch(`${API_URL}/tags/${name}`, {
                    method: 'DELETE',
                });
                if (!response.ok) throw new Error('Failed to delete tag.');
                alert('Tag deleted successfully!');
                fetchTags(); // Refresh the list
            } catch (err: any) {
                alert(`Error: ${err.message}`);
            }
        }
    };

    const handleMerge = async () => {
        if (selectedTags.length < 2) {
            alert('Please select at least two tags to merge.');
            return;
        }
        const destinationTag = prompt(`Enter the destination tag to merge ${selectedTags.join(', ')} into:`);
        if (destinationTag) {
            if (window.confirm(`Are you sure you want to merge [${selectedTags.join(', ')}] into "${destinationTag}"?`)) {
                try {
                    const response = await fetch(`${API_URL}/tags/merge`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sourceTags: selectedTags, destinationTag }),
                    });
                    if (!response.ok) throw new Error('Failed to merge tags.');
                    alert('Tags merged successfully!');
                    setSelectedTags([]);
                    fetchTags(); // Refresh the list
                } catch (err: any) {
                    alert(`Error: ${err.message}`);
                }
            }
        }
    };

    const handleTagSelect = (tagName: string) => {
        setSelectedTags(prev => 
            prev.includes(tagName) 
                ? prev.filter(t => t !== tagName) 
                : [...prev, tagName]
        );
    };

    if (isLoading) return <div className="p-8 text-white">Loading tags...</div>;
    if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-white">Tag Management</h1>
                <button
                    onClick={handleMerge}
                    disabled={selectedTags.length < 2}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-purple-700"
                >
                    Merge Selected ({selectedTags.length})
                </button>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                <ul className="space-y-2">
                    {tags.map(tag => (
                        <li key={tag} className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
                            <div className="flex items-center">
                                <input 
                                    type="checkbox"
                                    checked={selectedTags.includes(tag)}
                                    onChange={() => handleTagSelect(tag)}
                                    className="mr-4 h-5 w-5 rounded bg-gray-900 border-gray-600 text-purple-600 focus:ring-purple-500"
                                />
                                <span className="text-white font-medium">{tag}</span>
                            </div>
                            <div className="space-x-2">
                                <button onClick={() => handleRename(tag)} className="text-sm text-blue-400 hover:text-blue-300">Rename</button>
                                <button onClick={() => handleDelete(tag)} className="text-sm text-red-400 hover:text-red-300">Delete</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default TagManagementPage;