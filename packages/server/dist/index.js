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
const tagsFilePath = path_1.default.join(dataDir, 'tags.json');
// Ensure data directories exist
fs_1.promises.mkdir(cardsDir, { recursive: true }).catch(console.error);
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
        // Update the global tags list with any new tags from this card
        if (cardToSave.tags.length > 0) {
            await updateGlobalTags(cardToSave.tags);
        }
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
        // To prevent partial updates or corruption, read the existing card first.
        const existingContent = await fs_1.promises.readFile(cardFilePath, 'utf-8');
        const existingCard = JSON.parse(existingContent);
        // Merge new data with existing data
        const newCardData = { ...existingCard, ...updatedCardData, id: id, modification_date: Math.floor(Date.now() / 1000) }; // Ensure ID is not changed and update timestamp
        // Write the updated data back to the file
        await fs_1.promises.writeFile(cardFilePath, JSON.stringify(newCardData, null, 2));
        // Also update the global tag list with any new tags
        if (newCardData.tags && newCardData.tags.length > 0) {
            await updateGlobalTags(newCardData.tags);
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
app.post('/api/cards/:id/upload-file', upload.single('file'), async (req, res) => {
    if (!req.file || !req.body.fileType) {
        return res.status(400).send('No file or fileType specified.');
    }
    const { id } = req.params;
    const { fileType } = req.body; // e.g., 'cardHtml', 'creatorNotesHtml', 'chatsJson'
    const cardDir = path_1.default.join(cardsDir, id);
    // Basic validation for security
    const allowedFileTypes = {
        cardHtml: 'card.html',
        creatorNotesHtml: 'creator_notes.html',
        chatsJson: 'chats.json',
    };
    if (!allowedFileTypes[fileType]) {
        return res.status(400).send('Invalid file type.');
    }
    const filename = allowedFileTypes[fileType];
    const filePath = path_1.default.join(cardDir, filename);
    try {
        await fs_1.promises.writeFile(filePath, req.file.buffer);
        res.status(200).json({ message: `${filename} uploaded successfully.` });
    }
    catch (error) {
        console.error(`Error uploading ${filename} for card ${id}:`, error);
        res.status(500).send('Internal server error.');
    }
});
app.get('/api/cards/:id/file/:fileType', async (req, res) => {
    try {
        const { id, fileType } = req.params;
        const cardDir = path_1.default.join(cardsDir, id);
        const allowedFileTypes = {
            cardHtml: { name: 'card.html', type: 'text/html' },
            creatorNotesHtml: { name: 'creator_notes.html', type: 'text/html' },
            chatsJson: { name: 'chats.json', type: 'application/json' },
        };
        if (!allowedFileTypes[fileType]) {
            return res.status(400).send('Invalid file type.');
        }
        const { name, type } = allowedFileTypes[fileType];
        const filePath = path_1.default.join(cardDir, name);
        await fs_1.promises.access(filePath);
        res.setHeader('Content-Type', type);
        res.sendFile(filePath);
    }
    catch (error) {
        res.status(404).send('File not found.');
    }
});
app.delete('/api/cards/:id/file/:fileType', async (req, res) => {
    try {
        const { id, fileType } = req.params;
        const cardDir = path_1.default.join(cardsDir, id);
        const allowedFileTypes = {
            cardHtml: 'card.html',
            creatorNotesHtml: 'creator_notes.html',
            chatsJson: 'chats.json',
        };
        if (!allowedFileTypes[fileType]) {
            return res.status(400).send('Invalid file type.');
        }
        const filename = allowedFileTypes[fileType];
        const filePath = path_1.default.join(cardDir, filename);
        await fs_1.promises.rm(filePath, { force: true }); // force suppresses error if file doesn't exist
        res.status(200).json({ message: `${filename} deleted successfully.` });
    }
    catch (error) {
        console.error(`Error deleting ${req.params.fileType} for card ${req.params.id}:`, error);
        res.status(500).send('Internal server error.');
    }
});
app.get('/', (req, res) => {
    res.send('Cards Repo Server is running!');
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
