import LogsHTTPs from "../models/logsHTTP.js";
import LogsNetworks from "../models/logsNetwork.js";
import LogsPorts from "../models/logsPort.js";
import LogsServers from "../models/logsServer.js";
import MonitorHTTPs from "../models/monitorHTTP.js";
import MonitorNetworks from "../models/monitorNetwork.js";
import MonitorPorts from "../models/monitorPorts.js";
import MonitorServers from "../models/monitorServer.js";

const GetLogs = async (attribute, type) => {
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

    for (let i = 0; i < attribute.length - 1; i++) {
        let dataPrev = dateFormat.format(attribute[i]?.createdAt).split(" at ");
        let dataNow = dateFormat.format(attribute[i + 1]?.createdAt).split(" at ");

        let timePrev = `${dataPrev[1].split(":")[0]}:${dataPrev[1].split(":")[1]}`;
        let timeNow = `${dataNow[1].split(":")[0]}:${dataNow[1].split(":")[1]}`;

        let logEntry = {
            status: attribute[i]?.status,
            responseTime: attribute[i]?.responseTime,
            date: `${dataPrev[0]}`,
            timeRange: `${timePrev} - ${timeNow}`,
            uptime: attribute[i]?.uptime,
            statusCode: attribute[i]?.statusCode,
        };

        // Tambahkan hanya jika tipe adalah "server"
        if (type === "server") {
            logEntry.cpuUsage = attribute[i]?.cpuUsage;
            logEntry.diskUsage = attribute[i]?.diskUsage;
            logEntry.ramUsage = attribute[i]?.ramUsage;
        }

        uptimeLogs.push(logEntry);
    }

    return uptimeLogs;
};


const GetSummary = async (attribute, type) => {
    const lengthAttribute = attribute.length;
    if (lengthAttribute === 0) return { avgping: 0, avgcpu: 0, avgram: 0, avgdisk: 0 };

    let avgping = 0, avgcpu = 0, avgdisk = 0, avgram = 0;
    let totalCPU = 0, totalDisk = 0, totalRAM = 0;
    let countCPU = 0, countDisk = 0, countRAM = 0;

    for (let i = 0; i < lengthAttribute - 1; i++) {
        avgping += attribute[i]?.responseTime ?? 0;
        
        if(type === "server"){
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
    if (type === "server"){
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

    console.log(summary);
    return summary;
};



export const GetAllMonitorWithLogs = async (req, res) => {    
    try {
        let monitorFinal = null;
        
        let monitorHTTPs = await MonitorHTTPs.findAll({ order: [['createdAt', 'ASC']]});
        monitorHTTPs = monitorHTTPs.map(monitor => ({
            ...monitor.toJSON(),
            uuidMonitors: monitor.uuidHTTPs,
            type: "https"
        }));
        
        let monitorServers = await MonitorServers.findAll({});
        monitorServers = monitorServers.map(monitor => ({
            ...monitor.toJSON(),
            uuidMonitors: monitor.uuidServers,
            type: "server"
        }));
        
        let monitorNetworks = await MonitorNetworks.findAll({});
        monitorNetworks = monitorNetworks.map(monitor => ({
            ...monitor.toJSON(),
            uuidMonitors: monitor.uuidNets,
            type: "network"
        }));

        let monitorPorts = await MonitorPorts.findAll({});
        monitorPorts = monitorPorts.map(monitor => ({
            ...monitor.toJSON(),
            uuidMonitors: monitor.uuidPorts,
            type: "ports"
        }));
        
        monitorFinal = [...monitorHTTPs, ...monitorServers, ...monitorNetworks, ...monitorPorts];
        for(const monitor of monitorFinal){
            const type = monitor.type
            if (type === "https"){
                let uptimeData = await LogsHTTPs.findAll({ 
                    where: { uuidHTTPs: monitor.uuidHTTPs },
                    order: [['createdAt', 'ASC']],
                });

                monitor.logs = await GetLogs(uptimeData, type);
                monitor.summary = await GetSummary(uptimeData, type);
            }
            else if (type === "server"){
                let uptimeData = await LogsServers.findAll({ 
                    where: { uuidServers: monitor.uuidServers },
                    order: [['createdAt', 'ASC']],
                });
                monitor.logs = await GetLogs(uptimeData, type);
                monitor.summary = await GetSummary(uptimeData, type);
            }
            else if (type === "ports"){
                let uptimeData = await LogsPorts.findAll({ 
                    where: { uuidPorts: monitor.uuidPorts },
                    order: [['createdAt', 'ASC']],
                });
                monitor.logs = await GetLogs(uptimeData, type);
                monitor.summary = await GetSummary(uptimeData, type);
            }
            else if (type === "network"){
                let uptimeData = await LogsNetworks.findAll({ 
                    where: { uuidNets: monitor.uuidNets },
                    order: [['createdAt', 'ASC']],
                });
                monitor.logs = await GetLogs(uptimeData, type);
                monitor.summary = await GetSummary(uptimeData, type);
            }
        }

        res.status(200).json(monitorFinal);
    } catch (error) {
        console.log(error);
        res.status(502).json({ msg: error.msg })
    }
}