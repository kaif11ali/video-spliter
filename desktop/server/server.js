const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { nanoid } = require('nanoid');
const { parseToSeconds } = require('./utils.js');
const { initJob, getJob } = require('./progressStore.js');
const { splitVideo } = require('./ffmpeg.js');
const net = require('net');

const app = express();
let PORT = 4000;

// Function to check if port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}

// Function to find an available port
async function findAvailablePort(startPort = 4000) {
  let port = startPort;
  while (port < startPort + 100) {
    if (await isPortAvailable(port)) {
      return port;
    }
    port++;
  }
  throw new Error('No available port found');
}

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4000', 'http://localhost:4001', 'http://localhost:4002'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Content-Length'],
  maxAge: 86400
}));

app.use(express.json({ limit: '50gb' }));
app.use(express.urlencoded({ extended: true, limit: '50gb' }));

app.use((req, res, next) => {
  if (req.path === '/api/split') {
    req.setTimeout(2 * 60 * 60 * 1000);
    res.setTimeout(2 * 60 * 60 * 1000);
    res.setTimeout(2 * 60 * 60 * 1000); // 2 hours
  }
  next();
});

const uploadDir = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const base = path.parse(file.originalname).name.replace(/[^a-z0-9_-]/gi, '_');
    cb(null, base + '_' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 * 1024,
    fieldSize: 50 * 1024 * 1024 * 1024
  }
});

const partsRoot = path.join(uploadDir);
app.use('/parts', express.static(partsRoot));

app.post('/api/split', (req, res, next) => {
  // Check if this is a desktop upload (file path provided)
  if (req.body.isDesktopUpload === 'true' && req.body.filePath) {
    // Skip multer for desktop uploads
    return next();
  }
  
  // Use multer for web uploads
  upload.single('video')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 50GB.' });
      }
      return res.status(400).json({ error: 'Upload failed: ' + err.message });
    }
    next();
  });
}, async (req, res) => {
  console.log('Upload request received');
  try {
    let inputPath, fileName, fileSize;
    
    if (req.body.isDesktopUpload === 'true' && req.body.filePath) {
      // Desktop upload: use provided file path
      inputPath = req.body.filePath;
      fileName = req.body.fileName;
      
      // Verify file exists
      if (!fs.existsSync(inputPath)) {
        return res.status(400).json({ error: 'File not found: ' + inputPath });
      }
      
      const stats = fs.statSync(inputPath);
      fileSize = stats.size;
      
      console.log('Desktop file:', {
        filename: fileName,
        path: inputPath,
        size: fileSize
      });
    } else {
      // Web upload: use uploaded file
      if (!req.file) {
        console.log('No file in request');
        return res.status(400).json({ error: 'No video uploaded' });
      }
      
      inputPath = req.file.path;
      fileName = req.file.filename;
      fileSize = req.file.size;
      
      console.log('File received:', {
        filename: fileName,
        size: fileSize,
        mimetype: req.file.mimetype
      });
    }

    const jobId = nanoid();
    initJob(jobId);

    const introSec = parseToSeconds(req.body.intro || '0');
    const outroSec = parseToSeconds(req.body.outro || '0');
    const partSec = parseToSeconds(req.body.part || '180');
    const quality = req.body.quality || 'medium';

    if (introSec < 0 || outroSec < 0 || partSec <= 0) {
      // Only delete file if it was uploaded (not desktop file)
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Invalid time values. All values must be positive, and part duration must be greater than 0.' });
    }

    const publicBase = `${req.protocol}://${req.get('host')}`;
    console.log('Processing with params:', { introSec, outroSec, partSec, quality });

    splitVideo({ jobId, inputPath, introSec, outroSec, partSec, quality, publicBase });

    console.log('Job started with ID:', jobId);
    res.json({ jobId });
  } catch (err) {
    console.error('Error in /api/split:', err);
    // Only delete file if it was uploaded (not desktop file)
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: String(err.message || err) });
  }
});

app.get('/api/progress/:jobId', (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

app.post('/api/cleanup', (req, res) => {
  try {
    cleanupOldFiles();
    res.json({ message: 'Cleanup completed successfully' });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Cleanup failed: ' + error.message });
  }
});

// Function to clean up old files
function cleanupOldFiles() {
  const uploadsPath = path.join(process.cwd(), 'uploads');
  
  if (!fs.existsSync(uploadsPath)) {
    return;
  }

  const items = fs.readdirSync(uploadsPath);
  let cleanedCount = 0;

  items.forEach(item => {
    const itemPath = path.join(uploadsPath, item);
    const stats = fs.statSync(itemPath);
    
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    if (stats.mtime.getTime() < oneHourAgo) {
      try {
        if (stats.isDirectory()) {
          fs.rmSync(itemPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(itemPath);
        }
        cleanedCount++;
        console.log(`Cleaned up old file/folder: ${item}`);
      } catch (err) {
        console.warn(`Could not clean up ${item}:`, err.message);
      }
    }
  });

  console.log(`Cleanup completed. Removed ${cleanedCount} items.`);
}

setInterval(cleanupOldFiles, 30 * 60 * 1000);

// Start server with dynamic port finding
async function startServer() {
  try {
    PORT = await findAvailablePort(4000);
    const server = app.listen(PORT, () => {
      console.log(`➡️ Server running on http://localhost:${PORT}`);
    });
    
    // Handle server errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is busy, trying another port...`);
        server.close();
        startServer();
      } else {
        console.error('Server error:', err);
      }
    });
    
    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Export the server startup function
if (require.main === module) {
  startServer();
} else {
  module.exports = { app, startServer };
}
