import React, { useState } from 'react'
import FileUploadInfo from './FileUploadInfo.jsx'

export default function App() {
  const [video, setVideo] = useState(null)
  const [intro, setIntro] = useState('0')
  const [outro, setOutro] = useState('0')
  const [part, setPart] = useState('600') // 10 minutes default for movies
  const [quality, setQuality] = useState('medium') // fast, medium, high
  const [status, setStatus] = useState('idle')
  const [showDemo, setShowDemo] = useState(false)

  const onSubmit = (e) => {
    e.preventDefault()
    if (!video) return alert('Please choose a video file to see the demo!')
    
    // Show demo notification
    setShowDemo(true)
    alert('🎬 This is a static demo! In the full desktop application, your video would be processed and split into smaller parts. Download the Windows app to try the real functionality!')
  }

  const disabled = false // Never disable in demo

  return (
    <div className="wrap">
      <div className="card">
        <h1>Video Splitter Demo</h1>
        <p className="muted">This is a demo interface. Upload a video to see how the app works, then download the desktop version for real video processing.</p>
        
        {showDemo && (
          <div className="demo-notice">
            <h3>🎬 Demo Mode Active</h3>
            <p>In the real desktop app, your video would be processed now! Your file would be split into {part} second parts with intro/outro removal.</p>
            <div className="demo-features">
              <div>✅ Supports large video files (up to 50GB)</div>
              <div>✅ Multiple quality options</div>
              <div>✅ Batch processing</div>
              <div>✅ Progress tracking</div>
              <div>✅ Download individual parts or zip</div>
            </div>
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div style={{margin:'18px 0'}}>
            <label>Upload Video/Movie File</label>
            <input 
              type="file" 
              accept="video/*"
              onChange={e=>setVideo(e.target.files[0])} 
              disabled={disabled} 
            />
            <FileUploadInfo file={video} />
          </div>

          <div className="grid">
            <div>
              <label>Intro to remove (sec or mm:ss or hh:mm:ss)</label>
              <input 
                type="text" 
                placeholder="e.g. 300 or 5:00 or 0:05:00" 
                value={intro} 
                onChange={e=>setIntro(e.target.value)} 
                disabled={disabled} 
              />
            </div>
            <div>
              <label>Outro to remove (sec or mm:ss or hh:mm:ss)</label>
              <input 
                type="text" 
                placeholder="e.g. 600 or 10:00 or 0:10:00" 
                value={outro} 
                onChange={e=>setOutro(e.target.value)} 
                disabled={disabled} 
              />
            </div>
          </div>

          <div style={{marginTop:16}}>
            <label>Clip duration (sec or mm:ss or hh:mm:ss)</label>
            <input 
              type="text" 
              placeholder="e.g. 600 or 10:00 or 0:10:00" 
              value={part} 
              onChange={e=>setPart(e.target.value)} 
              disabled={disabled} 
            />
          </div>

          <div style={{marginTop:16}}>
            <label>Processing Speed</label>
            <select value={quality} onChange={e=>setQuality(e.target.value)} disabled={disabled}>
              <option value="fast">Fast (Lower Quality)</option>
              <option value="medium">Medium (Balanced)</option>
              <option value="high">High (Best Quality)</option>
            </select>
          </div>

          <div className="row" style={{marginTop:18}}>
            <button className="btn" disabled={disabled}>Try Demo</button>
            <div className="demo-info">
              <small style={{color:'#94a3b8'}}>
                This is a demo interface - download the desktop app for real functionality
              </small>
            </div>
          </div>
        </form>

        <div className="download-section">
          <h3>Get the Full Desktop Application</h3>
          <p>Download the Windows desktop app to:</p>
          <ul>
            <li>Process real video files up to 50GB</li>
            <li>Split movies into perfect clips for social media</li>
            <li>Remove intros and outros automatically</li>
            <li>Choose processing speed and quality</li>
            <li>Download individual parts or complete ZIP</li>
          </ul>
          <div style={{marginTop: '1rem'}}>
            <a 
              href="https://github.com/kaif11ali/video-spliter/releases/download/v.1/Video.Splitter-win32-x64.zip" 
              className="download-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              📥 Download for Windows
            </a>
            <a 
              href="https://github.com/kaif11ali/video-spliter" 
              className="source-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              💻 View Source Code
            </a>
          </div>
        </div>

        <footer>
          <strong>Movie Tips:</strong> For 3-hour movies, use 10-15 minute parts (600-900s). 
          Supports formats like <strong>600</strong>, <strong>10:00</strong>, or <strong>0:10:00</strong>. 
          Maximum file size: 50GB.
        </footer>
      </div>
    </div>
  )
}
