// In-memory progress store keyed by jobId.
const store = new Map();

export function initJob(jobId) {
  store.set(jobId, { percent: 0, status: 'queued', parts: [], zipPath: null, error: null });
}
export function setProgress(jobId, percent) {
  const j = store.get(jobId); if (!j) return; j.percent = Math.min(100, Math.max(0, percent));
}
export function setStatus(jobId, status) { const j = store.get(jobId); if (!j) return; j.status = status; }
export function setParts(jobId, parts) { const j = store.get(jobId); if (!j) return; j.parts = parts; }
export function setZip(jobId, zipPath) { const j = store.get(jobId); if (!j) return; j.zipPath = zipPath; }
export function setError(jobId, error) { const j = store.get(jobId); if (!j) return; j.error = String(error); j.status = 'error'; }
export function getJob(jobId) { return store.get(jobId) || null; }
