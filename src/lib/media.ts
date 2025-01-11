export function formatDuration(duration?: number | null): string {
  if (duration === null || duration === undefined) return "--:--";
  duration = Math.floor(duration);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
