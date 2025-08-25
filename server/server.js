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

app.use(cors());
app.use(express.json());

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
const upload = multer({ storage });

// Serve generated parts statically
const partsRoot = path.join(uploadDir); // parts folders created under uploads
app.use('/parts', express.static(partsRoot));

app.post('/api/split', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No video uploaded' });

    const jobId = nanoid();
    initJob(jobId);

    const introSec = parseToSeconds(req.body.intro || '0');
    const outroSec = parseToSeconds(req.body.outro || '0');
    const partSec  = parseToSeconds(req.body.part || '180');

    const publicBase = `${req.protocol}://${req.get('host')}`;

    // Process asynchronously
    splitVideo({ jobId, inputPath: req.file.path, introSec, outroSec, partSec, publicBase });

    res.json({ jobId });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

app.get('/api/progress/:jobId', (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

app.listen(PORT, () => console.log(`➡️ Server running on http://localhost:${PORT}`));
