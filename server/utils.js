export function parseToSeconds(value) {
  // Accepts: "120", "2:00", "00:02:00"
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const s = String(value).trim();
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const parts = s.split(':').map(Number); // [hh?, mm, ss]
  if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
  if (parts.length === 2) return parts[0]*60 + parts[1];
  return 0;
}

export function secondsToTimestamp(sec) {
  sec = Math.max(0, Math.floor(sec));
  const h = String(Math.floor(sec / 3600)).padStart(2, '0');
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}
