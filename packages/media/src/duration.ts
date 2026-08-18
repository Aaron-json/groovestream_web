export function formatDuration(duration?: number | null): string {
  if (duration === null || duration === undefined) return "--:--";
  const secondsTotal = Math.floor(duration);
  const minutes = Math.floor(secondsTotal / 60);
  const seconds = secondsTotal % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
