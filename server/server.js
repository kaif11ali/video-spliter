import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';
import { parseToSeconds } from './utils.js';
import { initJob, getJob } from './progressStore.js';
import { splitVideo } from './ffmpeg.js';

function sanitizeFileName(name) {
  if (!name || typeof name !== 'string') return 'default';
  return name
    .replace(/[<>:"/\\|?*]/g, '')  // Remove invalid characters
    .replace(/\s+/g, '_')          // Replace spaces with underscores
    .replace(/[^\w\-_.]/g, '')     // Keep only word characters, hyphens, underscores, dots
    .slice(0, 50)                  // Limit length
    .replace(/^\.+|\.+$/g, '')     // Remove leading/trailing dots
    || 'default';                  // Fallback if empty
}

const app = express();
const PORT = 4000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Content-Length'],
  maxAge: 86400
}));

app.use(express.json({ limit: '50gb' }));
app.use(express.urlencoded({ extended: true, limit: '50gb' }));

app.use((req, res, next) => {
  if (req.path === '/api/split') {
    req.setTimeout(2 * 60 * 60 * 1000);
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

    const jobId = nanoid();
    initJob(jobId);

    const introSec = parseToSeconds(req.body.intro || '0');
    const outroSec = parseToSeconds(req.body.outro || '0');
    const partSec = parseToSeconds(req.body.part || '180');
    const quality = req.body.quality || 'medium';
    const clipName = sanitizeFileName(req.body.clipName || 'clip');
    const zipName = sanitizeFileName(req.body.zipName || 'output');

    if (introSec < 0 || outroSec < 0 || partSec <= 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Invalid time values. All values must be positive, and part duration must be greater than 0.' });
    }

    const publicBase = `${req.protocol}://${req.get('host')}`;
    console.log('Processing with params:', { introSec, outroSec, partSec, quality, clipName, zipName });

    splitVideo({ jobId, inputPath: req.file.path, introSec, outroSec, partSec, quality, publicBase, clipName, zipName });

    console.log('Job started with ID:', jobId);
    res.json({ jobId });
  } catch (err) {
    console.error('Error in /api/split:', err);
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

app.listen(PORT, () => console.log(`➡️ Server running on http://localhost:${PORT}`));
