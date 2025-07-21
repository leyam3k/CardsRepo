import React, { useEffect, useState } from 'react';
import { useCardStore } from '../store/cardStore';

const CollectionManagement: React.FC = () => {
  const { collections, fetchCollections, updateCollection, deleteCollection } = useCardStore((state) => ({
    collections: state.collections,
    fetchCollections: state.fetchCollections,
    updateCollection: state.updateCollection,
    deleteCollection: state.deleteCollection,
  }));

  const [editingCollection, setEditingCollection] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleEdit = (collection: string) => {
    setEditingCollection(collection);
    setNewCollectionName(collection);
  };

  const handleCancel = () => {
    setEditingCollection(null);
    setNewCollectionName('');
  };

  const handleSave = () => {
    if (editingCollection && newCollectionName) {
      updateCollection(editingCollection, newCollectionName);
      handleCancel();
    }
  };

  const handleDelete = (collection: string) => {
    if (window.confirm(`Are you sure you want to delete the collection "${collection}"? This will remove it from all cards.`)) {
      deleteCollection(collection);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 text-white">
      <h1 className="text-2xl font-bold mb-4">Collection Management</h1>
      <div className="bg-gray-800 p-4 rounded-lg">
        <ul>
          {collections.map((collection: string) => (
            <li key={collection} className="flex justify-between items-center p-2 border-b border-gray-700">
              {editingCollection === collection ? (
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="bg-gray-700 text-white p-1 rounded"
                />
              ) : (
                <span>{collection}</span>
              )}
              <div>
                {editingCollection === collection ? (
                  <>
                    <button onClick={handleSave} className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded mr-2">
                      Save
                    </button>
                    <button onClick={handleCancel} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded">
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEdit(collection)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded mr-2">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(collection)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded">
                      Delete
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CollectionManagement;