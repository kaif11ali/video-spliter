import React, { useState, useEffect } from 'react'

const API = 'http://localhost:4000';

export default function App() {
  const [video, setVideo] = useState(null)
  const [intro, setIntro] = useState('0')
  const [outro, setOutro] = useState('0')
  const [part, setPart] = useState('180')
  const [jobId, setJobId] = useState(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('idle')
  const [links, setLinks] = useState([])
  const [zip, setZip] = useState(null)

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
    setStatus('uploading')

    const fd = new FormData()
    fd.append('video', video)
    fd.append('intro', intro)
    fd.append('outro', outro)
    fd.append('part', part)

    const res = await fetch(`${API}/api/split`, { method: 'POST', body: fd })
    const data = await res.json()
    if (data.error) return alert(data.error)
    setJobId(data.jobId)
    setStatus('processing')
    setProgress(0)
    setLinks([])
    setZip(null)
  }

  const disabled = status === 'uploading' || status === 'processing'

  return (
    <div className="wrap">
      <div className="card">
        <h1>Video Splitter</h1>
        <p className="muted">Trim intro/outro and split into equal parts for Reels, Shorts, Stories, etc.</p>

        <form onSubmit={onSubmit}>
          <div style={{margin:'18px 0'}}>
            <label>Upload Video</label>
            <input type="file" accept="video/*" onChange={e=>setVideo(e.target.files[0])} disabled={disabled} />
          </div>

          <div className="grid">
            <div>
              <label>Intro to remove (sec or mm:ss)</label>
              <input type="text" placeholder="e.g. 120 or 2:00" value={intro} onChange={e=>setIntro(e.target.value)} disabled={disabled} />
            </div>
            <div>
              <label>Outro to remove (sec or mm:ss)</label>
              <input type="text" placeholder="e.g. 180 or 3:00" value={outro} onChange={e=>setOutro(e.target.value)} disabled={disabled} />
            </div>
          </div>

          <div style={{marginTop:16}}>
            <label>Clip duration (sec or mm:ss)</label>
            <input type="text" placeholder="e.g. 90 or 1:30" value={part} onChange={e=>setPart(e.target.value)} disabled={disabled} />
          </div>

          <div className="row" style={{marginTop:18}}>
            <button className="btn" disabled={disabled}>Split Video</button>
            {status !== 'idle' && (
              <div style={{minWidth:200}}>
                <div className="progress"><div className="bar" style={{width: `${progress}%`}} /></div>
                <small style={{color:'#94a3b8'}}>{status} • {progress}%</small>
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

        <footer>Tip: For Instagram Reels, use 90s. For YT Shorts, 60s. Accepts formats like <strong>120</strong> or <strong>2:00</strong>.</footer>
      </div>
    </div>
  )
}
