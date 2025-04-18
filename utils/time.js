export const getFormattedCurrentTime = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(now.getDate()).padStart(2, '0');

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export const calculateDuration = (date) => {
    const now = Date.now();
    let diff = now - date;
    
    if (diff <= 0) return "0m"; 
    
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const hours = Math.floor((diff / 1000 / 60 / 60) % 24);
    const days = Math.floor(diff / 1000 / 60 / 60 / 24);
    
    let result = [];
    if (days > 0) result.push(`${days}d`);
    if (hours > 0) result.push(`${hours}h`);
    if (minutes > 0 || result.length === 0) result.push(`${minutes}m`);
    
    return result.join(" ");
};

export const formatMillisecondsToHHMM = (ms) => {
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const paddedHours = String(hours).padStart(2, '0');
    const paddedMinutes = String(minutes).padStart(2, '0');
    return `${paddedHours}:${paddedMinutes}`;
};

export const parseDuration = (durationString) => {
    let days = 0, hours = 0, minutes = 0;

    const dayMatch = durationString.match(/(\d+)\s*d/);
    if (dayMatch) days = parseInt(dayMatch[1]);

    const hourMatch = durationString.match(/(\d+)\s*h/);
    if (hourMatch) hours = parseInt(hourMatch[1]);

    const minuteMatch = durationString.match(/(\d+)\s*m/);
    if (minuteMatch) minutes = parseInt(minuteMatch[1]);
    
    return days * 1440 + hours * 60 + minutes;
}