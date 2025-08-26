# 🎬 Video Splitter

Split long videos into equal parts after trimming intro and outro. Simple UI with FFmpeg backend.

## Features

- **Trim & Split**: Remove intro/outro, then split into equal parts
- **Large Files**: Handle up to 50GB video files
- **Quality Options**: Fast, medium, or high quality processing
- **Auto Cleanup**: Automatic file management
- **Web Interface**: No software installation needed

## Quick Start

```bash
# Install dependencies
npm run install:all

# Start the application
npm run dev
```

Open **http://localhost:5173** in your browser.

## Usage

1. **Upload** your video file (drag & drop or click)
2. **Set intro time** to remove from beginning (e.g., `30` or `0:30`)
3. **Set outro time** to remove from end (e.g., `60` or `1:00`)
4. **Set part duration** for each clip (e.g., `600` or `10:00`)
5. **Choose quality** (fast/medium/high)
6. **Click Split** and wait for processing
7. **Download** individual parts or ZIP file

## Time Format

Supports multiple formats:
- **Seconds**: `30`, `600`
- **MM:SS**: `2:30`, `10:00`
- **HH:MM:SS**: `0:02:30`, `0:10:00`

## Requirements

- **Node.js** 16+
- **FFmpeg** installed and in PATH

## Scripts

```bash
npm run dev          # Start both server and client
npm run build        # Build client for production
npm run clean        # Clean uploads and dependencies
```

## API Endpoints

- `POST /api/split` - Upload and process video
- `GET /api/progress/:jobId` - Check processing status
- `POST /api/cleanup` - Manual cleanup
