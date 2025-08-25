import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { secondsToTimestamp } from './utils.js';
import { setProgress, setStatus, setParts, setZip, setError } from './progressStore.js';

// Configure FFmpeg paths
ffmpeg.setFfmpegPath('C:\\ffmpeg-7.1.1-full_build\\bin\\ffmpeg.exe');
ffmpeg.setFfprobePath('C:\\ffmpeg-7.1.1-full_build\\bin\\ffprobe.exe');

export function getDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const duration = metadata.format?.duration || 0;
      resolve(duration);
    });
  });
}

export async function splitVideo({ jobId, inputPath, introSec, outroSec, partSec, publicBase }) {
  try {
    setStatus(jobId, 'processing');

    const totalDur = await getDuration(inputPath); // seconds
    const start = Math.min(introSec, Math.max(0, totalDur));
    const endCut = Math.min(outroSec, Math.max(0, totalDur));
    const usableDur = Math.max(0, totalDur - start - endCut);
    if (usableDur <= 1) throw new Error('Usable duration is too short after trimming intro/outro.');

    const partsCount = Math.ceil(usableDur / partSec);
    const outputDir = path.join(path.dirname(inputPath), path.parse(inputPath).name + '_parts');
    fs.mkdirSync(outputDir, { recursive: true });

    const parts = [];

    for (let i = 0; i < partsCount; i++) {
      const partStartFromTrimmed = i * partSec; // within trimmed section
      const absoluteStart = start + partStartFromTrimmed;
      const duration = Math.min(partSec, usableDur - partStartFromTrimmed);
      const out = path.join(outputDir, `part_${String(i+1).padStart(3, '0')}.mp4`);

      // Use keyframe-safe copying when possible; fallback to re-encode for exact cuts
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .setStartTime(secondsToTimestamp(absoluteStart))
          .duration(duration)
          .outputOptions(['-c:v libx264', '-c:a aac', '-movflags +faststart'])
          .output(out)
          .on('end', resolve)
          .on('error', reject)
          .run();
      });

      const publicUrl = `${publicBase}/parts/${path.basename(outputDir)}/${path.basename(out)}`;
      parts.push({ file: out, url: publicUrl, duration });
      setProgress(jobId, Math.round(((i + 1) / partsCount) * 100));
    }

    setParts(jobId, parts);

    // Zip them
    const zipPath = path.join(outputDir, 'clips.zip');
    await zipFiles(parts.map(p => p.file), zipPath);
    const zipUrl = `${publicBase}/parts/${path.basename(outputDir)}/${path.basename(zipPath)}`;
    setZip(jobId, zipUrl);

    setStatus(jobId, 'done');
  } catch (err) {
    setError(jobId, err.message || err);
  }
}

function zipFiles(files, zipPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    archive.on('error', reject);

    archive.pipe(output);
    for (const f of files) archive.file(f, { name: path.basename(f) });
    archive.finalize();
  });
}
