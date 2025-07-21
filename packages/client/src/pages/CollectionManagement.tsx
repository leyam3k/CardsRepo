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
   console.log('CollectionManagement: useEffect triggered, fetching collections...');
   fetchCollections();
 }, []); // Empty dependency array to run only once on mount

 // Log collections whenever they change (kept for debugging, can be removed later)
 useEffect(() => {
   console.log('CollectionManagement: Collections updated in store:', collections);
 }, [collections]);

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
     console.log(`CollectionManagement: Saving collection "${editingCollection}" as "${newCollectionName}"`);
     updateCollection(editingCollection, newCollectionName);
     handleCancel();
   }
 };

 const handleDelete = (collection: string) => {
   if (window.confirm(`Are you sure you want to delete the collection "${collection}"? This will remove it from all cards.`)) {
     console.log(`CollectionManagement: Deleting collection "${collection}"`);
     deleteCollection(collection);
   }
 };

 console.log('CollectionManagement: Rendering with collections:', collections);

 return (
   <div className="p-4 sm:p-6 lg:p-8 text-white" style={{ backgroundColor: '#2b2b2b' }}> {/* Added explicit background */}
     <h1 className="text-2xl font-bold mb-4">Collection Management</h1>
     <div className="bg-gray-800 p-4 rounded-lg">
       {collections.length === 0 ? (
         <p>No collections found. Add some collections to your cards to see them here.</p>
       ) : (
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
       )}
     </div>
   </div>
 );
};

export default CollectionManagement;