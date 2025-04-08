import ping from "ping";
import axios from "axios";
import { performance } from 'perf_hooks';

export const ConvertLocaleStringToMS = (data) => {
    let [ datePart, timePart ] = data.split(", ");

    let [day, month, year] = datePart.split("/").map(Number);

    let [hour, minute, second] = timePart.split(".").map(Number);

    let timeZone = "Asia/Bangkok";
    let dateInUTC7 = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

    let timestamp = dateInUTC7.getTime();

    return timestamp;
};

export const ConvertUptimeToMs = (data) => {
    let str = data.replace(/\D/g, " ")
    let [ day, hour, min ] = str.split("  ").map(String);

    day = day * 24 * 60 * 60 * 1000;
    hour = hour * 60 * 60 * 1000;
    min = min * 60 * 1000;

    let total = day + hour + min;
    return total;
}

export const ConvertMStoFormatUptime = (ms) => {
    let days = Math.floor(ms / (24 * 60 * 60 * 1000));
    ms %= (24 * 60 * 60 * 1000);

    let hours = Math.floor(ms / (60 * 60 * 1000));
    ms %= (60 * 60 * 1000);

    let minutes = Math.floor(ms / (60 * 1000));

    return `${days}d ${hours}h ${minutes}m`;
};

export const HandleUptimeWithStatusCheck = (data) => {
    let prefix = data.replace(/[^a-zA-z]/g, "");
    let number = data.replace(/\D/g, "");

    if ( prefix === "M" ){
        return `0d 0h ${number}m`
    } else if ( prefix === "S" ){
        return `0d 0h 1m`;
    } else if ( prefix === "H" ){
        return `0d ${number}h 0m`;
    }
}

export const ArrayUptimeLogs = async (attribute, type) => {
    const dateFormat = new Intl.DateTimeFormat('en-GB', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    let uptimeLogs = [];
    if (!attribute?.length) return uptimeLogs;

    // Helper: Mengurangi menit dari tanggal
    const subtractMinutes = (date, minutes) => {
        return new Date(date.getTime() - minutes * 60000);
    };

    // Helper: Mengambil nilai menit dari statusCheck (misal "15m")
    const parseStatusCheck = (statusCheck) => {
        if (!statusCheck) return 5; // default 5 menit
        const match = statusCheck.match(/(\d+)\s*m/);
        return match ? parseInt(match[1], 10) : 5;
    };

    // Pastikan array attribute diurutkan berdasarkan createdAt secara ascending
    attribute.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Jika hanya ada 1 log
    if (attribute.length === 1) {
        const log = attribute[0];
        const minutesToSubtract = parseStatusCheck(log.statusCheck);
        const endDate = new Date(log.createdAt);
        const startDate = subtractMinutes(endDate, minutesToSubtract);

        // Mengambil jam dan menit dari startDate dan endDate
        const startTime = dateFormat
            .format(startDate)
            .split(' at ')[1]
            .split(':')
            .slice(0, 2)
            .join(':');
        const endTime = dateFormat
            .format(endDate)
            .split(' at ')[1]
            .split(':')
            .slice(0, 2)
            .join(':');

        let uptimeClean = log.uptime;
        if (type === 'devices' && log.uptime) {
            uptimeClean = log.uptime.split(' ').filter(p => !p.endsWith('s')).join(' ');
        }

        uptimeLogs.push({
            status: log.status,
            responseTime: log.responseTime,
            date: dateFormat.format(endDate),
            timeRange: `${startTime} - ${endTime}`,
            uptime: uptimeClean,
            statusCode: log.statusCode,
            ...(type === 'devices' && {
                cpuUsage: log.cpuUsage,
                diskUsage: log.diskUsage,
                ramUsage: log.ramUsage,
            })
        });
    } else {
        // Jika ada lebih dari 1 log
        for (let i = 0; i < attribute.length; i++) {
            const log = attribute[i];
            const endDate = new Date(log.createdAt);
            let startDate;

            if (i === 0) {
                // Untuk log pertama, gunakan statusCheck (atau default 5 menit)
                const minutesToSubtract = parseStatusCheck(log.statusCheck);
                startDate = subtractMinutes(endDate, minutesToSubtract);
            } else {
                // Untuk log berikutnya, ambil createdAt log sebelumnya
                startDate = new Date(attribute[i - 1].createdAt);
            }

            const startTime = dateFormat
                .format(startDate)
                .split(' at ')[1]
                .split(':')
                .slice(0, 2)
                .join(':');
            const endTime = dateFormat
                .format(endDate)
                .split(' at ')[1]
                .split(':')
                .slice(0, 2)
                .join(':');

            let uptimeClean = log.uptime;

            uptimeLogs.push({
                status: log.status,
                responseTime: log.responseTime,
                date: dateFormat.format(endDate),
                timeRange: `${startTime} - ${endTime}`,
                uptime: uptimeClean,
                statusCode: log.statusCode,
                ...(type === 'devices' && {
                    cpuUsage: log.cpuUsage,
                    diskUsage: log.diskUsage,
                    ramUsage: log.ramUsage,
                })
            });
        }
    }

    return uptimeLogs;
};

export const ArraySummaryLogs = async (attribute, type) => {
    const lengthAttribute = attribute.length;
    if (lengthAttribute === 0) return { avgping: 0, avgcpu: 0, avgram: 0, avgdisk: 0 };

    let avgping = 0, avgcpu = 0, avgdisk = 0, avgram = 0;
    let totalCPU = 0, totalDisk = 0, totalRAM = 0;
    let countCPU = 0, countDisk = 0, countRAM = 0;

    for (let i = 0; i < lengthAttribute - 1; i++) {
        avgping += attribute[i]?.responseTime ?? 0;
        
        if(type === "devices"){
            // Handle CPU Usage
            let tempCPU = attribute[i]?.cpuUsage;
            if (tempCPU && tempCPU !== "N/A") {  // Pastikan tempCPU tidak undefined
                tempCPU = parseFloat(tempCPU.replace('%', '')) || 0;
                totalCPU += tempCPU;
                countCPU++;
            }
    
            // Handle Disk Usage
            let tempDisk = attribute[i]?.diskUsage;
            if (tempDisk && tempDisk !== "N/A") {  // Pastikan tempDisk tidak undefined
                tempDisk = parseFloat(tempDisk.replace('%', '')) || 0;
                totalDisk += tempDisk;
                countDisk++;
            }
    
            // Handle RAM Usage
            let tempRAM = attribute[i]?.ramUsage;
            if (tempRAM && tempRAM !== "N/A") {  // Pastikan tempRAM tidak undefined
                tempRAM = parseFloat(tempRAM.replace('%', '')) || 0;
                totalRAM += tempRAM;
                countRAM++;
            }
        }
    }

    // Hitung rata-rata, pastikan tidak membagi dengan nol
    avgping = lengthAttribute > 1 ? avgping / (lengthAttribute - 1) : 0;
    if (type === "devices"){
        avgcpu = countCPU > 0 ? totalCPU / countCPU : 0;
        avgdisk = countDisk > 0 ? totalDisk / countDisk : 0;
        avgram = countRAM > 0 ? totalRAM / countRAM : 0;

        const summary = {
            avgping: avgping.toFixed(2),
            avgcpu: avgcpu.toFixed(2),
            avgram: avgram.toFixed(2),
            avgdisk: avgdisk.toFixed(2),
        }
        return summary;
    }

    const summary = {
        avgping: avgping.toFixed(2),
    };

    return summary;
};

export const pingDevicesWithRetry = async (ip, retries = 3, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
        const devicesResponse = await ping.promise.probe(ip, { timeout: 2 });
        if (devicesResponse.alive) {
            return devicesResponse;
        }
        console.log(`[${new Date().toLocaleString()}] - Retry ${i + 1}: Devices masih DOWN (${ip})`);
        await new Promise(res => setTimeout(res, delay)); 
    }
    return { alive: false };
};

export const pingHTTPWithRetry = async (ip, retries = 3, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
        const pingResponse = await ping.promise.probe(ip, { timeout: 2 });
        if (pingResponse.alive) {
            return pingResponse;
        }
        console.log(`[${new Date().toLocaleString()}] - Retry ${i + 1}: HTTP DOWN (${ip})`);
        await new Promise(res => setTimeout(res, delay));
    }
    return { alive: false, time: 0 };
};

export const fetchHTTPWithRetry = async (url, retries = 3, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
        try {
            const start = performance.now();
            const HTTPResponse = await axios.get(url, { timeout: 5000 });
            const end = performance.now();
            const responseTime = Math.round(end - start); // ms

            return {
                ...HTTPResponse,
                responseTime
            };
        } catch (error) {
            console.log(`[${new Date().toLocaleString()}] - Retry ${i + 1}: Gagal akses HTTP (${url})`);
            await new Promise(res => setTimeout(res, delay));
        }
    }
    console.log((`[${new Date().toLocaleString()}] - HTTP request gagal setelah beberapa percobaan.`));
    return null;
};

