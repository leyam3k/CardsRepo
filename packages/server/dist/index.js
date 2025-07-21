"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const Png_1 = require("./utils/Png");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const upload = (0, multer_1.default)({
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
});
const dataDir = path_1.default.join(__dirname, '../data');
const cardsDir = path_1.default.join(dataDir, 'cards');
const publicDir = path_1.default.join(__dirname, '../public'); // Corrected path for public assets
const archiveDir = path_1.default.join(dataDir, 'archive');
const tagsFilePath = path_1.default.join(dataDir, 'tags.json');
const templatesFilePath = path_1.default.join(dataDir, 'templates.json');
const collectionsFilePath = path_1.default.join(dataDir, 'collections.json');
// Ensure data directories exist
fs_1.promises.mkdir(cardsDir, { recursive: true }).catch(console.error);
fs_1.promises.mkdir(archiveDir, { recursive: true }).catch(console.error);
fs_1.promises.mkdir(publicDir, { recursive: true }).catch(console.error);
// Helper function to read and write to the global tags file
const getGlobalTags = async () => {
    try {
        await fs_1.promises.access(tagsFilePath);
        const fileContent = await fs_1.promises.readFile(tagsFilePath, 'utf-8');
        return JSON.parse(fileContent);
    }
    catch (error) {
        // If the file doesn't exist, return an empty array
        return [];
    }
};
const updateGlobalTags = async (newTags) => {
    if (newTags.length === 0)
        return;
    const existingTags = await getGlobalTags();
    const allTags = new Set([...existingTags, ...newTags]);
    await fs_1.promises.writeFile(tagsFilePath, JSON.stringify(Array.from(allTags).sort(), null, 2));
};
// Helper functions to read and write templates
const getTemplates = async () => {
    try {
        await fs_1.promises.access(templatesFilePath);
        const fileContent = await fs_1.promises.readFile(templatesFilePath, 'utf-8');
        return JSON.parse(fileContent);
    }
    catch (error) {
        return [];
    }
};
const saveTemplates = async (templates) => {
    await fs_1.promises.writeFile(templatesFilePath, JSON.stringify(templates, null, 2));
};
// Helper functions to read and write collections
const getCollections = async () => {
    try {
        await fs_1.promises.access(collectionsFilePath);
        const fileContent = await fs_1.promises.readFile(collectionsFilePath, 'utf-8');
        return JSON.parse(fileContent);
    }
    catch (error) {
        return [];
    }
};
const saveCollections = async (collections) => {
    await fs_1.promises.writeFile(collectionsFilePath, JSON.stringify(collections.sort(), null, 2));
};
const updateGlobalCollections = async (newCollections) => {
    if (!newCollections || newCollections.length === 0)
        return;
    const existingCollections = await getCollections();
    const allCollections = new Set([...existingCollections, ...newCollections]);
    await saveCollections(Array.from(allCollections));
};
// Helper function to add derived properties for the client
const transformCardDataForClient = (cardData) => {
    if (!cardData)
        return null;
    // Add the full URL for the card's image
    cardData.imageUrl = `/api/cards/${cardData.id}/image`;
    // If 'personality' exists and 'character' does not, map it for compatibility
    if (cardData.personality && !cardData.character) { // This mapping is now deprecated, personality is the source of truth
        // cardData.character = cardData.personality;
    }
    // Ensure tags is always an array
    if (!cardData.tags) {
        cardData.tags = [];
    }
    return cardData;
};
app.post('/api/cards/upload', upload.single('card'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    try {
        let parsedCharacterData;
        const buffer = req.file.buffer;
        // Handle JSON upload
        if (req.file.mimetype === 'application/json') {
            parsedCharacterData = JSON.parse(buffer.toString('utf-8'));
        }
        // Handle PNG upload
        else if (req.file.mimetype === 'image/png') {
            const characterDataString = Png_1.Png.Parse(buffer.buffer);
            parsedCharacterData = JSON.parse(characterDataString);
        }
        // Handle unsupported file types
        else {
            return res.status(400).send('Unsupported file type. Please upload a .png or .json file.');
        }
        const cardId = (0, uuid_1.v4)();
        const cardDir = path_1.default.join(cardsDir, cardId);
        await fs_1.promises.mkdir(cardDir, { recursive: true });
        // Save the avatar image
        const imageFilePath = path_1.default.join(cardDir, 'avatar.png');
        if (req.file.mimetype === 'image/png') {
            await fs_1.promises.writeFile(imageFilePath, buffer);
        }
        else {
            // For JSON uploads, copy the default avatar.
            const defaultAvatarPath = path_1.default.join(publicDir, 'default.png');
            try {
                await fs_1.promises.copyFile(defaultAvatarPath, imageFilePath);
            }
            catch (copyError) {
                console.error("Could not find or copy default.png. Please ensure it exists in packages/server/public/default.png");
                // You might want to handle this more gracefully, but for now we log and continue
            }
        }
        // Prepare the final card data object
        // Extract V1 and V2 data, prioritizing the nested `data` object if it exists.
        const sourceData = parsedCharacterData.data || parsedCharacterData;
        const finalCreator = sourceData.creator || parsedCharacterData.creator || '';
        // Explicitly construct the card object with only the fields we want to save.
        // This prevents unused fields like 'spec' from being saved.
        const cardToSave = {
            id: cardId,
            name: sourceData.name || '',
            description: sourceData.description || '',
            personality: sourceData.personality || '',
            scenario: sourceData.scenario || '',
            first_mes: sourceData.first_mes || '',
            mes_example: sourceData.mes_example || '',
            creator_notes: sourceData.creator_notes || '',
            system_prompt: sourceData.system_prompt || '',
            post_history_instructions: sourceData.post_history_instructions || '',
            alternate_greetings: sourceData.alternate_greetings || [],
            // New V2/V3 fields
            nickname: sourceData.nickname || '',
            group_only_greetings: sourceData.group_only_greetings || [],
            character_book: sourceData.character_book, // Add this line
            extensions: sourceData.extensions || {},
            assets: sourceData.assets || [],
            creator_notes_multilingual: sourceData.creator_notes_multilingual || {},
            // Organization
            tags: sourceData.tags || [],
            collections: sourceData.collections || [],
            creator: finalCreator,
            character_version: sourceData.character_version || '',
            // Our own metadata (now as unix timestamps)
            creation_date: Math.floor(Date.now() / 1000),
            modification_date: Math.floor(Date.now() / 1000),
            originalFilename: req.file.originalname,
        };
        // Save character data as card.json
        const cardFilePath = path_1.default.join(cardDir, 'card.json');
        await fs_1.promises.writeFile(cardFilePath, JSON.stringify(cardToSave, null, 2));
        // --- Create Initial Version ---
        // Immediately create a version '0' or initial state snapshot upon upload.
        const versionsDir = path_1.default.join(cardDir, 'versions');
        await fs_1.promises.mkdir(versionsDir, { recursive: true });
        const initialVersionTimestamp = cardToSave.creation_date;
        const versionJsonPath = path_1.default.join(versionsDir, `${initialVersionTimestamp}.json`);
        const versionImagePath = path_1.default.join(versionsDir, `${initialVersionTimestamp}.png`);
        await fs_1.promises.copyFile(cardFilePath, versionJsonPath);
        // Check if avatar.png exists before trying to version it (it might not in case of an error)
        try {
            await fs_1.promises.access(imageFilePath);
            await fs_1.promises.copyFile(imageFilePath, versionImagePath);
        }
        catch (error) {
            console.warn(`Could not find avatar to create initial version for card ${cardId}. This might happen if the default avatar is missing.`);
        }
        // --- End Initial Version ---
        // Update the global tags list with any new tags from this card
        if (cardToSave.tags.length > 0) {
            await updateGlobalTags(cardToSave.tags);
        }
        if (cardToSave.collections.length > 0) {
            await updateGlobalCollections(cardToSave.collections);
        }
        // --- Automatic Archival Step ---
        const archiveCardDir = path_1.default.join(archiveDir, cardId);
        await fs_1.promises.mkdir(archiveCardDir, { recursive: true });
        const archiveFilePath = path_1.default.join(archiveCardDir, req.file.originalname);
        try {
            // Save the original uploaded buffer directly to the archive
            await fs_1.promises.writeFile(archiveFilePath, buffer);
        }
        catch (archiveError) {
            console.error(`Failed to create automatic archive for card ${cardId}:`, archiveError);
            // Don't fail the whole request, but log the error.
        }
        // --- End Automatic Archival Step ---
        res.status(201).json({ message: 'Card uploaded successfully', card: transformCardDataForClient(cardToSave) });
    }
    catch (error) {
        console.error('Error uploading card:', error);
        if (error instanceof Png_1.PngFormatError || error instanceof Png_1.PngDecodeError || error instanceof Png_1.PngMissingCharacterError || error instanceof Png_1.PngInvalidCharacterError) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).send('Internal server error.');
    }
});
app.get('/api/cards', async (req, res) => {
    try {
        const cardIdFolders = await fs_1.promises.readdir(cardsDir);
        let cards = await Promise.all(cardIdFolders.map(async (cardId) => {
            try {
                const cardJsonPath = path_1.default.join(cardsDir, cardId, 'card.json');
                const content = await fs_1.promises.readFile(cardJsonPath, 'utf-8');
                return JSON.parse(content);
            }
            catch (error) {
                // Ignore folders that don't contain a valid card.json
                console.error(`Could not read card ${cardId}:`, error);
                return null;
            }
        }));
        // Filter out nulls from failed reads and transform data for client
        cards = cards.filter(card => card !== null).map(transformCardDataForClient);
        // Apply search query 'q'
        const searchQuery = req.query.q;
        if (searchQuery) {
            const lowerCaseSearchQuery = searchQuery.toLowerCase();
            cards = cards.filter(card => card.name.toLowerCase().includes(lowerCaseSearchQuery) ||
                (card.description && card.description.toLowerCase().includes(lowerCaseSearchQuery)) ||
                (card.creator && card.creator.toLowerCase().includes(lowerCaseSearchQuery)) ||
                (card.nickname && card.nickname.toLowerCase().includes(lowerCaseSearchQuery)) ||
                (card.character_version && card.character_version.toLowerCase().includes(lowerCaseSearchQuery)) ||
                (card.mes_example && card.mes_example.toLowerCase().includes(lowerCaseSearchQuery)) ||
                (card.system_prompt && card.system_prompt.toLowerCase().includes(lowerCaseSearchQuery)) ||
                (card.post_history_instructions && card.post_history_instructions.toLowerCase().includes(lowerCaseSearchQuery)) ||
                (card.creator_notes && card.creator_notes.toLowerCase().includes(lowerCaseSearchQuery)) ||
                (card.alternate_greetings && card.alternate_greetings.join(' ').toLowerCase().includes(lowerCaseSearchQuery)) ||
                (card.group_only_greetings && card.group_only_greetings.join(' ').toLowerCase().includes(lowerCaseSearchQuery)) ||
                (card.character_book && card.character_book.entries?.some((entry) => entry.content?.toLowerCase().includes(lowerCaseSearchQuery) || entry.keys?.join(' ').toLowerCase().includes(lowerCaseSearchQuery))));
        }
        // Apply tag filter 'tags'
        const tagsQuery = req.query.tags;
        if (tagsQuery) {
            const requiredTags = tagsQuery.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean);
            cards = cards.filter(card => requiredTags.every(reqTag => card.tags?.map((t) => t.toLowerCase()).includes(reqTag)));
        }
        // Apply date range filter
        const { startDate, endDate, dateFilterType } = req.query;
        const dateField = dateFilterType === 'modification_date' ? 'modification_date' : 'creation_date';
        if (startDate) {
            // By appending T00:00:00, we force JS to parse it in the server's local timezone,
            // which we assume is the same as the user's.
            const start = new Date(startDate + 'T00:00:00');
            cards = cards.filter(card => card[dateField] && (card[dateField] * 1000) >= start.getTime());
        }
        if (endDate) {
            // Set the time to the very end of the selected day.
            const end = new Date(endDate + 'T23:59:59');
            cards = cards.filter(card => card[dateField] && (card[dateField] * 1000) <= end.getTime());
        }
        // Apply sort order
        const { sortBy, sortDirection } = req.query;
        if (sortBy) {
            cards.sort((a, b) => {
                let valA, valB;
                switch (sortBy) {
                    case 'name':
                        valA = a.name.toLowerCase();
                        valB = b.name.toLowerCase();
                        break;
                    case 'modification_date':
                        valA = a.modification_date || 0;
                        valB = b.modification_date || 0;
                        break;
                    case 'creation_date':
                    default:
                        valA = a.creation_date || 0;
                        valB = b.creation_date || 0;
                        break;
                }
                if (valA < valB) {
                    return sortDirection === 'asc' ? -1 : 1;
                }
                if (valA > valB) {
                    return sortDirection === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        res.json(cards);
    }
    catch (error) {
        console.error('Error fetching cards:', error);
        res.status(500).send('Internal server error.');
    }
});
app.get('/api/tags', async (req, res) => {
    try {
        const tags = await getGlobalTags();
        res.json(tags);
    }
    catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).send('Internal server error.');
    }
});
app.put('/api/tags/:oldName', async (req, res) => {
    const { oldName } = req.params;
    const { newName } = req.body;
    if (!newName) {
        return res.status(400).send('New name is required.');
    }
    try {
        // 1. Update the global tags.json
        let tags = await getGlobalTags();
        const tagIndex = tags.indexOf(oldName);
        if (tagIndex > -1) {
            tags[tagIndex] = newName;
            // Remove potential duplicates that might be created by renaming
            tags = [...new Set(tags)];
            await fs_1.promises.writeFile(tagsFilePath, JSON.stringify(tags.sort(), null, 2));
        }
        else {
            return res.status(404).send('Tag not found in global list.');
        }
        // 2. Iterate through all cards and update the tag
        const cardIdFolders = await fs_1.promises.readdir(cardsDir);
        for (const cardId of cardIdFolders) {
            const cardJsonPath = path_1.default.join(cardsDir, cardId, 'card.json');
            try {
                const content = await fs_1.promises.readFile(cardJsonPath, 'utf-8');
                const card = JSON.parse(content);
                if (card.tags && card.tags.includes(oldName)) {
                    card.tags = card.tags.map((t) => t === oldName ? newName : t);
                    // Also update modification date
                    card.modification_date = Math.floor(Date.now() / 1000);
                    await fs_1.promises.writeFile(cardJsonPath, JSON.stringify(card, null, 2));
                }
            }
            catch (error) {
                // Ignore folders that don't contain a valid card.json or have read errors
                console.error(`Could not process card ${cardId} for tag rename:`, error);
            }
        }
        res.status(200).json({ message: 'Tag updated successfully' });
    }
    catch (error) {
        console.error(`Error updating tag ${oldName}:`, error);
        res.status(500).send('Internal server error.');
    }
});
app.delete('/api/tags/:tagName', async (req, res) => {
    const { tagName } = req.params;
    try {
        // 1. Update the global tags.json
        let tags = await getGlobalTags();
        const initialLength = tags.length;
        tags = tags.filter(t => t !== tagName);
        if (tags.length === initialLength) {
            return res.status(404).send('Tag not found in global list.');
        }
        await fs_1.promises.writeFile(tagsFilePath, JSON.stringify(tags.sort(), null, 2));
        // 2. Iterate through all cards and remove the tag
        const cardIdFolders = await fs_1.promises.readdir(cardsDir);
        for (const cardId of cardIdFolders) {
            const cardJsonPath = path_1.default.join(cardsDir, cardId, 'card.json');
            try {
                const content = await fs_1.promises.readFile(cardJsonPath, 'utf-8');
                const card = JSON.parse(content);
                if (card.tags && card.tags.includes(tagName)) {
                    card.tags = card.tags.filter((t) => t !== tagName);
                    // Also update modification date
                    card.modification_date = Math.floor(Date.now() / 1000);
                    await fs_1.promises.writeFile(cardJsonPath, JSON.stringify(card, null, 2));
                }
            }
            catch (error) {
                console.error(`Could not process card ${cardId} for tag deletion:`, error);
            }
        }
        res.status(200).json({ message: 'Tag deleted successfully' });
    }
    catch (error) {
        console.error(`Error deleting tag ${tagName}:`, error);
        res.status(500).send('Internal server error.');
    }
});
app.get('/api/cards/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const cardFilePath = path_1.default.join(cardsDir, id, 'card.json');
        const content = await fs_1.promises.readFile(cardFilePath, 'utf-8');
        res.json(transformCardDataForClient(JSON.parse(content)));
    }
    catch (error) {
        console.error(`Error fetching card ${req.params.id}:`, error);
        res.status(404).send('Card not found.');
    }
});
app.put('/api/cards/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedCardData = req.body;
        const cardFilePath = path_1.default.join(cardsDir, id, 'card.json');
        const cardDir = path_1.default.join(cardsDir, id);
        const versionsDir = path_1.default.join(cardDir, 'versions');
        // Read existing card data to merge with
        const existingContent = await fs_1.promises.readFile(cardFilePath, 'utf-8');
        const existingCard = JSON.parse(existingContent);
        // Merge new data with existing data and set the new modification date
        const newCardData = { ...existingCard, ...updatedCardData, id: id, modification_date: Math.floor(Date.now() / 1000) };
        // Write the updated data back to the main file FIRST
        await fs_1.promises.writeFile(cardFilePath, JSON.stringify(newCardData, null, 2));
        // --- Versioning Step ---
        // Now, create a version snapshot of the data that was JUST saved.
        await fs_1.promises.mkdir(versionsDir, { recursive: true });
        // Use the new modification_date for the version timestamp to be precise
        const versionTimestamp = newCardData.modification_date;
        const versionFilePath = path_1.default.join(versionsDir, `${versionTimestamp}.json`);
        await fs_1.promises.copyFile(cardFilePath, versionFilePath); // Copy the newly saved file
        // --- End Versioning Step ---
        // Also update the global tag list with any new tags
        if (newCardData.tags && newCardData.tags.length > 0) {
            await updateGlobalTags(newCardData.tags);
        }
        if (newCardData.collections && newCardData.collections.length > 0) {
            await updateGlobalCollections(newCardData.collections);
        }
        res.json({ message: 'Card updated successfully', card: transformCardDataForClient(newCardData) });
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).send('Card not found.');
        }
        console.error(`Error updating card ${req.params.id}:`, error);
        res.status(500).send('Internal server error.');
    }
});
app.delete('/api/cards/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const cardDir = path_1.default.join(cardsDir, id);
        // The 'recursive' option will delete the directory and all its contents.
        // The 'force' option suppresses errors if the path does not exist.
        await fs_1.promises.rm(cardDir, { recursive: true, force: true });
        res.status(200).json({ message: 'Card deleted successfully', cardId: id });
    }
    catch (error) {
        console.error(`Error deleting card ${req.params.id}:`, error);
        res.status(500).send('Internal server error.');
    }
});
app.delete('/api/cards/:id/archive', async (req, res) => {
    try {
        const { id } = req.params;
        const cardDir = path_1.default.join(cardsDir, id);
        const archiveCardDir = path_1.default.join(archiveDir, id);
        // Permanently delete from both active and archive directories.
        // The 'force: true' option suppresses errors if a path does not exist,
        // which is useful in case one has already been deleted.
        await fs_1.promises.rm(cardDir, { recursive: true, force: true });
        await fs_1.promises.rm(archiveCardDir, { recursive: true, force: true });
        res.status(200).json({ message: 'Card and its archive permanently deleted', cardId: id });
    }
    catch (error) {
        console.error(`Error permanently deleting card ${req.params.id}:`, error);
        res.status(500).send('Internal server error.');
    }
});
app.post('/api/cards/:id/duplicate', async (req, res) => {
    try {
        const { id } = req.params;
        const sourceCardDir = path_1.default.join(cardsDir, id);
        // Check if source card exists
        try {
            await fs_1.promises.access(sourceCardDir);
        }
        catch (error) {
            return res.status(404).send('Source card not found.');
        }
        // Generate new ID and directory path
        const newCardId = (0, uuid_1.v4)();
        const newCardDir = path_1.default.join(cardsDir, newCardId);
        await fs_1.promises.mkdir(newCardDir, { recursive: true });
        // Copy all files from source to new directory
        const files = await fs_1.promises.readdir(sourceCardDir);
        for (const file of files) {
            const sourceFile = path_1.default.join(sourceCardDir, file);
            const destFile = path_1.default.join(newCardDir, file);
            await fs_1.promises.copyFile(sourceFile, destFile);
        }
        // Read the copied card.json, update its ID, and save it back
        const cardJsonPath = path_1.default.join(newCardDir, 'card.json');
        const cardContent = await fs_1.promises.readFile(cardJsonPath, 'utf-8');
        const cardData = JSON.parse(cardContent);
        cardData.id = newCardId;
        cardData.isCopy = true; // Flag the card as a copy
        cardData.creation_date = Math.floor(Date.now() / 1000);
        cardData.modification_date = Math.floor(Date.now() / 1000);
        await fs_1.promises.writeFile(cardJsonPath, JSON.stringify(cardData, null, 2));
        res.status(201).json({ message: 'Card duplicated successfully', card: transformCardDataForClient(cardData) });
    }
    catch (error) {
        console.error(`Error duplicating card ${req.params.id}:`, error);
        res.status(500).send('Internal server error.');
    }
});
app.get('/api/cards/:id/image', async (req, res) => {
    try {
        const { id } = req.params;
        const imagePath = path_1.default.join(cardsDir, id, 'avatar.png');
        // Check if file exists before sending
        await fs_1.promises.access(imagePath);
        res.sendFile(imagePath);
    }
    catch (error) {
        res.status(404).send('Image not found.');
    }
});
app.post('/api/cards/:id/update-avatar', upload.single('avatar'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    const { id } = req.params;
    const cardDir = path_1.default.join(cardsDir, id);
    const versionsDir = path_1.default.join(cardDir, 'versions');
    const imageFilePath = path_1.default.join(cardDir, 'avatar.png');
    const cardJsonPath = path_1.default.join(cardDir, 'card.json');
    try {
        // Ensure versions directory exists
        await fs_1.promises.mkdir(versionsDir, { recursive: true });
        // Save the new avatar to the primary location first
        await fs_1.promises.writeFile(imageFilePath, req.file.buffer);
        // Update the modification date in card.json
        const cardJsonContent = await fs_1.promises.readFile(cardJsonPath, 'utf-8');
        const cardData = JSON.parse(cardJsonContent);
        cardData.modification_date = Math.floor(Date.now() / 1000);
        await fs_1.promises.writeFile(cardJsonPath, JSON.stringify(cardData, null, 2));
        // --- Versioning Step ---
        // Now that the new avatar is saved, create a version of it.
        const versionTimestamp = cardData.modification_date;
        const versionedImagePath = path_1.default.join(versionsDir, `${versionTimestamp}.png`);
        await fs_1.promises.copyFile(imageFilePath, versionedImagePath);
        // --- End Versioning Step ---
        res.status(200).json({ message: 'Avatar updated successfully', card: transformCardDataForClient(cardData) });
    }
    catch (error) {
        console.error(`Error updating avatar for card ${id}:`, error);
        res.status(500).send('Internal server error.');
    }
});
// New endpoint to list files for a specific file type
app.get('/api/cards/:id/files/:fileType', async (req, res) => {
    try {
        const { id, fileType } = req.params;
        const filesDir = path_1.default.join(cardsDir, id, fileType);
        // Check if the directory exists
        await fs_1.promises.access(filesDir);
        const files = await fs_1.promises.readdir(filesDir);
        res.json(files);
    }
    catch (error) {
        // If the directory doesn't exist, it means no files have been uploaded yet.
        // This is not an error condition, just return an empty array.
        res.json([]);
    }
});
// Endpoint to get version history for a card
app.get('/api/cards/:id/versions', async (req, res) => {
    try {
        const { id } = req.params;
        const versionsDir = path_1.default.join(cardsDir, id, 'versions');
        const labelsFilePath = path_1.default.join(versionsDir, 'version_labels.json');
        // Read labels file
        let labels = {};
        try {
            await fs_1.promises.access(labelsFilePath);
            const labelsContent = await fs_1.promises.readFile(labelsFilePath, 'utf-8');
            labels = JSON.parse(labelsContent);
        }
        catch (error) {
            // It's okay if the labels file doesn't exist yet
        }
        await fs_1.promises.access(versionsDir);
        const files = await fs_1.promises.readdir(versionsDir);
        // Separate files by type and sort them descending by name (timestamp)
        const history = {
            json: files.filter(f => f.endsWith('.json')).sort((a, b) => b.localeCompare(a)),
            images: files.filter(f => f.endsWith('.png')).sort((a, b) => b.localeCompare(a)),
            labels: labels
        };
        res.json(history);
    }
    catch (error) {
        // If the directory doesn't exist, there's no history.
        res.json({ json: [], images: [], labels: {} });
    }
});
// Endpoint to get a specific versioned file
app.get('/api/cards/:id/versions/:filename', async (req, res) => {
    try {
        const { id, filename } = req.params;
        const filePath = path_1.default.join(cardsDir, id, 'versions', filename);
        await fs_1.promises.access(filePath); // Check if file exists
        res.sendFile(filePath);
    }
    catch (error) {
        res.status(404).send('Version not found.');
    }
});
// Endpoint to DELETE a specific versioned file
app.delete('/api/cards/:id/versions/:filename', async (req, res) => {
    try {
        const { id, filename } = req.params;
        // --- Validation Step ---
        if (!filename.endsWith('.png')) {
            return res.status(400).send('Only image versions can be deleted.');
        }
        const versionsDir = path_1.default.join(cardsDir, id, 'versions');
        const allFiles = await fs_1.promises.readdir(versionsDir);
        const imageVersions = allFiles.filter(f => f.endsWith('.png')).sort((a, b) => b.localeCompare(a));
        const isLatest = imageVersions.length > 0 && imageVersions[0] === filename;
        const isInitial = imageVersions.length > 0 && imageVersions[imageVersions.length - 1] === filename;
        if (isLatest) {
            return res.status(400).send('Cannot delete the most recent avatar version.');
        }
        if (isInitial) {
            return res.status(400).send('Cannot delete the initial avatar version.');
        }
        // --- End Validation Step ---
        const filePath = path_1.default.join(versionsDir, filename);
        await fs_1.promises.rm(filePath, { force: true }); // Use force to avoid error if it doesn't exist for some reason
        res.status(200).json({ message: 'Version deleted successfully.' });
    }
    catch (error) {
        console.error(`Error deleting version ${req.params.filename} for card ${req.params.id}:`, error);
        res.status(500).send('Internal server error.');
    }
});
app.post('/api/cards/:id/versions/label', async (req, res) => {
    try {
        const { id } = req.params;
        const { filename, label } = req.body;
        if (!filename || typeof label === 'undefined') {
            return res.status(400).send('Filename and label are required.');
        }
        const versionsDir = path_1.default.join(cardsDir, id, 'versions');
        const labelsFilePath = path_1.default.join(versionsDir, 'version_labels.json');
        let labels = {};
        try {
            await fs_1.promises.access(labelsFilePath);
            const labelsContent = await fs_1.promises.readFile(labelsFilePath, 'utf-8');
            labels = JSON.parse(labelsContent);
        }
        catch (error) {
            // It's okay if the file doesn't exist, we'll create it.
            await fs_1.promises.mkdir(versionsDir, { recursive: true });
        }
        labels[filename] = label;
        await fs_1.promises.writeFile(labelsFilePath, JSON.stringify(labels, null, 2));
        res.status(200).json({ message: 'Label saved successfully.' });
    }
    catch (error) {
        console.error(`Error saving version label for card ${req.params.id}:`, error);
        res.status(500).send('Internal server error.');
    }
});
app.post('/api/cards/:id/upload-file', upload.single('file'), async (req, res) => {
    if (!req.file || !req.body.fileType) {
        return res.status(400).send('No file or fileType specified.');
    }
    const { id } = req.params;
    const { fileType } = req.body; // e.g., 'cardHtml', 'creatorNotesHtml', 'chatsJson'
    const cardDir = path_1.default.join(cardsDir, id);
    const filesDir = path_1.default.join(cardDir, fileType); // Create a subdirectory for the file type
    // Basic validation for security
    const allowedFileTypes = ['cardHtml', 'creatorNotesHtml', 'chatsJson'];
    if (!allowedFileTypes.includes(fileType)) {
        return res.status(400).send('Invalid file type.');
    }
    try {
        await fs_1.promises.mkdir(filesDir, { recursive: true }); // Ensure the subdirectory exists
        const filename = req.file.originalname; // Use the original filename
        const filePath = path_1.default.join(filesDir, filename);
        // Overwriting is allowed by default, as requested by the client flow
        await fs_1.promises.writeFile(filePath, req.file.buffer);
        res.status(200).json({ message: `${filename} uploaded successfully.` });
    }
    catch (error) {
        console.error(`Error uploading file for card ${id}:`, error);
        res.status(500).send('Internal server error.');
    }
});
// Endpoint to get a specific file for viewing or downloading
app.get('/api/cards/:id/file/:fileType/:filename', async (req, res) => {
    try {
        const { id, fileType, filename } = req.params;
        const { action } = req.query; // 'view' or 'download'
        const filePath = path_1.default.join(cardsDir, id, fileType, filename);
        await fs_1.promises.access(filePath); // Check if file exists
        if (action === 'download') {
            // Set headers for download
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        }
        // For viewing, we don't set Content-Disposition, so the browser will try to render it.
        // We can also set Content-Type for better browser handling.
        const ext = path_1.default.extname(filename).toLowerCase();
        if (ext === '.html') {
            res.setHeader('Content-Type', 'text/html');
        }
        else if (ext === '.json' || ext === '.jsonl') {
            res.setHeader('Content-Type', 'application/json');
        }
        res.sendFile(filePath);
    }
    catch (error) {
        res.status(404).send('File not found.');
    }
});
// Endpoint to delete a specific file
app.delete('/api/cards/:id/file/:fileType/:filename', async (req, res) => {
    try {
        const { id, fileType, filename } = req.params;
        const filePath = path_1.default.join(cardsDir, id, fileType, filename);
        await fs_1.promises.rm(filePath, { force: true }); // force suppresses error if file doesn't exist
        res.status(200).json({ message: `${filename} deleted successfully.` });
    }
    catch (error) {
        console.error(`Error deleting ${req.params.filename} for card ${req.params.id}:`, error);
        res.status(500).send('Internal server error.');
    }
});
// Template Management Endpoints
app.get('/api/templates', async (req, res) => {
    try {
        const templates = await getTemplates();
        res.json(templates);
    }
    catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).send('Internal server error.');
    }
});
app.post('/api/templates', async (req, res) => {
    try {
        const newTemplate = req.body;
        if (!newTemplate.name || !newTemplate.content) {
            return res.status(400).send('Template name and content are required.');
        }
        const templates = await getTemplates();
        newTemplate.id = (0, uuid_1.v4)();
        templates.push(newTemplate);
        await saveTemplates(templates);
        res.status(201).json(newTemplate);
    }
    catch (error) {
        console.error('Error creating template:', error);
        res.status(500).send('Internal server error.');
    }
});
app.put('/api/templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedTemplate = req.body;
        const templates = await getTemplates();
        const index = templates.findIndex(t => t.id === id);
        if (index === -1) {
            return res.status(404).send('Template not found.');
        }
        templates[index] = { ...templates[index], ...updatedTemplate, id };
        await saveTemplates(templates);
        res.json(templates[index]);
    }
    catch (error) {
        console.error(`Error updating template ${req.params.id}:`, error);
        res.status(500).send('Internal server error.');
    }
});
app.delete('/api/templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let templates = await getTemplates();
        const initialLength = templates.length;
        templates = templates.filter(t => t.id !== id);
        if (templates.length === initialLength) {
            return res.status(404).send('Template not found.');
        }
        await saveTemplates(templates);
        res.status(200).json({ message: 'Template deleted successfully' });
    }
    catch (error) {
        console.error(`Error deleting template ${req.params.id}:`, error);
        res.status(500).send('Internal server error.');
    }
});
// Collection Management Endpoints
app.get('/api/collections', async (req, res) => {
    try {
        const collections = await getCollections();
        res.json(collections);
    }
    catch (error) {
        console.error('Error fetching collections:', error);
        res.status(500).send('Internal server error.');
    }
});
app.put('/api/collections/:oldName', async (req, res) => {
    const { oldName } = req.params;
    const { newName } = req.body;
    if (!newName) {
        return res.status(400).send('New name is required.');
    }
    try {
        let collections = await getCollections();
        const collectionIndex = collections.indexOf(oldName);
        if (collectionIndex > -1) {
            collections[collectionIndex] = newName;
            collections = [...new Set(collections)];
            await saveCollections(collections);
        }
        else {
            return res.status(404).send('Collection not found.');
        }
        const cardIdFolders = await fs_1.promises.readdir(cardsDir);
        for (const cardId of cardIdFolders) {
            const cardJsonPath = path_1.default.join(cardsDir, cardId, 'card.json');
            try {
                const content = await fs_1.promises.readFile(cardJsonPath, 'utf-8');
                const card = JSON.parse(content);
                if (card.collections && card.collections.includes(oldName)) {
                    card.collections = card.collections.map((c) => c === oldName ? newName : c);
                    card.modification_date = Math.floor(Date.now() / 1000);
                    await fs_1.promises.writeFile(cardJsonPath, JSON.stringify(card, null, 2));
                }
            }
            catch (error) {
                console.error(`Could not process card ${cardId} for collection rename:`, error);
            }
        }
        res.status(200).json({ message: 'Collection updated successfully' });
    }
    catch (error) {
        console.error(`Error updating collection ${oldName}:`, error);
        res.status(500).send('Internal server error.');
    }
});
app.delete('/api/collections/:collectionName', async (req, res) => {
    const { collectionName } = req.params;
    try {
        let collections = await getCollections();
        collections = collections.filter(c => c !== collectionName);
        await saveCollections(collections);
        const cardIdFolders = await fs_1.promises.readdir(cardsDir);
        for (const cardId of cardIdFolders) {
            const cardJsonPath = path_1.default.join(cardsDir, cardId, 'card.json');
            try {
                const content = await fs_1.promises.readFile(cardJsonPath, 'utf-8');
                const card = JSON.parse(content);
                if (card.collections && card.collections.includes(collectionName)) {
                    card.collections = card.collections.filter((c) => c !== collectionName);
                    card.modification_date = Math.floor(Date.now() / 1000);
                    await fs_1.promises.writeFile(cardJsonPath, JSON.stringify(card, null, 2));
                }
            }
            catch (error) {
                console.error(`Could not process card ${cardId} for collection deletion:`, error);
            }
        }
        res.status(200).json({ message: 'Collection deleted successfully' });
    }
    catch (error) {
        console.error(`Error deleting collection ${collectionName}:`, error);
        res.status(500).send('Internal server error.');
    }
});
app.get('/', (req, res) => {
    res.send('Cards Repo Server is running!');
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
