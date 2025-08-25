import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

const uploadSessions = new Map();

export function initChunkedUpload(filename, totalSize, chunkSize = 1024 * 1024) { // 1MB chunks
  const sessionId = nanoid();
  const uploadDir = path.join(process.cwd(), 'uploads');
  const tempPath = path.join(uploadDir, `temp_${sessionId}`);
  
  uploadSessions.set(sessionId, {
    filename,
    totalSize,
    chunkSize,
    tempPath,
    uploadedChunks: 0,
    totalChunks: Math.ceil(totalSize / chunkSize),
    completed: false
  });
  
  return sessionId;
}

export function uploadChunk(sessionId, chunkIndex, chunkData) {
  const session = uploadSessions.get(sessionId);
  if (!session) throw new Error('Upload session not found');
  
  const chunkPath = `${session.tempPath}_chunk_${chunkIndex}`;
  fs.writeFileSync(chunkPath, chunkData);
  
  session.uploadedChunks++;
  
  // Check if all chunks are uploaded
  if (session.uploadedChunks === session.totalChunks) {
    return combineChunks(sessionId);
  }
  
  return {
    progress: (session.uploadedChunks / session.totalChunks) * 100,
    completed: false
  };
}

function combineChunks(sessionId) {
  const session = uploadSessions.get(sessionId);
  const finalPath = path.join(process.cwd(), 'uploads', `${session.filename}_${Date.now()}`);
  const writeStream = fs.createWriteStream(finalPath);
  
  for (let i = 0; i < session.totalChunks; i++) {
    const chunkPath = `${session.tempPath}_chunk_${i}`;
    const chunkData = fs.readFileSync(chunkPath);
    writeStream.write(chunkData);
    fs.unlinkSync(chunkPath); // Clean up chunk
  }
  
  writeStream.end();
  session.completed = true;
  session.finalPath = finalPath;
  
  return {
    progress: 100,
    completed: true,
    filePath: finalPath
  };
}

export function getUploadProgress(sessionId) {
  const session = uploadSessions.get(sessionId);
  if (!session) return null;
  
  return {
    progress: (session.uploadedChunks / session.totalChunks) * 100,
    completed: session.completed,
    filePath: session.finalPath
  };
}
