const store = new Map();

function initJob(jobId) {
  store.set(jobId, { percent: 0, status: 'queued', parts: [], zipPath: null, error: null });
}

function setProgress(jobId, percent) {
  const job = store.get(jobId);
  if (!job) return;
  job.percent = Math.min(100, Math.max(0, percent));
}

function setStatus(jobId, status) {
  const job = store.get(jobId);
  if (!job) return;
  job.status = status;
}

function setParts(jobId, parts) {
  const job = store.get(jobId);
  if (!job) return;
  job.parts = parts;
}

function setZip(jobId, zipPath) {
  const job = store.get(jobId);
  if (!job) return;
  job.zipPath = zipPath;
}

function setError(jobId, error) {
  const job = store.get(jobId);
  if (!job) return;
  job.error = String(error);
  job.status = 'error';
}

function getJob(jobId) {
  return store.get(jobId) || null;
}

module.exports = { initJob, setProgress, setStatus, setParts, setZip, setError, getJob };
