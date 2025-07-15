import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Png, PngDecodeError, PngFormatError, PngMissingCharacterError, PngInvalidCharacterError } from './utils/Png';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

const cardsDir = path.join(__dirname, '../data/cards');
const imagesDir = path.join(__dirname, '../data/images');

// Ensure data directories exist
fs.mkdir(cardsDir, { recursive: true }).catch(console.error);
fs.mkdir(imagesDir, { recursive: true }).catch(console.error);

app.post('/api/cards/upload', upload.single('card'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const buffer = req.file.buffer;
    const characterData = Png.Parse(buffer.buffer);
    const cardId = uuidv4();
    const imageFilename = `${cardId}.png`; // Assuming the uploaded file is always a PNG

    // Save character data as JSON
    const cardFilePath = path.join(cardsDir, `${cardId}.json`);
    await fs.writeFile(cardFilePath, JSON.stringify({ id: cardId, image: imageFilename, ...JSON.parse(characterData) }, null, 2));

    // Save the image
    const imageFilePath = path.join(imagesDir, imageFilename);
    await fs.writeFile(imageFilePath, buffer);

    res.status(201).json({ message: 'Card uploaded successfully', cardId });
  } catch (error) {
    console.error('Error uploading card:', error);
    if (error instanceof PngFormatError || error instanceof PngDecodeError || error instanceof PngMissingCharacterError || error instanceof PngInvalidCharacterError) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).send('Internal server error.');
  }
});

app.get('/api/cards', async (req, res) => {
  try {
    const files = await fs.readdir(cardsDir);
    const cardPromises = files
      .filter(file => file.endsWith('.json'))
      .map(async file => {
        const filePath = path.join(cardsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
      });

    const cards = await Promise.all(cardPromises);
    res.json(cards);
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).send('Internal server error.');
  }
});

app.get('/api/cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cardFilePath = path.join(cardsDir, `${id}.json`);
    const content = await fs.readFile(cardFilePath, 'utf-8');
    res.json(JSON.parse(content));
  } catch (error) {
    console.error(`Error fetching card ${req.params.id}:`, error);
    res.status(404).send('Card not found.');
  }
});

app.get('/api/images/:imageFilename', (req, res) => {
  const { imageFilename } = req.params;
  const imagePath = path.join(imagesDir, imageFilename);
  res.sendFile(imagePath);
});

app.get('/', (req, res) => {
  res.send('Cards Repo Server is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});