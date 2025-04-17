const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { processImage, savePixelData } = require('./imageProcessor');
const { convertPixelsToBlocks } = require('./claudeIntegration');
const { createBot, getBuildProgress } = require('./minecraftBot');

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Set up static file serving
app.use(express.static(path.join(__dirname, '..', 'public')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    
    // Create the uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'image-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Initialize the Minecraft bot
let minecraftBot;
try {
  minecraftBot = createBot({
    host: process.env.MC_HOST || 'localhost',
    port: parseInt(process.env.MC_PORT || '25565'),
    username: process.env.MC_USERNAME || 'PixelArtBot',
    version: process.env.MC_VERSION || '1.19.2'
  });
  
  console.log('Minecraft bot initialized');
} catch (error) {
  console.error('Failed to initialize Minecraft bot:', error);
}

// Route for image uploads
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }
    
    const imagePath = req.file.path;
    console.log(`Image uploaded to: ${imagePath}`);
    
    // Process the image
    console.log('Processing image...');
    const pixelData = await processImage(imagePath);
    
    // Save the pixel data to a file
    const fileId = path.basename(imagePath, path.extname(imagePath));
    const pixelDataPath = await savePixelData(pixelData, fileId);
    console.log(`Pixel data saved to: ${pixelDataPath}`);
    
    // Convert pixel data to Minecraft blocks
    console.log('Converting pixels to blocks...');
    const blocksGrid = await convertPixelsToBlocks(pixelData.grid);
    
    // Save the blocks data to a file
    const blocksDataPath = path.join(__dirname, '..', 'uploads', `${fileId}-blocks.json`);
    await fs.promises.writeFile(blocksDataPath, JSON.stringify(blocksGrid, null, 2));
    console.log(`Blocks data saved to: ${blocksDataPath}`);
    
    // Start building the image in Minecraft
    if (minecraftBot) {
      console.log('Starting Minecraft build...');
      
      // Start the build process in the background
      minecraftBot.buildImage(blocksGrid, {
        startX: 0,
        startY: 64,
        startZ: 0,
        orientation: 'vertical',  // Build as a vertical wall
        delay: 250 // Quarter second between block placements
      }).catch(err => {
        console.error('Error during Minecraft build:', err);
      });
      
      return res.json({ 
        status: 'success', 
        message: 'Image processed and build started',
        imageId: fileId
      });
    } else {
      return res.json({ 
        status: 'success', 
        message: 'Image processed, but Minecraft bot is not available',
        imageId: fileId
      });
    }
  } catch (error) {
    console.error('Error processing upload:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: `Failed to process image: ${error.message}` 
    });
  }
});

// Route for getting build progress
app.get('/progress', (req, res) => {
  const progress = getBuildProgress();
  res.json(progress);
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ status: 'error', message: err.message });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 