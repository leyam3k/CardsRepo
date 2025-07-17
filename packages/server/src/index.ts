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

const dataDir = path.join(__dirname, '../data');
const cardsDir = path.join(dataDir, 'cards');
const tagsFilePath = path.join(dataDir, 'tags.json');

// Ensure data directories exist
fs.mkdir(cardsDir, { recursive: true }).catch(console.error);

// Helper function to read and write to the global tags file
const getGlobalTags = async (): Promise<string[]> => {
    try {
        await fs.access(tagsFilePath);
        const fileContent = await fs.readFile(tagsFilePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        // If the file doesn't exist, return an empty array
        return [];
    }
};

const updateGlobalTags = async (newTags: string[]) => {
    if (newTags.length === 0) return;
    const existingTags = await getGlobalTags();
    const allTags = new Set([...existingTags, ...newTags]);
    await fs.writeFile(tagsFilePath, JSON.stringify(Array.from(allTags).sort(), null, 2));
};

// Helper function to add derived properties for the client
const transformCardDataForClient = (cardData: any) => {
    if (!cardData) return null;

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
    const characterDataString = Png.Parse(buffer.buffer);
    const parsedCharacterData = JSON.parse(characterDataString);

    const cardId = uuidv4();
    const cardDir = path.join(cardsDir, cardId);
    await fs.mkdir(cardDir, { recursive: true });

    // Save the avatar image
    const imageFilePath = path.join(cardDir, 'avatar.png');
    await fs.writeFile(imageFilePath, buffer);

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
    const cardFilePath = path.join(cardDir, 'card.json');
    await fs.writeFile(cardFilePath, JSON.stringify(cardToSave, null, 2));
    
    // Update the global tags list with any new tags from this card
    if (cardToSave.tags.length > 0) {
        await updateGlobalTags(cardToSave.tags);
    }

    res.status(201).json({ message: 'Card uploaded successfully', card: transformCardDataForClient(cardToSave) });
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
    const cardIdFolders = await fs.readdir(cardsDir);
    let cards = await Promise.all(
      cardIdFolders.map(async (cardId) => {
        try {
          const cardJsonPath = path.join(cardsDir, cardId, 'card.json');
          const content = await fs.readFile(cardJsonPath, 'utf-8');
          return JSON.parse(content);
        } catch (error) {
          // Ignore folders that don't contain a valid card.json
          console.error(`Could not read card ${cardId}:`, error);
          return null;
        }
      })
    );

    // Filter out nulls from failed reads and transform data for client
    cards = cards.filter(card => card !== null).map(transformCardDataForClient);

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
        requiredTags.every(reqTag => card.tags?.map((t: string) => t.toLowerCase()).includes(reqTag))
      );
    }
    
    // Apply date range filter
    const { startDate, endDate } = req.query;
    if (startDate) {
        // By appending T00:00:00, we force JS to parse it in the server's local timezone,
        // which we assume is the same as the user's.
        const start = new Date(startDate as string + 'T00:00:00');
        cards = cards.filter(card => card.importDate && new Date(card.importDate) >= start);
    }
    if (endDate) {
        // Set the time to the very end of the selected day.
        const end = new Date(endDate as string + 'T23:59:59');
        cards = cards.filter(card => card.importDate && new Date(card.importDate) <= end);
    }

    // Apply sort order
    const { sortOrder } = req.query;
    if (sortOrder === 'date-asc') {
        cards.sort((a, b) => new Date(a.importDate).getTime() - new Date(b.importDate).getTime());
    } else if (sortOrder === 'date-desc') {
        cards.sort((a, b) => new Date(b.importDate).getTime() - new Date(a.importDate).getTime());
    } else if (sortOrder === 'name-asc') {
        cards.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'name-desc') {
        cards.sort((a, b) => b.name.localeCompare(a.name));
    }


    res.json(cards);
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).send('Internal server error.');
  }
});

app.get('/api/tags', async (req, res) => {
  try {
    const tags = await getGlobalTags();
    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).send('Internal server error.');
  }
});

app.get('/api/cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cardFilePath = path.join(cardsDir, id, 'card.json');
    const content = await fs.readFile(cardFilePath, 'utf-8');
    res.json(transformCardDataForClient(JSON.parse(content)));
  } catch (error) {
    console.error(`Error fetching card ${req.params.id}:`, error);
    res.status(404).send('Card not found.');
  }
});

app.put('/api/cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCardData = req.body;
    const cardFilePath = path.join(cardsDir, id, 'card.json');

    // To prevent partial updates or corruption, read the existing card first.
    const existingContent = await fs.readFile(cardFilePath, 'utf-8');
    const existingCard = JSON.parse(existingContent);

    // Merge new data with existing data
    const newCardData = { ...existingCard, ...updatedCardData, id: id, lastModified: new Date().toISOString() }; // Ensure ID is not changed and update timestamp

    // Write the updated data back to the file
    await fs.writeFile(cardFilePath, JSON.stringify(newCardData, null, 2));

    // Also update the global tag list with any new tags
    if (newCardData.tags && newCardData.tags.length > 0) {
        await updateGlobalTags(newCardData.tags);
    }

    res.json({ message: 'Card updated successfully', card: transformCardDataForClient(newCardData) });
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
        const cardDir = path.join(cardsDir, id);

        // The 'recursive' option will delete the directory and all its contents.
        // The 'force' option suppresses errors if the path does not exist.
        await fs.rm(cardDir, { recursive: true, force: true });

        res.status(200).json({ message: 'Card deleted successfully', cardId: id });
    } catch (error: any) {
        console.error(`Error deleting card ${req.params.id}:`, error);
        res.status(500).send('Internal server error.');
    }
});

app.post('/api/cards/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const sourceCardDir = path.join(cardsDir, id);

    // Check if source card exists
    try {
      await fs.access(sourceCardDir);
    } catch (error) {
      return res.status(404).send('Source card not found.');
    }

    // Generate new ID and directory path
    const newCardId = uuidv4();
    const newCardDir = path.join(cardsDir, newCardId);
    await fs.mkdir(newCardDir, { recursive: true });

    // Copy all files from source to new directory
    const files = await fs.readdir(sourceCardDir);
    for (const file of files) {
      const sourceFile = path.join(sourceCardDir, file);
      const destFile = path.join(newCardDir, file);
      await fs.copyFile(sourceFile, destFile);
    }

    // Read the copied card.json, update its ID, and save it back
    const cardJsonPath = path.join(newCardDir, 'card.json');
    const cardContent = await fs.readFile(cardJsonPath, 'utf-8');
    const cardData = JSON.parse(cardContent);
    cardData.id = newCardId;
    cardData.isCopy = true; // Flag the card as a copy
    cardData.importDate = new Date().toISOString();
    cardData.lastModified = new Date().toISOString();
    await fs.writeFile(cardJsonPath, JSON.stringify(cardData, null, 2));

    res.status(201).json({ message: 'Card duplicated successfully', card: transformCardDataForClient(cardData) });
  } catch (error) {
    console.error(`Error duplicating card ${req.params.id}:`, error);
    res.status(500).send('Internal server error.');
  }
});

app.get('/api/cards/:id/image', async (req, res) => {
    try {
        const { id } = req.params;
        const imagePath = path.join(cardsDir, id, 'avatar.png');
        
        // Check if file exists before sending
        await fs.access(imagePath);
        res.sendFile(imagePath);
    } catch (error) {
        res.status(404).send('Image not found.');
    }
});

app.get('/', (req, res) => {
  res.send('Cards Repo Server is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});