import React, { useState } from 'react';

export default function FileUploadInfo({ file }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!file) return null;

  const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
  const estimatedUploadTime = calculateUploadTime(file.size);
  const estimatedProcessTime = calculateProcessTime(file.size);

  return (
    <div style={{ 
      background: '#f8fafc', 
      padding: '12px', 
      borderRadius: '6px', 
      margin: '12px 0',
      fontSize: '14px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span><strong>{file.name}</strong> ({fileSizeMB} MB)</span>
        <button 
          type="button" 
          onClick={() => setShowDetails(!showDetails)}
          style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}
        >
          {showDetails ? 'Hide' : 'Show'} estimates
        </button>
      </div>
      
      {showDetails && (
        <div style={{ marginTop: '8px', color: '#64748b' }}>
          <div>📤 Upload time: {estimatedUploadTime}</div>
          <div>⚡ Processing time: {estimatedProcessTime}</div>
          <div style={{ fontSize: '12px', marginTop: '4px', fontStyle: 'italic' }}>
            *Times are estimates for the desktop app based on average speeds
          </div>
        </div>
      )}
      
      <div style={{ 
        marginTop: '8px', 
        padding: '8px', 
        background: '#fef3cd', 
        borderRadius: '4px',
        fontSize: '12px',
        color: '#664d03' 
      }}>
        📝 This is a demo - real processing happens in the desktop app!
      </div>
    </div>
  );
}

function calculateUploadTime(fileSize) {
  const fileSizeMB = fileSize / (1024 * 1024);
  
  // More realistic upload speed estimates (in Mbps)
  const avgSpeedMbps = 25; // Assume 25 Mbps average
  const timeInSeconds = (fileSizeMB * 8) / avgSpeedMbps;
  
  if (timeInSeconds < 60) return `${Math.round(timeInSeconds)}s`;
  if (timeInSeconds < 3600) return `${Math.round(timeInSeconds / 60)}m`;
  return `${Math.round(timeInSeconds / 3600)}h ${Math.round((timeInSeconds % 3600) / 60)}m`;
}

function calculateProcessTime(fileSize) {
  const fileSizeMB = fileSize / (1024 * 1024);
  
  // More realistic processing time for movies: ~3 minutes per GB
  const timePerGB = 3; // minutes
  const estimatedMinutes = (fileSizeMB / 1024) * timePerGB;
  
  if (estimatedMinutes < 1) return `${Math.round(estimatedMinutes * 60)}s`;
  if (estimatedMinutes < 60) return `${Math.round(estimatedMinutes)}m`;
  return `${Math.round(estimatedMinutes / 60)}h ${Math.round(estimatedMinutes % 60)}m`;
}
