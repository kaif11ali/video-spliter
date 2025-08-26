import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { secondsToTimestamp } from './utils.js';
import { setProgress, setStatus, setParts, setZip, setError } from './progressStore.js';

// Configure FFmpeg paths
try {
  ffmpeg.setFfmpegPath('ffmpeg');
  ffmpeg.setFfprobePath('ffprobe');
} catch (error) {
  const ffmpegPath = process.env.FFMPEG_PATH || 'C:\\ffmpeg-7.1.1-full_build\\bin\\ffmpeg.exe';
  const ffprobePath = process.env.FFPROBE_PATH || 'C:\\ffmpeg-7.1.1-full_build\\bin\\ffprobe.exe';
  ffmpeg.setFfmpegPath(ffmpegPath);
  ffmpeg.setFfprobePath(ffprobePath);
}

export function getDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error('FFprobe error:', err);
        return reject(new Error('Failed to analyze video file. Please ensure FFmpeg is installed.'));
      }
      const duration = metadata.format?.duration || 0;
      if (duration <= 0) {
        return reject(new Error('Invalid video file or zero duration.'));
      }
      resolve(duration);
    });
  });
}

export async function splitVideo({ jobId, inputPath, introSec, outroSec, partSec, quality = 'medium', publicBase }) {
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
    
    // Get the input video name without extension for part naming
    const inputVideoName = path.parse(inputPath).name;

    for (let i = 0; i < partsCount; i++) {
      const partStartFromTrimmed = i * partSec; // within trimmed section
      const absoluteStart = start + partStartFromTrimmed;
      const duration = Math.min(partSec, usableDur - partStartFromTrimmed);
      const out = path.join(outputDir, `${inputVideoName}_part_${String(i+1).padStart(3, '0')}.mp4`);

      // Use stream copying for faster processing when possible
      const needsReencoding = (absoluteStart % 1 !== 0) || (duration % 1 !== 0);
      
      // Quality presets
      const qualitySettings = {
        fast: { preset: 'ultrafast', crf: 28 },
        medium: { preset: 'medium', crf: 23 },
        high: { preset: 'slow', crf: 18 }
      };
      
      await new Promise((resolve, reject) => {
        const command = ffmpeg(inputPath)
          .setStartTime(secondsToTimestamp(absoluteStart))
          .duration(duration);
        
        if (needsReencoding) {
          const settings = qualitySettings[quality] || qualitySettings.medium;
          command.outputOptions([
            '-c:v libx264', 
            `-preset ${settings.preset}`,
            `-crf ${settings.crf}`,
            '-c:a aac', 
            '-movflags +faststart'
          ]);
        } else {
          command.outputOptions([
            '-c copy',
            '-avoid_negative_ts make_zero'
          ]);
        }
        
        command
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

    // Clean up original uploaded file after successful processing
    try {
      fs.unlinkSync(inputPath);
    } catch (cleanupErr) {
      console.warn('Could not clean up original file:', cleanupErr.message);
    }

    // Clean up individual part files after creating zip (keep only the zip)
    try {
      for (const part of parts) {
        if (fs.existsSync(part.file)) {
          fs.unlinkSync(part.file);
          console.log('Cleaned up part file:', path.basename(part.file));
        }
      }
      console.log('Successfully cleaned up all part files, keeping only the zip');
    } catch (cleanupErr) {
      console.warn('Could not clean up part files:', cleanupErr.message);
    }

    // Schedule cleanup of the entire output directory after 1 hour to give users time to download
    setTimeout(() => {
      try {
        if (fs.existsSync(outputDir)) {
          fs.rmSync(outputDir, { recursive: true, force: true });
          console.log('Cleaned up entire output directory:', path.basename(outputDir));
        }
      } catch (cleanupErr) {
        console.warn('Could not clean up output directory:', cleanupErr.message);
      }
    }, 60 * 60 * 1000); // 1 hour delay
  } catch (err) {
    console.error('Video processing error:', err);
    setError(jobId, err.message || err);
    
    // Clean up original uploaded file on error
    try {
      if (fs.existsSync(inputPath)) {
        fs.unlinkSync(inputPath);
      }
    } catch (cleanupErr) {
      console.warn('Could not clean up original file after error:', cleanupErr.message);
    }
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
