export function formatDuration(ms: number): string {
  if (typeof ms !== "number" || ms < 0) {
    return "00:00:00:000";
  }

  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor(((ms % 3600000) % 60000) / 1000);
  const milliseconds = ms % 1000;

  const pad = (num: number, size = 2) => num.toString().padStart(size, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${milliseconds
    .toString()
    .padStart(3, "0")}`;
}
