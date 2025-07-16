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
const imagesDir = path_1.default.join(__dirname, '../data/images');
// Ensure data directories exist
fs_1.promises.mkdir(cardsDir, { recursive: true }).catch(console.error);
fs_1.promises.mkdir(imagesDir, { recursive: true }).catch(console.error);
// Helper function to ensure data consistency for the client
const transformCardData = (cardData) => {
    // If 'personality' exists and 'character' does not, map it
    if (cardData && cardData.personality && !cardData.character) {
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
        const characterData = Png_1.Png.Parse(buffer.buffer);
        const cardId = (0, uuid_1.v4)();
        const imageFilename = `${cardId}.png`; // Assuming the uploaded file is always a PNG
        // Save character data as JSON
        const cardFilePath = path_1.default.join(cardsDir, `${cardId}.json`);
        // Parse characterData, add id, image, and an empty tags array by default
        const parsedCharacterData = JSON.parse(characterData);
        // Extract creator from nested 'data' if present, otherwise use top-level or default to empty string
        const finalCreator = parsedCharacterData.data?.creator || parsedCharacterData.creator || '';
        const cardToSave = {
            id: cardId,
            image: imageFilename,
            tags: [],
            ...parsedCharacterData, // Spread the original data first
            creator: finalCreator // Then explicitly set the creator, overwriting the original if it exists
        };
        await fs_1.promises.writeFile(cardFilePath, JSON.stringify(cardToSave, null, 2));
        // Save the image
        const imageFilePath = path_1.default.join(imagesDir, imageFilename);
        await fs_1.promises.writeFile(imageFilePath, buffer);
        res.status(201).json({ message: 'Card uploaded successfully', cardId });
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
        const files = await fs_1.promises.readdir(cardsDir);
        let cards = await Promise.all(files
            .filter(file => file.endsWith('.json'))
            .map(async (file) => {
            const filePath = path_1.default.join(cardsDir, file);
            const content = await fs_1.promises.readFile(filePath, 'utf-8');
            return transformCardData(JSON.parse(content));
        }));
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
            cards = cards.filter(card => requiredTags.every(reqTag => card.tags.map((t) => t.toLowerCase()).includes(reqTag)));
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
        const files = await fs_1.promises.readdir(cardsDir);
        const allTags = new Set();
        for (const file of files) {
            if (file.endsWith('.json')) {
                const filePath = path_1.default.join(cardsDir, file);
                const content = await fs_1.promises.readFile(filePath, 'utf-8');
                const cardData = JSON.parse(content);
                if (cardData.tags && Array.isArray(cardData.tags)) {
                    cardData.tags.forEach((tag) => allTags.add(tag));
                }
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
        const cardFilePath = path_1.default.join(cardsDir, `${id}.json`);
        const content = await fs_1.promises.readFile(cardFilePath, 'utf-8');
        res.json(transformCardData(JSON.parse(content)));
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
        const cardFilePath = path_1.default.join(cardsDir, `${id}.json`);
        // Check if the card exists
        await fs_1.promises.access(cardFilePath);
        // Ensure the ID in the body matches the param ID
        if (updatedCardData.id !== id) {
            return res.status(400).send('Card ID in body does not match route parameter.');
        }
        // Write the updated data back to the file
        await fs_1.promises.writeFile(cardFilePath, JSON.stringify(updatedCardData, null, 2));
        res.json({ message: 'Card updated successfully', cardId: id });
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
        const cardFilePath = path_1.default.join(cardsDir, `${id}.json`);
        // Read the card data to get the image filename. This also validates that the card exists.
        const cardContent = await fs_1.promises.readFile(cardFilePath, 'utf-8');
        const cardData = JSON.parse(cardContent);
        const imageFilename = cardData.image;
        // Delete the card JSON file first.
        await fs_1.promises.unlink(cardFilePath);
        // Then, attempt to delete the associated image file.
        if (imageFilename) {
            const imageFilePath = path_1.default.join(imagesDir, imageFilename);
            try {
                await fs_1.promises.unlink(imageFilePath);
            }
            catch (imageError) {
                // If the file doesn't exist, we can ignore the error.
                // Otherwise, log the error but don't fail the request.
                if (imageError.code !== 'ENOENT') {
                    console.warn(`Could not delete image file ${imageFilePath}:`, imageError);
                }
            }
        }
        res.json({ message: 'Card deleted successfully', cardId: id });
    }
    catch (error) {
        // If the initial readFile fails, the card was not found.
        if (error.code === 'ENOENT') {
            return res.status(404).send('Card not found.');
        }
        console.error(`Error deleting card ${req.params.id}:`, error);
        res.status(500).send('Internal server error.');
    }
});
app.get('/api/images/:imageFilename', async (req, res) => {
    const { imageFilename } = req.params;
    const imagePath = path_1.default.join(imagesDir, imageFilename);
    try {
        await fs_1.promises.access(imagePath); // Check if the file exists
        res.sendFile(imagePath);
    }
    catch (error) {
        // If fs.access throws, the file doesn't exist.
        res.status(404).send('Image not found');
    }
});
app.get('/', (req, res) => {
    res.send('Cards Repo Server is running!');
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
