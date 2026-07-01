export function cssHexColor(hexColor) {
  return `#${hexColor.toString(16).padStart(6, "0")}`;
}

export function formatAge(seconds) {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
}

export function visibleActivityLabel(text, isRunning) {
  return isRunning ? `RUNNING - ${text}` : text;
}
