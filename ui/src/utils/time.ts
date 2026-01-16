export function formatTime(minutes: number): string {
  if (!minutes || minutes === 0) {
    return "0 小时";
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes} 分钟`;
  } else if (remainingMinutes === 0) {
    return `${hours} 小时`;
  } else {
    return `${hours} 小时 ${remainingMinutes} 分钟`;
  }
}