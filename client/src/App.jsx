import React, { useState, useEffect } from 'react'
import FileUploadInfo from './FileUploadInfo.jsx'

const API = 'http://localhost:4000';

export default function App() {
  const [video, setVideo] = useState(null)
  const [intro, setIntro] = useState('0')
  const [outro, setOutro] = useState('0')
  const [part, setPart] = useState('600') // 10 minutes default for movies
  const [quality, setQuality] = useState('medium') // fast, medium, high
  const [clipName, setClipName] = useState('')
  const [zipName, setZipName] = useState('')
  const [jobId, setJobId] = useState(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('idle')
  const [links, setLinks] = useState([])
  const [zip, setZip] = useState(null)

  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    if (!jobId) return
    const t = setInterval(async () => {
      const res = await fetch(`${API}/api/progress/${jobId}`)
      const data = await res.json()
      setProgress(data.percent || 0)
      setStatus(data.status || 'idle')
      setLinks(data.parts?.map(p => p.url) || [])
      setZip(data.zipPath || null)
    }, 1000)
    return () => clearInterval(t)
  }, [jobId])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!video) return alert('Please choose a video file')
    
    // Check file size (50GB limit for movies)
    const maxSize = 50 * 1024 * 1024 * 1024; // 50GB in bytes
    if (video.size > maxSize) {
      return alert('File too large! Maximum size is 50GB. Please choose a smaller file.')
    }
    
    // Warn for very large files (movies)
    if (video.size > 5 * 1024 * 1024 * 1024) { // 5GB
      const sizeGB = (video.size / (1024 * 1024 * 1024)).toFixed(1);
      const proceed = confirm(`This is a large movie file (${sizeGB}GB). Upload and processing may take several hours. Do you want to continue?`);
      if (!proceed) return;
    }
    
    setStatus('uploading')
    setUploadProgress(0)

    const fd = new FormData()
    fd.append('video', video)
    fd.append('intro', intro)
    fd.append('outro', outro)
    fd.append('part', part)
    fd.append('quality', quality)
    if (clipName.trim()) fd.append('clipName', clipName.trim())
    if (zipName.trim()) fd.append('zipName', zipName.trim())

    // Track upload progress
    const xhr = new XMLHttpRequest()
    
    // Set timeout for large files (2 hours for movies)
    xhr.timeout = 2 * 60 * 60 * 1000;
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100
        setUploadProgress(Math.round(percentComplete))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText)
          if (data.error) {
            alert(`Error: ${data.error}`)
            setStatus('idle')
            return
          }
          setJobId(data.jobId)
          setStatus('processing')
          setProgress(0)
          setLinks([])
          setZip(null)
        } catch (err) {
          console.error('Failed to parse response:', err)
          alert('Upload failed: Invalid response from server')
          setStatus('idle')
        }
      } else {
        console.error('Upload failed with status:', xhr.status, xhr.responseText)
        let errorMessage = `Upload failed: ${xhr.status} ${xhr.statusText}`;
        try {
          const errorData = JSON.parse(xhr.responseText);
          if (errorData.error) {
            errorMessage = `Upload failed: ${errorData.error}`;
          }
        } catch (e) {
          // Keep the original error message if parsing fails
        }
        alert(errorMessage)
        setStatus('idle')
      }
    })

    xhr.addEventListener('error', (e) => {
      console.error('Upload error:', e)
      alert('Upload failed: Network error')
      setStatus('idle')
    })

    xhr.addEventListener('timeout', () => {
      console.error('Upload timeout')
      alert('Upload failed: Request timeout')
      setStatus('idle')
    })

    xhr.open('POST', `${API}/api/split`)
    xhr.send(fd)
  }

  const disabled = status === 'uploading' || status === 'processing'

  return (
    <div className="wrap">
      <div className="card">
        <h1>Video Splitter</h1>
        <p className="muted">Upload videos and split them into smaller parts. Perfect for social media, courses, and content creation.</p>

        <form onSubmit={onSubmit}>
          <div style={{margin:'18px 0'}}>
            <label>Upload Video/Movie File</label>
            <input type="file" onChange={e=>setVideo(e.target.files[0])} disabled={disabled} />
            <FileUploadInfo file={video} />
          </div>

          <div className="grid">
            <div>
              <label>Intro to remove (sec or mm:ss or hh:mm:ss)</label>
              <input type="text" placeholder="e.g. 300 or 5:00 or 0:05:00" value={intro} onChange={e=>setIntro(e.target.value)} disabled={disabled} />
            </div>
            <div>
              <label>Outro to remove (sec or mm:ss or hh:mm:ss)</label>
              <input type="text" placeholder="e.g. 600 or 10:00 or 0:10:00" value={outro} onChange={e=>setOutro(e.target.value)} disabled={disabled} />
            </div>
          </div>

          <div style={{marginTop:16}}>
            <label>Clip duration (sec or mm:ss or hh:mm:ss)</label>
            <input type="text" placeholder="e.g. 600 or 10:00 or 0:10:00" value={part} onChange={e=>setPart(e.target.value)} disabled={disabled} />
          </div>

          <div style={{marginTop:16}}>
            <label>Processing Speed</label>
            <select value={quality} onChange={e=>setQuality(e.target.value)} disabled={disabled}>
              <option value="fast">Fast (Lower Quality)</option>
              <option value="medium">Medium (Balanced)</option>
              <option value="high">High (Best Quality)</option>
            </select>
          </div>

          <div className="grid" style={{marginTop:16}}>
            <div>
              <label>Video Clip Name (optional)</label>
              <input type="text" placeholder="e.g. my_movie_clip" value={clipName} onChange={e=>setClipName(e.target.value)} disabled={disabled} />
              <small style={{color:'#94a3b8'}}>Default: clip</small>
            </div>
            <div>
              <label>ZIP File Name (optional)</label>
              <input type="text" placeholder="e.g. my_movie_parts" value={zipName} onChange={e=>setZipName(e.target.value)} disabled={disabled} />
              <small style={{color:'#94a3b8'}}>Default: output</small>
            </div>
          </div>

          <div className="row" style={{marginTop:18}}>
            <button className="btn" disabled={disabled}>Split Video</button>
            {status !== 'idle' && (
              <div style={{minWidth:200}}>
                <div className="progress"><div className="bar" style={{width: `${status === 'uploading' ? uploadProgress : progress}%`}} /></div>
                <small style={{color:'#94a3b8'}}>
                  {status === 'uploading' ? `Uploading ${uploadProgress}%` : `${status} • ${progress}%`}
                </small>
              </div>
            )}
          </div>
        </form>

        {links.length > 0 && (
          <div style={{marginTop:18}} className="downloads">
            <h3>Downloads</h3>
            {zip && <a href={zip} target="_blank">Download all (ZIP)</a>}
            {links.map((url, i) => (
              <a key={i} href={url} target="_blank">Part {i+1}</a>
            ))}
          </div>
        )}

        <footer>
          <strong>Movie Tips:</strong> For 3-hour movies, use 10-15 minute parts (600-900s). 
          Supports formats like <strong>600</strong>, <strong>10:00</strong>, or <strong>0:10:00</strong>. 
          Maximum file size: 50GB.
        </footer>
      </div>
    </div>
  )
}
