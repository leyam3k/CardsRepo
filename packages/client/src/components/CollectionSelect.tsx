import React, { useState } from 'react';

interface Collection {
    id: string;
    name: string;
}

interface CollectionSelectProps {
    availableCollections: Collection[];
    selectedCollectionIds: string[];
    onChange: (selectedIds: string[]) => void;
}

const CollectionSelect: React.FC<CollectionSelectProps> = ({
    availableCollections,
    selectedCollectionIds,
    onChange,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (collectionId: string) => {
        const newSelection = selectedCollectionIds.includes(collectionId)
            ? selectedCollectionIds.filter(id => id !== collectionId)
            : [...selectedCollectionIds, collectionId];
        onChange(newSelection);
    };

    const selectedCollectionNames = availableCollections
        .filter(c => selectedCollectionIds.includes(c.id))
        .map(c => c.name)
        .join(', ');

    return (
        <div className="relative w-full">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            >
                <span className="block truncate text-white">
                    {selectedCollectionNames || 'Select collections...'}
                </span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </span>
            </button>

            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-gray-700 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {availableCollections.map((collection) => (
                        <div
                            key={collection.id}
                            onClick={() => handleSelect(collection.id)}
                            className="text-white cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-600"
                        >
                            <span className="font-normal block truncate">{collection.name}</span>
                            {selectedCollectionIds.includes(collection.id) && (
                                <span className="text-purple-500 absolute inset-y-0 right-0 flex items-center pr-4">
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CollectionSelect;