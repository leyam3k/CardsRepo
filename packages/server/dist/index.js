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
const cardsDir = path_1.default.join(__dirname, '../data/cards');
// Ensure data directories exist
fs_1.promises.mkdir(cardsDir, { recursive: true }).catch(console.error);
// Helper function to add derived properties for the client
const transformCardDataForClient = (cardData) => {
    if (!cardData)
        return null;
    // Add the full URL for the card's image
    cardData.imageUrl = `/api/cards/${cardData.id}/image`;
    // If 'personality' exists and 'character' does not, map it for compatibility
    if (cardData.personality && !cardData.character) {
        cardData.character = cardData.personality;
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
        const buffer = req.file.buffer;
        const characterDataString = Png_1.Png.Parse(buffer.buffer);
        const parsedCharacterData = JSON.parse(characterDataString);
        const cardId = (0, uuid_1.v4)();
        const cardDir = path_1.default.join(cardsDir, cardId);
        await fs_1.promises.mkdir(cardDir, { recursive: true });
        // Save the avatar image
        const imageFilePath = path_1.default.join(cardDir, 'avatar.png');
        await fs_1.promises.writeFile(imageFilePath, buffer);
        // Prepare the final card data object
        const finalCreator = parsedCharacterData.data?.creator || parsedCharacterData.creator || '';
        const cardToSave = {
            id: cardId,
            ...parsedCharacterData,
            creator: finalCreator,
            tags: parsedCharacterData.tags || [], // Ensure tags is an array
            importDate: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            originalFilename: req.file.originalname,
        };
        // Save character data as card.json
        const cardFilePath = path_1.default.join(cardDir, 'card.json');
        await fs_1.promises.writeFile(cardFilePath, JSON.stringify(cardToSave, null, 2));
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
                (card.creator && card.creator.toLowerCase().includes(lowerCaseSearchQuery)));
        }
        // Apply tag filter 'tags'
        const tagsQuery = req.query.tags;
        if (tagsQuery) {
            const requiredTags = tagsQuery.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean);
            cards = cards.filter(card => requiredTags.every(reqTag => card.tags?.map((t) => t.toLowerCase()).includes(reqTag)));
        }
        // Apply date range filter
        const { startDate, endDate } = req.query;
        if (startDate) {
            cards = cards.filter(card => card.importDate && new Date(card.importDate) >= new Date(startDate));
        }
        if (endDate) {
            cards = cards.filter(card => card.importDate && new Date(card.importDate) <= new Date(endDate));
        }
        // Apply sort order
        const { sortOrder } = req.query;
        if (sortOrder === 'date-asc') {
            cards.sort((a, b) => new Date(a.importDate).getTime() - new Date(b.importDate).getTime());
        }
        else if (sortOrder === 'date-desc') {
            cards.sort((a, b) => new Date(b.importDate).getTime() - new Date(a.importDate).getTime());
        }
        else if (sortOrder === 'name-asc') {
            cards.sort((a, b) => a.name.localeCompare(b.name));
        }
        else if (sortOrder === 'name-desc') {
            cards.sort((a, b) => b.name.localeCompare(a.name));
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
        const cardIdFolders = await fs_1.promises.readdir(cardsDir);
        const allTags = new Set();
        for (const cardId of cardIdFolders) {
            try {
                const cardJsonPath = path_1.default.join(cardsDir, cardId, 'card.json');
                const content = await fs_1.promises.readFile(cardJsonPath, 'utf-8');
                const cardData = JSON.parse(content);
                if (cardData.tags && Array.isArray(cardData.tags)) {
                    cardData.tags.forEach((tag) => allTags.add(tag));
                }
            }
            catch (error) {
                // Ignore folders that don't contain a valid card.json
                continue;
            }
        }
        res.json(Array.from(allTags).sort());
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
        const newCardData = { ...existingCard, ...updatedCardData, id: id, lastModified: new Date().toISOString() }; // Ensure ID is not changed and update timestamp
        // Write the updated data back to the file
        await fs_1.promises.writeFile(cardFilePath, JSON.stringify(newCardData, null, 2));
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
        cardData.name = `${cardData.name} (Copy)`; // Add suffix to name
        cardData.importDate = new Date().toISOString();
        cardData.lastModified = new Date().toISOString();
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
app.get('/', (req, res) => {
    res.send('Cards Repo Server is running!');
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
