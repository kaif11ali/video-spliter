import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';
import { parseToSeconds } from './utils.js';
import { initJob, getJob } from './progressStore.js';
import { splitVideo } from './ffmpeg.js';

const app = express();
const PORT = 4000;

// Configure CORS with proper headers for large file uploads
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Content-Length'],
  maxAge: 86400 // 24 hours
}));

// Increase limits for large video files (movies)
app.use(express.json({ limit: '50gb' }));
app.use(express.urlencoded({ extended: true, limit: '50gb' }));

// Increase server timeout for large file uploads (movies)
app.use((req, res, next) => {
  // Set timeout to 2 hours for upload endpoints
  if (req.path === '/api/split') {
    req.setTimeout(2 * 60 * 60 * 1000); // 2 hours
    res.setTimeout(2 * 60 * 60 * 1000); // 2 hours
  }
  next();
});

// Storage for uploads
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
    fileSize: 50 * 1024 * 1024 * 1024, // 50GB limit for movies
    fieldSize: 50 * 1024 * 1024 * 1024 // 50GB field size limit
  }
  // Removed file type validation - accept all file types
});

// Serve generated parts statically
const partsRoot = path.join(uploadDir); // parts folders created under uploads
app.use('/parts', express.static(partsRoot));

app.post('/api/split', (req, res, next) => {
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
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ error: 'No video uploaded' });
    }

    console.log('File received:', {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // File type validation removed - accept all files
    console.log('Processing file of type:', req.file.mimetype);

    const jobId = nanoid();
    initJob(jobId);

    const introSec = parseToSeconds(req.body.intro || '0');
    const outroSec = parseToSeconds(req.body.outro || '0');
    const partSec = parseToSeconds(req.body.part || '180');
    const quality = req.body.quality || 'medium';

    // Validate input values
    if (introSec < 0 || outroSec < 0 || partSec <= 0) {
      fs.unlinkSync(req.file.path); // Clean up uploaded file
      return res.status(400).json({ error: 'Invalid time values. All values must be positive, and part duration must be greater than 0.' });
    }

    const publicBase = `${req.protocol}://${req.get('host')}`;

    console.log('Processing with params:', { introSec, outroSec, partSec, quality });

    // Process asynchronously
    splitVideo({ jobId, inputPath: req.file.path, introSec, outroSec, partSec, quality, publicBase });

    console.log('Job started with ID:', jobId);
    res.json({ jobId });
  } catch (err) {
    console.error('Error in /api/split:', err);
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
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

// Cleanup endpoint to remove old files
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
    
    // Remove files/folders older than 1 hour
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

// Auto cleanup every 30 minutes
setInterval(cleanupOldFiles, 30 * 60 * 1000);

app.listen(PORT, () => console.log(`➡️ Server running on http://localhost:${PORT}`));
