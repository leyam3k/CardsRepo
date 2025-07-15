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
        await fs_1.promises.writeFile(cardFilePath, JSON.stringify({ id: cardId, image: imageFilename, ...JSON.parse(characterData) }, null, 2));
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
        const cardPromises = files
            .filter(file => file.endsWith('.json'))
            .map(async (file) => {
            const filePath = path_1.default.join(cardsDir, file);
            const content = await fs_1.promises.readFile(filePath, 'utf-8');
            return JSON.parse(content);
        });
        const cards = await Promise.all(cardPromises);
        res.json(cards);
    }
    catch (error) {
        console.error('Error fetching cards:', error);
        res.status(500).send('Internal server error.');
    }
});
app.get('/api/cards/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const cardFilePath = path_1.default.join(cardsDir, `${id}.json`);
        const content = await fs_1.promises.readFile(cardFilePath, 'utf-8');
        res.json(JSON.parse(content));
    }
    catch (error) {
        console.error(`Error fetching card ${req.params.id}:`, error);
        res.status(404).send('Card not found.');
    }
});
app.get('/api/images/:imageFilename', (req, res) => {
    const { imageFilename } = req.params;
    const imagePath = path_1.default.join(imagesDir, imageFilename);
    res.sendFile(imagePath);
});
app.get('/', (req, res) => {
    res.send('Cards Repo Server is running!');
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
