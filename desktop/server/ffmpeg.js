const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { secondsToTimestamp } = require('./utils.js');
const { setProgress, setStatus, setParts, setZip, setError } = require('./progressStore.js');

// Configure FFmpeg paths using bundled binaries
try {
  // Try to use bundled static binaries first
  const ffmpegStatic = require('ffmpeg-static');
  const ffprobeStatic = require('ffprobe-static');
  
  ffmpeg.setFfmpegPath(ffmpegStatic);
  ffmpeg.setFfprobePath(ffprobeStatic.path);
} catch (error) {
  console.log('Static binaries not found, trying system FFmpeg...');
  try {
    ffmpeg.setFfmpegPath('ffmpeg');
    ffmpeg.setFfprobePath('ffprobe');
  } catch (systemError) {
    console.log('System FFmpeg not found, trying fallback paths...');
    const ffmpegPath = process.env.FFMPEG_PATH || 'C:\\ffmpeg-7.1.1-full_build\\bin\\ffmpeg.exe';
    const ffprobePath = process.env.FFPROBE_PATH || 'C:\\ffmpeg-7.1.1-full_build\\bin\\ffprobe.exe';
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath);
  }
}

function getDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error('FFprobe error:', err);
        // Provide more specific error message
        if (err.message && err.message.includes('ENOENT')) {
          return reject(new Error('FFmpeg not found. Please contact support if this error persists.'));
        } else if (err.message && err.message.includes('Invalid data')) {
          return reject(new Error('Invalid or corrupted video file. Please try a different file.'));
        } else {
          return reject(new Error('Failed to analyze video file. Please ensure the file is a valid video format.'));
        }
      }
      const duration = metadata.format?.duration || 0;
      if (duration <= 0) {
        return reject(new Error('Invalid video file or zero duration.'));
      }
      resolve(duration);
    });
  });
}

async function splitVideo({ jobId, inputPath, introSec, outroSec, partSec, quality = 'medium', publicBase, clipName = 'clip', zipName = 'output' }) {
  try {
    setStatus(jobId, 'processing');

    const totalDur = await getDuration(inputPath); // seconds
    const start = Math.min(introSec, Math.max(0, totalDur));
    const endCut = Math.min(outroSec, Math.max(0, totalDur));
    const usableDur = Math.max(0, totalDur - start - endCut);
    if (usableDur <= 1) throw new Error('Usable duration is too short after trimming intro/outro.');

    const partsCount = Math.ceil(usableDur / partSec);
    
    // For desktop files, create output in uploads directory to be accessible via HTTP
    let outputDir;
    if (inputPath.includes('uploads')) {
      // Web upload - create output next to uploaded file
      outputDir = path.join(path.dirname(inputPath), path.parse(inputPath).name + '_parts');
    } else {
      // Desktop file - create output in uploads directory for HTTP access
      const uploadsDir = path.join(process.cwd(), 'uploads');
      fs.mkdirSync(uploadsDir, { recursive: true });
      outputDir = path.join(uploadsDir, path.parse(inputPath).name + '_parts');
    }
    
    fs.mkdirSync(outputDir, { recursive: true });

    const parts = [];
    
    // Use custom clip name or fallback to original video name
    const videoClipName = clipName || path.parse(inputPath).name || 'clip';

    for (let i = 0; i < partsCount; i++) {
      const partStartFromTrimmed = i * partSec; // within trimmed section
      const absoluteStart = start + partStartFromTrimmed;
      const duration = Math.min(partSec, usableDur - partStartFromTrimmed);
      const out = path.join(outputDir, `${videoClipName}_${String(i+1).padStart(3, '0')}.mp4`);

      // Use stream copying for faster processing when possible
      // Round to nearest keyframe for better stream copy compatibility
      const keyframeStart = Math.round(absoluteStart);
      const keyframeDuration = Math.round(duration);
      // Only reencode if we need precise cuts or format conversion
      const needsReencoding = Math.abs(absoluteStart - keyframeStart) > 2 || 
                             Math.abs(duration - keyframeDuration) > 2;
      
      console.log(`Processing part ${i+1}/${partsCount}, ${needsReencoding ? 'reencoding' : 'stream copying'}, duration: ${duration}s`);
      
      // Quality presets optimized for speed while maintaining quality
      const qualitySettings = {
        fast: { preset: 'ultrafast', crf: 28 },
        medium: { preset: 'fast', crf: 23 },      
        high: { preset: 'fast', crf: 18 }         // Changed from 'medium' to 'fast' for speed
      };
      
      const startTime = Date.now();
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
            '-movflags +faststart',
            '-threads 0',                 // Use all available CPU threads
            '-tune zerolatency',          // Optimize for speed
            '-x264-params keyint=30:min-keyint=15'  // Optimize keyframes for faster seeking
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

      const processingTime = Date.now() - startTime;
      console.log(`Part ${i+1} completed in ${processingTime}ms (${(processingTime/1000).toFixed(1)}s)`);

      const publicUrl = `${publicBase}/parts/${path.basename(outputDir)}/${path.basename(out)}`;
      parts.push({ file: out, url: publicUrl, duration });
      setProgress(jobId, Math.round(((i + 1) / partsCount) * 100));
    }

    setParts(jobId, parts);

    // Create zip with custom name
    const zipFileName = `${zipName || 'output'}.zip`;
    const zipPath = path.join(outputDir, zipFileName);
    console.log('Debug - Creating zip:', {
      zipName: zipName,
      zipFileName: zipFileName,
      zipPath: zipPath
    });
    await zipFiles(parts.map(p => p.file), zipPath);
    const zipUrl = `${publicBase}/parts/${path.basename(outputDir)}/${path.basename(zipPath)}`;
    setZip(jobId, zipUrl);

    setStatus(jobId, 'done');

    // Clean up original uploaded file after successful processing (only if it was uploaded, not desktop file)
    if (inputPath.includes('uploads')) {
      try {
        fs.unlinkSync(inputPath);
      } catch (cleanupErr) {
        console.warn('Could not clean up original file:', cleanupErr.message);
      }
    }

    // Don't clean up individual part files - keep them for individual downloads
    console.log('Successfully created zip file and kept individual parts for download');

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
    
    // Clean up original uploaded file on error (only if it was uploaded, not desktop file)
    if (inputPath.includes('uploads')) {
      try {
        if (fs.existsSync(inputPath)) {
          fs.unlinkSync(inputPath);
        }
      } catch (cleanupErr) {
        console.warn('Could not clean up original file after error:', cleanupErr.message);
      }
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

module.exports = { getDuration, splitVideo };
