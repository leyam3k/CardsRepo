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
const publicDir = path.join(__dirname, '../public'); // Corrected path for public assets
const tagsFilePath = path.join(dataDir, 'tags.json');
const templatesFilePath = path.join(dataDir, 'templates.json');

// Ensure data directories exist
fs.mkdir(cardsDir, { recursive: true }).catch(console.error);
fs.mkdir(publicDir, { recursive: true }).catch(console.error);

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

// Helper functions to read and write templates
const getTemplates = async (): Promise<any[]> => {
    try {
        await fs.access(templatesFilePath);
        const fileContent = await fs.readFile(templatesFilePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        return [];
    }
};

const saveTemplates = async (templates: any[]) => {
    await fs.writeFile(templatesFilePath, JSON.stringify(templates, null, 2));
};

// Helper function to add derived properties for the client
const transformCardDataForClient = (cardData: any) => {
    if (!cardData) return null;

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
      const characterDataString = Png.Parse(buffer.buffer);
      parsedCharacterData = JSON.parse(characterDataString);
    }
    // Handle unsupported file types
    else {
      return res.status(400).send('Unsupported file type. Please upload a .png or .json file.');
    }

    const cardId = uuidv4();
    const cardDir = path.join(cardsDir, cardId);
    await fs.mkdir(cardDir, { recursive: true });

    // Save the avatar image
    const imageFilePath = path.join(cardDir, 'avatar.png');
    if (req.file.mimetype === 'image/png') {
        await fs.writeFile(imageFilePath, buffer);
    } else {
        // For JSON uploads, copy the default avatar.
        const defaultAvatarPath = path.join(publicDir, 'default.png');
        try {
            await fs.copyFile(defaultAvatarPath, imageFilePath);
        } catch (copyError) {
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
        (card.creator && card.creator.toLowerCase().includes(lowerCaseSearchQuery)) ||
        (card.nickname && card.nickname.toLowerCase().includes(lowerCaseSearchQuery)) ||
        (card.character_version && card.character_version.toLowerCase().includes(lowerCaseSearchQuery)) ||
        (card.mes_example && card.mes_example.toLowerCase().includes(lowerCaseSearchQuery)) ||
        (card.system_prompt && card.system_prompt.toLowerCase().includes(lowerCaseSearchQuery)) ||
        (card.post_history_instructions && card.post_history_instructions.toLowerCase().includes(lowerCaseSearchQuery)) ||
        (card.creator_notes && card.creator_notes.toLowerCase().includes(lowerCaseSearchQuery)) ||
        (card.alternate_greetings && card.alternate_greetings.join(' ').toLowerCase().includes(lowerCaseSearchQuery)) ||
        (card.group_only_greetings && card.group_only_greetings.join(' ').toLowerCase().includes(lowerCaseSearchQuery)) ||
        (card.character_book && card.character_book.entries?.some((entry: any) => entry.content?.toLowerCase().includes(lowerCaseSearchQuery) || entry.keys?.join(' ').toLowerCase().includes(lowerCaseSearchQuery)))
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
    const { startDate, endDate, dateFilterType } = req.query;
    const dateField = dateFilterType === 'modification_date' ? 'modification_date' : 'creation_date';

    if (startDate) {
        // By appending T00:00:00, we force JS to parse it in the server's local timezone,
        // which we assume is the same as the user's.
        const start = new Date(startDate as string + 'T00:00:00');
        cards = cards.filter(card => card[dateField] && (card[dateField] * 1000) >= start.getTime());
    }
    if (endDate) {
        // Set the time to the very end of the selected day.
        const end = new Date(endDate as string + 'T23:59:59');
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
    const newCardData = { ...existingCard, ...updatedCardData, id: id, modification_date: Math.floor(Date.now() / 1000) }; // Ensure ID is not changed and update timestamp

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
    cardData.creation_date = Math.floor(Date.now() / 1000);
    cardData.modification_date = Math.floor(Date.now() / 1000);
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

// New endpoint to list files for a specific file type
app.get('/api/cards/:id/files/:fileType', async (req, res) => {
    try {
        const { id, fileType } = req.params;
        const filesDir = path.join(cardsDir, id, fileType);

        // Check if the directory exists
        await fs.access(filesDir);
        const files = await fs.readdir(filesDir);
        res.json(files);
    } catch (error) {
        // If the directory doesn't exist, it means no files have been uploaded yet.
        // This is not an error condition, just return an empty array.
        res.json([]);
    }
});


app.post('/api/cards/:id/upload-file', upload.single('file'), async (req, res) => {
    if (!req.file || !req.body.fileType) {
        return res.status(400).send('No file or fileType specified.');
    }

    const { id } = req.params;
    const { fileType } = req.body; // e.g., 'cardHtml', 'creatorNotesHtml', 'chatsJson'
    const cardDir = path.join(cardsDir, id);
    const filesDir = path.join(cardDir, fileType); // Create a subdirectory for the file type

    // Basic validation for security
    const allowedFileTypes = ['cardHtml', 'creatorNotesHtml', 'chatsJson'];
    if (!allowedFileTypes.includes(fileType)) {
        return res.status(400).send('Invalid file type.');
    }

    try {
        await fs.mkdir(filesDir, { recursive: true }); // Ensure the subdirectory exists
        const filename = req.file.originalname; // Use the original filename
        const filePath = path.join(filesDir, filename);

        // Overwriting is allowed by default, as requested by the client flow
        await fs.writeFile(filePath, req.file.buffer);
        res.status(200).json({ message: `${filename} uploaded successfully.` });
    } catch (error) {
        console.error(`Error uploading file for card ${id}:`, error);
        res.status(500).send('Internal server error.');
    }
});

// Endpoint to get a specific file for viewing or downloading
app.get('/api/cards/:id/file/:fileType/:filename', async (req, res) => {
    try {
        const { id, fileType, filename } = req.params;
        const { action } = req.query; // 'view' or 'download'
        const filePath = path.join(cardsDir, id, fileType, filename);

        await fs.access(filePath); // Check if file exists

        if (action === 'download') {
            // Set headers for download
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        }
        
        // For viewing, we don't set Content-Disposition, so the browser will try to render it.
        // We can also set Content-Type for better browser handling.
        const ext = path.extname(filename).toLowerCase();
        if (ext === '.html') {
            res.setHeader('Content-Type', 'text/html');
        } else if (ext === '.json' || ext === '.jsonl') {
            res.setHeader('Content-Type', 'application/json');
        }
        
        res.sendFile(filePath);
    } catch (error) {
        res.status(404).send('File not found.');
    }
});

// Endpoint to delete a specific file
app.delete('/api/cards/:id/file/:fileType/:filename', async (req, res) => {
    try {
        const { id, fileType, filename } = req.params;
        const filePath = path.join(cardsDir, id, fileType, filename);

        await fs.rm(filePath, { force: true }); // force suppresses error if file doesn't exist
        res.status(200).json({ message: `${filename} deleted successfully.` });
    } catch (error) {
        console.error(`Error deleting ${req.params.filename} for card ${req.params.id}:`, error);
        res.status(500).send('Internal server error.');
    }
});
 
// Template Management Endpoints
app.get('/api/templates', async (req, res) => {
    try {
        const templates = await getTemplates();
        res.json(templates);
    } catch (error) {
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
        newTemplate.id = uuidv4();
        templates.push(newTemplate);
        await saveTemplates(templates);
        
        res.status(201).json(newTemplate);
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
        console.error(`Error deleting template ${req.params.id}:`, error);
        res.status(500).send('Internal server error.');
    }
});

app.get('/', (req, res) => {
  res.send('Cards Repo Server is running!');
});
 
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});