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