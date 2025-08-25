# 🎬 Video Splitter (Intro/Outro Trim) – Node.js + React

Split any long video into equal parts after trimming a configurable intro and outro. Clean, simple UI. Backend uses FFmpeg.

> Inputs: **Video file**, **Intro to remove**, **Outro to remove**, **Clip duration** → Output: **Part-1, Part-2, …** (download individually or as ZIP)

---

## 🧱 Project Structure

```
video-splitter/
├─ server/
│  ├─ package.json
│  ├─ server.js
│  ├─ progressStore.js
│  ├─ ffmpeg.js
│  ├─ utils.js
│  └─ uploads/           # temp uploads
│
├─ client/
│  ├─ package.json
│  ├─ vite.config.js
│  ├─ index.html
│  └─ src/
│     ├─ main.jsx
│     └─ App.jsx
│
└─ README.md
```

---

## ⚙️ Prerequisites

* **Node.js 18+**
* **FFmpeg** installed and available in PATH (`ffmpeg`, `ffprobe`)

Verify:

```bash
ffmpeg -version
ffprobe -version
```

---

## 🚀 Quick Start

```bash
# 1) Backend
cd server
npm i
npm run dev

# 2) Frontend (new terminal)
cd ../client
npm i
npm run dev
```

* Server runs on **[http://localhost:4000](http://localhost:4000)**
* Client runs on **[http://localhost:5173](http://localhost:5173)** (Vite)

> The client is configured to call the server at `http://localhost:4000`.

---

## 📌 Notes & Tips

* **Intro/Outro inputs** accept seconds (`120`) or timestamps (`2:00` / `00:02:00`).
* Backend uses **re-encode (libx264 + aac)** to ensure exact cuts and compatibility with Instagram.
* Output files are stored under `server/uploads/<original>_parts/` and served at `http://localhost:4000/parts/...`.
* You can customize encoding options in `ffmpeg.js`.

---

## 🧪 Test Scenarios

1. Movie with 2 min intro, 3 min outro, parts of 180s.
2. Reel workflow: set part to 90s.
3. Edge case: Short video where intro+outro ≥ duration → returns error.

---

## 🛡️ License
MIT – free to use in your projects.
