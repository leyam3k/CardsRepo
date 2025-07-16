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

// Helper function to ensure data consistency for the client
const transformCardData = (cardData: any) => {
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
    const characterData = Png.Parse(buffer.buffer);
    const cardId = uuidv4();
    const imageFilename = `${cardId}.png`; // Assuming the uploaded file is always a PNG

    // Save character data as JSON
    const cardFilePath = path.join(cardsDir, `${cardId}.json`);
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

    await fs.writeFile(cardFilePath, JSON.stringify(cardToSave, null, 2));

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
    let cards = await Promise.all(
      files
        .filter(file => file.endsWith('.json'))
        .map(async file => {
          const filePath = path.join(cardsDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          return transformCardData(JSON.parse(content));
        })
    );

    // Apply search query 'q'
    const searchQuery = req.query.q as string;
    if (searchQuery) {
      const lowerCaseSearchQuery = searchQuery.toLowerCase();
      cards = cards.filter(card =>
        card.name.toLowerCase().includes(lowerCaseSearchQuery) ||
        (card.description && card.description.toLowerCase().includes(lowerCaseSearchQuery)) ||
        (card.creator && card.creator.toLowerCase().includes(lowerCaseSearchQuery))
      );
    }

    // Apply tag filter 'tags'
    const tagsQuery = req.query.tags as string;
    if (tagsQuery) {
      const requiredTags = tagsQuery.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean);
      cards = cards.filter(card =>
        requiredTags.every(reqTag => card.tags.map((t: string) => t.toLowerCase()).includes(reqTag))
      );
    }

    res.json(cards);
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).send('Internal server error.');
  }
});

app.get('/api/tags', async (req, res) => {
  try {
    const files = await fs.readdir(cardsDir);
    const allTags = new Set<string>();

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(cardsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const cardData = JSON.parse(content);
        if (cardData.tags && Array.isArray(cardData.tags)) {
          cardData.tags.forEach((tag: string) => allTags.add(tag));
        }
      }
    }
    res.json(Array.from(allTags).sort());
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).send('Internal server error.');
  }
});

app.get('/api/cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cardFilePath = path.join(cardsDir, `${id}.json`);
    const content = await fs.readFile(cardFilePath, 'utf-8');
    res.json(transformCardData(JSON.parse(content)));
  } catch (error) {
    console.error(`Error fetching card ${req.params.id}:`, error);
    res.status(404).send('Card not found.');
  }
});

app.put('/api/cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCardData = req.body;
    const cardFilePath = path.join(cardsDir, `${id}.json`);

    // Check if the card exists
    await fs.access(cardFilePath);

    // Ensure the ID in the body matches the param ID
    if (updatedCardData.id !== id) {
      return res.status(400).send('Card ID in body does not match route parameter.');
    }

    // Write the updated data back to the file
    await fs.writeFile(cardFilePath, JSON.stringify(updatedCardData, null, 2));
    res.json({ message: 'Card updated successfully', cardId: id });
  } catch (error: any) {
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
    const cardFilePath = path.join(cardsDir, `${id}.json`);
    const imageFilePath = path.join(imagesDir, `${id}.png`); // Assuming image filename matches card ID

    // Check if card and image exist before attempting to delete
    await fs.access(cardFilePath);
    try {
      await fs.access(imageFilePath);
    } catch (imageError) {
      console.warn(`Image file for card ${id} not found, skipping deletion:`, imageError);
    }

    await fs.unlink(cardFilePath); // Delete card JSON
    if (await fs.access(imageFilePath).then(() => true).catch(() => false)) { // Check again in case of race condition
      await fs.unlink(imageFilePath); // Delete associated image
    }

    res.json({ message: 'Card deleted successfully', cardId: id });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return res.status(404).send('Card not found.');
    }
    console.error(`Error deleting card ${req.params.id}:`, error);
    res.status(500).send('Internal server error.');
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