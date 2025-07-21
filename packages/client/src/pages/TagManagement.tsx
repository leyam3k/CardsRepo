import React, { useEffect, useState } from 'react';
import { useCardStore } from '../store/cardStore';

const TagManagement: React.FC = () => {
 const { tags, fetchTags, updateTag, deleteTag } = useCardStore((state) => ({
   tags: state.tags,
   fetchTags: state.fetchTags,
   updateTag: state.updateTag,
   deleteTag: state.deleteTag,
 }));

 const [editingTag, setEditingTag] = useState<string | null>(null);
 const [newTagName, setNewTagName] = useState('');

 useEffect(() => {
   console.log('TagManagement: useEffect triggered, fetching tags...');
   fetchTags();
 }, []); // Empty dependency array to run only once on mount

 // Log tags whenever they change (kept for debugging, can be removed later)
 useEffect(() => {
   console.log('TagManagement: Tags updated in store:', tags);
 }, [tags]);

 const handleEdit = (tag: string) => {
   setEditingTag(tag);
   setNewTagName(tag);
 };

 const handleCancel = () => {
   setEditingTag(null);
   setNewTagName('');
 };

 const handleSave = () => {
   if (editingTag && newTagName) {
     console.log(`TagManagement: Saving tag "${editingTag}" as "${newTagName}"`);
     updateTag(editingTag, newTagName);
     handleCancel();
   }
 };

 const handleDelete = (tag: string) => {
   if (window.confirm(`Are you sure you want to delete the tag "${tag}"? This will remove it from all cards.`)) {
     console.log(`TagManagement: Deleting tag "${tag}"`);
     deleteTag(tag);
   }
 };

 console.log('TagManagement: Rendering with tags:', tags);

 return (
   <div className="p-4 sm:p-6 lg:p-8 text-white" style={{ backgroundColor: '#2b2b2b' }}> {/* Added explicit background */}
     <h1 className="text-2xl font-bold mb-4">Tag Management</h1>
     <div className="bg-gray-800 p-4 rounded-lg">
       {tags.length === 0 ? (
         <p>No tags found. Add some tags to your cards to see them here.</p>
       ) : (
         <ul>
           {tags.map((tag: string) => (
             <li key={tag} className="flex justify-between items-center p-2 border-b border-gray-700">
               {editingTag === tag ? (
                 <input
                   type="text"
                   value={newTagName}
                   onChange={(e) => setNewTagName(e.target.value)}
                   className="bg-gray-700 text-white p-1 rounded"
                 />
               ) : (
                 <span>{tag}</span>
               )}
               <div>
                 {editingTag === tag ? (
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
                     <button onClick={() => handleEdit(tag)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded mr-2">
                       Edit
                     </button>
                     <button onClick={() => handleDelete(tag)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded">
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

export default TagManagement;