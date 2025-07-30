const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'thoughts-data.json');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('dist')); // Serve built React app

// Initialize data file if it doesn't exist
const initializeDataFile = async () => {
  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    // File doesn't exist, create it with empty array
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
    console.log('Created new thoughts-data.json file');
  }
};

// GET /api/thoughts - Load thoughts from file
app.get('/api/thoughts', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const thoughts = JSON.parse(data);
    res.json({
      success: true,
      thoughts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error reading thoughts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load thoughts',
      thoughts: []
    });
  }
});

// POST /api/thoughts - Save thoughts to file
app.post('/api/thoughts', async (req, res) => {
  try {
    const { thoughts } = req.body;
    
    if (!Array.isArray(thoughts)) {
      return res.status(400).json({
        success: false,
        error: 'Thoughts must be an array'
      });
    }

    // Create backup of current file
    try {
      const currentData = await fs.readFile(DATA_FILE, 'utf8');
      const backupFile = path.join(__dirname, `thoughts-backup-${Date.now()}.json`);
      await fs.writeFile(backupFile, currentData);
    } catch (backupError) {
      console.warn('Could not create backup:', backupError.message);
    }

    // Save new thoughts
    await fs.writeFile(DATA_FILE, JSON.stringify(thoughts, null, 2));
    
    res.json({
      success: true,
      message: 'Thoughts saved successfully',
      timestamp: new Date().toISOString(),
      count: thoughts.length
    });
    
    console.log(`Saved ${thoughts.length} thoughts at ${new Date().toLocaleTimeString()}`);
  } catch (error) {
    console.error('Error saving thoughts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save thoughts'
    });
  }
});

// GET /api/status - Check server status
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'Thoughts Graph API is running',
    timestamp: new Date().toISOString(),
    dataFile: DATA_FILE
  });
});

// Catch-all handler for React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
const startServer = async () => {
  await initializeDataFile();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Thoughts Graph server running on http://0.0.0.0:${PORT}`);
    console.log(`📁 Data file: ${DATA_FILE}`);
    console.log(`🌐 Accessible from network devices on port ${PORT}`);
  });
};

startServer().catch(console.error);
