import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3001/api';

interface Collection {
    id: string;
    name: string;
    description: string;
}

const CollectionManagementPage: React.FC = () => {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCollections = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/collections`);
            if (!response.ok) throw new Error('Failed to fetch collections.');
            const data = await response.json();
            setCollections(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCollections();
    }, []);

    const handleCreate = async () => {
        const name = prompt('Enter new collection name:');
        if (name) {
            const description = prompt('Enter collection description (optional):');
            try {
                const response = await fetch(`${API_URL}/collections`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, description }),
                });
                if (!response.ok) throw new Error('Failed to create collection.');
                fetchCollections();
            } catch (err: any) {
                alert(`Error: ${err.message}`);
            }
        }
    };

    const handleEdit = async (collection: Collection) => {
        const name = prompt('Enter new name:', collection.name);
        const description = prompt('Enter new description:', collection.description);
        if (name) {
            try {
                const response = await fetch(`${API_URL}/collections/${collection.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, description }),
                });
                if (!response.ok) throw new Error('Failed to update collection.');
                fetchCollections();
            } catch (err: any) {
                alert(`Error: ${err.message}`);
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this collection? It will be removed from all cards.')) {
            try {
                const response = await fetch(`${API_URL}/collections/${id}`, {
                    method: 'DELETE',
                });
                if (!response.ok) throw new Error('Failed to delete collection.');
                fetchCollections();
            } catch (err: any) {
                alert(`Error: ${err.message}`);
            }
        }
    };

    if (isLoading) return <div className="p-8 text-white">Loading collections...</div>;
    if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-white">Collection Management</h1>
                <button
                    onClick={handleCreate}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                    Create New Collection
                </button>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                <ul className="space-y-2">
                    {collections.map(col => (
                        <li key={col.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
                            <div>
                                <h3 className="text-white font-bold">{col.name}</h3>
                                <p className="text-gray-400 text-sm">{col.description}</p>
                            </div>
                            <div className="space-x-2">
                                <button onClick={() => handleEdit(col)} className="text-sm text-blue-400 hover:text-blue-300">Edit</button>
                                <button onClick={() => handleDelete(col.id)} className="text-sm text-red-400 hover:text-red-300">Delete</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default CollectionManagementPage;