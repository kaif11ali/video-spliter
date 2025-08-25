# 🎬 Video Splitter (Intro/Outro Trim) – Node.js + React

Split any long video into equal parts after trimming a configurable intro and outro. Clean, simple UI. Backend uses FFmpeg.

> Inputs: **Video file**, **Intro to remove**, **Outro to remove**, **Clip duration** → Output: **Part-1, Part-2, …** (download individually or as ZIP)

## 🤔 Why Use This Video Splitter?

### 📱 **Perfect for Social Media Content Creation**
- **Instagram Reels/Stories**: Split long videos into 90-second clips for Instagram
- **TikTok Content**: Create multiple short clips from longer recordings
- **YouTube Shorts**: Extract bite-sized content from full videos
- **Twitter/X Videos**: Split content to fit platform time limits

### 🎯 **Smart Intro/Outro Removal**
- **Remove Boring Intros**: Skip channel intros, logos, or setup time
- **Cut Out Outros**: Remove end screens, credits, or subscription reminders  
- **Clean Content**: Get straight to the valuable content without manual editing
- **Batch Processing**: Apply same intro/outro settings to multiple videos

### 💼 **Professional Use Cases**
- **Course Creation**: Split long lectures into digestible modules
- **Podcast Editing**: Create highlight clips from full episodes
- **Webinar Processing**: Extract key segments for marketing
- **Meeting Records**: Split long recordings into topic-based segments

### ⚡ **Why This Tool Over Others?**
- **No Video Size Limits**: Handle large movie files (up to 50GB)
- **High Quality Output**: Preserves original video quality with smart encoding
- **Fast Processing**: Uses FFmpeg with optimized settings for speed
- **Web-Based**: No software installation needed, runs in browser
- **Free & Open Source**: No subscription fees or watermarks
- **Auto-Cleanup**: Manages storage automatically, no manual cleanup needed

### 🎨 **Easy to Use**
- **Drag & Drop**: Simple file upload interface
- **Flexible Time Input**: Use seconds (120) or timestamps (2:00)
- **Real-time Progress**: See processing status with progress bars
- **Bulk Download**: Get all parts as a single ZIP file
- **Preview URLs**: Direct links to individual video parts

---

## 🚀 How to Use This Video Splitter

### 📋 **Step-by-Step Instructions**

#### **1. Setup (One-time)**
```bash
# Clone or download this repository
git clone https://github.com/yourusername/video-spliter.git
cd video-spliter

# Install dependencies for both server and client
npm install

# Start the application
npm run dev
```

#### **2. Open the Application**
- Navigate to **http://localhost:5173** in your browser
- The interface will load with a clean, simple design

#### **3. Upload Your Video**
- **Click** the upload area or **drag and drop** your video file
- **Supported formats**: MP4, AVI, MOV, MKV, and more
- **File size**: Up to 50GB (perfect for movies and long recordings)

#### **4. Configure Split Settings**

**Intro Time** (time to remove from beginning):
```
Examples:
- 30        → Remove first 30 seconds
- 2:00      → Remove first 2 minutes  
- 00:02:30  → Remove first 2 minutes 30 seconds
```

**Outro Time** (time to remove from end):
```
Examples:
- 60        → Remove last 60 seconds
- 1:30      → Remove last 1 minute 30 seconds
- 00:01:00  → Remove last 1 minute
```

**Part Duration** (length of each split):
```
Examples:
- 90        → 90-second clips (perfect for Instagram)
- 3:00      → 3-minute segments
- 00:02:00  → 2-minute parts
```

**Quality Settings**:
- **Fast**: Quick processing, standard quality
- **Medium**: Balanced speed and quality (recommended)
- **High**: Best quality, slower processing

#### **5. Process and Download**
- Click **"Split Video"** to start processing
- Watch the **progress bar** for real-time updates
- **Download individual parts** or get the **complete ZIP file**
- Files are automatically cleaned up after download

### 📝 **Real-World Examples**

#### **Example 1: Instagram Reels from YouTube Video**
```
Input: 10-minute YouTube tutorial
Settings:
- Intro: 30 (skip channel intro)
- Outro: 60 (skip outro/subscribe reminder)  
- Part: 90 (perfect for Instagram Reels)
- Quality: Medium

Output: 6 x 90-second clips ready for Instagram
```

#### **Example 2: Movie Splitting for Storage**
```
Input: 2.5-hour movie file
Settings:
- Intro: 120 (skip opening credits)
- Outro: 300 (skip end credits)
- Part: 1200 (20-minute parts)
- Quality: High

Output: 6 x 20-minute high-quality segments
```

#### **Example 3: Webinar Highlights**
```
Input: 1-hour webinar recording
Settings:
- Intro: 300 (skip intro/tech setup)
- Outro: 180 (skip Q&A/goodbye)
- Part: 180 (3-minute highlight clips)
- Quality: Medium

Output: 12 x 3-minute clips for social sharing
```

---

## 🔧 Advanced Usage & API

### **Manual Server Control**
```bash
# Start only the server
cd server
npm run dev                    # Development mode
npm start                     # Production mode

# Start only the client
cd client  
npm run dev

# Manual cleanup
cd server
npm run cleanup               # Remove all uploaded files
```

### **API Endpoints**

#### **Upload & Split Video**
```bash
POST /api/split
Content-Type: multipart/form-data

Form Data:
- video: [video file]
- intro: "30"           # Seconds or timestamp
- outro: "60"           # Seconds or timestamp  
- part: "90"            # Seconds or timestamp
- quality: "medium"     # fast/medium/high

Response:
{
  "jobId": "abc123"
}
```

#### **Check Progress**
```bash
GET /api/progress/:jobId

Response:
{
  "status": "processing",    # processing/done/error
  "progress": 75,           # 0-100
  "parts": [...],           # Array of part URLs
  "zipUrl": "..."           # Download URL for ZIP
}
```

#### **Manual Cleanup**
```bash
POST /api/cleanup

Response:
{
  "message": "Cleanup completed successfully"
}
```

### **Custom Configuration**

#### **Modify Upload Limits** (server/server.js):
```javascript
// Change file size limit (default: 50GB)
app.use(express.json({ limit: '100gb' }));

// Change timeout (default: 2 hours)
req.setTimeout(4 * 60 * 60 * 1000); // 4 hours
```

#### **Adjust Quality Settings** (server/ffmpeg.js):
```javascript
const qualitySettings = {
  fast: { preset: 'ultrafast', crf: 28 },
  medium: { preset: 'medium', crf: 23 },
  high: { preset: 'slow', crf: 18 },
  custom: { preset: 'veryslow', crf: 15 }  // Add custom quality
};
```

#### **Change Cleanup Timers**:
```javascript
// Auto cleanup interval (default: 30 minutes)
setInterval(cleanupOldFiles, 60 * 60 * 1000); // 1 hour

// File retention time (default: 1 hour)
const oneHourAgo = Date.now() - (2 * 60 * 60 * 1000); // 2 hours
```

---

## ⚙️ Prerequisites & Installation

### **System Requirements**
* **Node.js 18+** - [Download here](https://nodejs.org/)
* **FFmpeg** - Video processing engine
* **4GB+ RAM** - For processing large video files
* **Modern Browser** - Chrome, Firefox, Safari, or Edge

### **FFmpeg Installation**

#### **Windows:**
```bash
# Using Chocolatey (recommended)
choco install ffmpeg

# Or download from: https://ffmpeg.org/download.html
# Add ffmpeg to your system PATH
```

#### **macOS:**
```bash
# Using Homebrew
brew install ffmpeg
```

#### **Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Verify Installation:**
```bash
ffmpeg -version
ffprobe -version
```

### **Quick Setup**
```bash
# 1. Clone the repository
git clone https://github.com/yourusername/video-spliter.git
cd video-spliter

# 2. Install all dependencies
npm install

# 3. Start both server and client
npm run dev
```

**That's it!** Open http://localhost:5173 in your browser.

---

---

## � Troubleshooting

### **Common Issues & Solutions**

#### **❌ "FFmpeg not found" Error**
```bash
# Verify FFmpeg installation
ffmpeg -version

# If not installed, install FFmpeg:
# Windows: choco install ffmpeg
# macOS: brew install ffmpeg  
# Linux: sudo apt install ffmpeg

# Add to PATH if needed (Windows)
# Add C:\ffmpeg\bin to your system PATH
```

#### **❌ Upload Fails / File Too Large**
```bash
# Check file size limit in server/server.js
limits: {
  fileSize: 50 * 1024 * 1024 * 1024, // 50GB
}

# Increase if needed for larger files
```

#### **❌ Processing Takes Too Long**
- Use **"Fast"** quality for quicker processing
- Reduce part duration for smaller segments
- Check if FFmpeg is using hardware acceleration

#### **❌ "Module not found" Errors**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Or install individually
cd server && npm install
cd ../client && npm install
```

#### **❌ Port Already in Use**
```bash
# Kill processes using ports 4000 or 5173
# Windows:
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:4000 | xargs kill -9
```

### **Performance Tips**

#### **🚀 Speed Up Processing**
- Use **stream copy** when possible (exact timestamps)
- Choose **"Fast"** quality for quick previews
- Process smaller sections first to test settings
- Use SSD storage for better I/O performance

#### **💾 Manage Storage**
- Enable automatic cleanup (default: ON)
- Run manual cleanup: `npm run cleanup`
- Monitor disk space for large files
- Use compression for long-term storage

#### **📊 Monitor Progress**
- Check processing status at `/api/progress/:jobId`
- Watch server console for detailed logs
- Use browser dev tools for upload progress

---

## � Project Structure

```
video-splitter/
├─ package.json              # Root dependencies & scripts
├─ README.md                 # This documentation
│
├─ server/                   # Backend (Node.js + Express)
│  ├─ package.json          # Server dependencies
│  ├─ server.js              # Main server & API routes
│  ├─ ffmpeg.js              # Video processing logic
│  ├─ progressStore.js       # Job progress tracking
│  ├─ chunkedUpload.js       # Large file upload handling
│  ├─ utils.js               # Helper functions
│  ├─ cleanup.js             # Manual cleanup script
│  └─ uploads/               # Temporary file storage
│
├─ client/                   # Frontend (React + Vite)
│  ├─ package.json          # Client dependencies
│  ├─ vite.config.js         # Vite configuration
│  ├─ index.html             # HTML template
│  └─ src/
│     ├─ main.jsx            # App entry point
│     ├─ App.jsx             # Main component
│     └─ FileUploadInfo.jsx  # Upload component
```

### **Key Files Explained**

- **`server.js`**: Main API server with upload/progress endpoints
- **`ffmpeg.js`**: Video splitting logic using FFmpeg
- **`progressStore.js`**: Tracks job status and progress
- **`App.jsx`**: React frontend with upload interface
- **`cleanup.js`**: Automatic file cleanup system

---

## 🎯 Use Cases & Examples

### **Content Creators**
- **YouTube → Instagram**: Split long videos into Reels
- **Podcast Highlights**: Extract best moments for social media
- **Course Content**: Break lectures into modules

### **Business Applications**  
- **Meeting Records**: Split by agenda topics
- **Training Videos**: Create bite-sized learning segments
- **Marketing Content**: Extract promotional clips

### **Personal Use**
- **Home Videos**: Split long recordings for sharing
- **Travel Vlogs**: Create highlight reels
- **Event Recording**: Separate ceremony segments

---

## 🔐 Security & Privacy

- **Local Processing**: All video processing happens on your server
- **No Cloud Upload**: Files never leave your system
- **Automatic Cleanup**: Files are automatically deleted after processing
- **No Data Collection**: No user data or analytics collected

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### **Development Setup**
```bash
# Clone your fork
git clone https://github.com/yourusername/video-spliter.git
cd video-spliter

# Install dependencies
npm install

# Start development servers
npm run dev

# Run cleanup (for testing)
cd server && npm run cleanup
```

---

## 📄 License

MIT License - free to use in your projects.

### **What this means:**
- ✅ Use for personal projects
- ✅ Use for commercial applications  
- ✅ Modify and distribute
- ✅ Private use
- ❌ No warranty provided

---

## 🆘 Support

**Need help?**
- 📖 Check the [Troubleshooting](#-troubleshooting) section
- 🐛 Report bugs via [GitHub Issues](https://github.com/yourusername/video-spliter/issues)
- 💡 Request features via [GitHub Discussions](https://github.com/yourusername/video-spliter/discussions)

**Quick Links:**
- [Installation Guide](#-prerequisites--installation)
- [Usage Examples](#-how-to-use-this-video-splitter)
- [API Documentation](#-advanced-usage--api)
- [Troubleshooting](#-troubleshooting)

---

**Made with ❤️ for content creators and developers**
