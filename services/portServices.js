import LogsPorts from "../models/logsPort.js";
import MonitorPorts from "../models/monitorPorts.js";
import { HandleUptimeWithStatusCheck, pingTCPWithRetry, pingUDPWithRetry } from "../utils/logsHelper.js";
import { HandleOngoingIncidentsPorts, HandleResolvedIncidentsPorts } from "./portIncidents.js";

const ConvertUptimeToMs = (uptimeStr) => {
    if (!uptimeStr || uptimeStr === "N/A") return 0;
    const regex = /(\d+)\s*d\s+(\d+)\s*h\s+(\d+)\s*m\s+(\d+)\s*s/;
    const matches = uptimeStr.match(regex);
    if (!matches) return 0;
    const days = Number(matches[1]);
    const hours = Number(matches[2]);
    const minutes = Number(matches[3]);
    const seconds = Number(matches[4]);
    return (days * 24 * 60 * 60 * 1000) +
           (hours * 60 * 60 * 1000) +
           (minutes * 60 * 1000) +
           (seconds * 1000);
};

const ConvertMStoFormatUptime = (ms) => {
    if (!ms || ms < 0) return "0d 0h 0m 0s";
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const remainderAfterDays = ms % (24 * 60 * 60 * 1000);
    const hours = Math.floor(remainderAfterDays / (60 * 60 * 1000));
    const remainderAfterHours = remainderAfterDays % (60 * 60 * 1000);
    const minutes = Math.floor(remainderAfterHours / (60 * 1000));
    const seconds = Math.floor((remainderAfterHours % (60 * 1000)) / 1000);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

const CalculateUptimePorts = async (attribute) => {
    try {
        const monitor = await MonitorPorts.findOne({
            where: { uuidPorts: attribute.uuidPorts }
        });
    
        const LogsData = await LogsPorts.findOne({ 
            where: { uuidPorts: attribute.uuidPorts }, 
            order: [['createdAt', 'DESC']] 
        });

        if (!monitor) {
            throw new Error("Tidak ada Monitor!");
        }
    
        if (!LogsData) {
            return HandleUptimeWithStatusCheck(attribute.statusCheck);
        }
    
        let uptimePrev = LogsData.uptime;
        const prevCreatedTime = new Date(LogsData.createdAt).getTime();
        const nowTime = Date.now();
    
        if (uptimePrev !== "N/A") {
            const uptimePrevMs = ConvertUptimeToMs(uptimePrev);
            const elapsedTime = nowTime - prevCreatedTime;
            const totalUptimeMs = uptimePrevMs + elapsedTime;
            return ConvertMStoFormatUptime(totalUptimeMs);
        } else {
            return HandleUptimeWithStatusCheck(attribute.statusCheck);
        }
        
    } catch (error) {
        
    }
};

export const ServicePorts = async (attribute) => {
    const ip = attribute.ipaddress;
    let status = "DOWN";
    let responseTime = 0;
    let statusCode = 502;
    let uptime = "N/A";

    let cleanIP = ip.replace(/^https?:\/\//, '').replace(/\/$/, '');

    try {
        const monitor = await MonitorPorts.findOne({
            where: { uuidPorts: attribute.uuidPorts },
            order: [['createdAt', 'DESC']],
        });

        const logs = await LogsPorts.findAll({
            where: { uuidPorts: attribute.uuidPorts },
            order: [['createdAt', 'DESC']],
        });

        if (monitor && monitor.running === "PAUSED") {
            console.log(
                `[${new Date().toLocaleString()}] - Ports Logs - ${ip}:${attribute.port} Running Status PAUSED.`
            );
            return;
        }

        const portToUse = attribute.port;
        const protocolToUse = attribute.protocol.toUpperCase();
        let pingResponse;

        if (protocolToUse === "UDP") {
            pingResponse = await pingUDPWithRetry(cleanIP, portToUse);
        } else {
            pingResponse = await pingTCPWithRetry(cleanIP, portToUse);
        }

        responseTime = pingResponse.time;

        if (pingResponse.alive && responseTime > 10) {
            status = "UP";
            statusCode = 200;
            uptime = await CalculateUptimePorts(attribute);
            console.log(
                `[${new Date().toLocaleString()}] - Ports Logs - UP (${ip}:${portToUse}), Uptime: ${uptime}`
            );
            if (logs[0]?.status === "DOWN") {
                await HandleResolvedIncidentsPorts(attribute);
            }
        } else if (!pingResponse.alive) {
            status = "DOWN";
            statusCode = 502;
            responseTime = 0;
            uptime = "N/A";
            console.log(
                `[${new Date().toLocaleString()}] - Ports Logs - DOWN (${ip}:${portToUse})`
            );
            await HandleOngoingIncidentsPorts(attribute);
        }
    } catch (error) {
        console.log(
            `[${new Date().toLocaleString()}] - Ports Logs - ${error.message}`
        );
        statusCode = error.response?.status || 502;
        status = "DOWN";
        responseTime = 0;
        uptime = "N/A";
        await HandleOngoingIncidentsPorts(attribute);
    }

    await LogsPorts.create({
        uuidPorts: attribute.uuidPorts,
        status,
        responseTime,
        statusCode,
        uptime
    });

    console.log(
        `[${new Date().toLocaleString()}] - Ports Logs - ${attribute.hostname} (${ip}:${attribute.port}), Uptime: ${uptime}, Status: ${status}, Response Time: ${responseTime}ms, Code: ${statusCode}`
    );
};


