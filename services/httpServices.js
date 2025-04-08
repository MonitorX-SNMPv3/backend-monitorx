import LogsHTTPs from "../models/logsHTTP.js";
import { HandleUptimeWithStatusCheck, fetchHTTPWithRetry, pingHTTPWithRetry } from "../utils/logsHelper.js";
import { HandleOngoingIncidentsHTTPs, HandleResolvedIncidentsHTTPs } from "./httpIncidents.js";
import MonitorHTTPs from "../models/monitorHTTP.js";

const ConvertUptimeToMs = (uptimeStr) => {
    if (!uptimeStr || uptimeStr === "N/A") return 0;
    // Updated regex to capture seconds as well
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

// Helper: Convert milliseconds to a formatted string "Xd Xh Xm Xs"
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

const CalculateUptimeHTTPs = async (attribute) => {
    // Retrieve the most recent log for the given uuidHTTPs
    const LogsData = await LogsHTTPs.findOne({ 
        where: { uuidHTTPs: attribute.uuidHTTPs }, 
        order: [['createdAt', 'DESC']] 
    });

    // If no logs are found, use statusCheck value to handle uptime
    if (!LogsData) {
        return HandleUptimeWithStatusCheck(attribute.statusCheck);
    }

    let uptimePrev = LogsData.uptime;
    const prevCreatedTime = new Date(LogsData.createdAt).getTime();
    const nowTime = Date.now();

    if (uptimePrev !== "N/A") {
        // Convert the previous uptime (stored as a string) into milliseconds
        const uptimePrevMs = ConvertUptimeToMs(uptimePrev);
        // Calculate the elapsed time since the previous log was created
        const elapsedTime = nowTime - prevCreatedTime;
        // Sum the previous uptime and the elapsed time
        const totalUptimeMs = uptimePrevMs + elapsedTime;
        // Convert the total uptime back to the desired format (now including seconds)
        return ConvertMStoFormatUptime(totalUptimeMs);
    } else {
        // If uptime is "N/A", calculate uptime based on the statusCheck value.
        return HandleUptimeWithStatusCheck(attribute.statusCheck);
    }
};



export const ServiceHTTPs = async (attribute) => {
    const ip = attribute.ipaddress;
    let status = "DOWN";
    let responseTime = 0;
    let statusCode = 502;
    let uptime = "N/A";

    let cleanIP = ip.replace(/^https?:\/\//, '').replace(/\/$/, '');

    try {
        const monitor = await MonitorHTTPs.findOne({
            where: { uuidHTTPs: attribute.uuidHTTPs },
            order: [['createdAt', 'DESC']],
        });

        const logs = await LogsHTTPs.findAll({
            where: { uuidHTTPs: attribute.uuidHTTPs },
            order: [['createdAt', 'DESC']]
        });

        if (monitor && monitor.running === "PAUSED") {
            console.log(`[${new Date().toLocaleString()}] - HTTPs Logs - ${attribute.ipaddress} Running Status PAUSED.`);
            return;
        }

        const pingResponse = await pingHTTPWithRetry(cleanIP);
        responseTime = pingResponse.time;     
        
        let formatURL = ip.startsWith("http") ? ip : `http://${cleanIP}`;

        if (pingResponse.alive && responseTime > 10) {
            const HTTPResponse = await fetchHTTPWithRetry(formatURL);

            if ( logs[0]?.status === "DOWN" && HTTPResponse ) {
                status = "UP";
                statusCode = HTTPResponse.status;
                uptime = await CalculateUptimeHTTPs(attribute);
                
                console.log(`[${new Date().toLocaleString()}] - Devices UP, Solving Incidents (${attribute.ipaddress})`);
                await HandleResolvedIncidentsHTTPs(attribute);
            } else if ( HTTPResponse ) {
                status = "UP";
                statusCode = HTTPResponse.status;
                uptime = await CalculateUptimeHTTPs(attribute);
            } else {
                status = "DOWN";
                statusCode = 502;
                responseTime = 0;
                uptime = "N/A";
        
                console.log(`[${new Date().toLocaleString()}] - HTTPs Logs - Found Incidents (${attribute.ipaddress})`);
                await HandleOngoingIncidentsHTTPs(attribute);
            }

        } else if (!pingResponse.alive) {
            const HTTPResponse = await fetchHTTPWithRetry(formatURL);
            
            if ( HTTPResponse ) {
                status = "UP";
                statusCode = HTTPResponse.status;
                responseTime = HTTPResponse.responseTime || 0;
                uptime = await CalculateUptimeHTTPs(attribute);
                
                if ( logs[0]?.status === "DOWN" ) {
                    console.log(`[${new Date().toLocaleString()}] - Devices UP, Solving Incidents (${attribute.ipaddress})`);
                    await HandleResolvedIncidentsHTTPs(attribute); 
                }
            } else {
                status = "DOWN";
                statusCode = 502;
                responseTime = 0;
                uptime = "N/A";
        
                console.log(`[${new Date().toLocaleString()}] - HTTPs Logs - Found Incidents (${attribute.ipaddress})`);
                await HandleOngoingIncidentsHTTPs(attribute);
            }
        }
        
    } catch (error) {
        console.log(`[${new Date().toLocaleString()}] - HTTPs Logs - ${error.message}`);
        statusCode = error.response?.status || 502;
        status = "DOWN";
        responseTime = 0;
        uptime = "N/A";
    }

    await LogsHTTPs.create({
        uuidHTTPs: attribute.uuidHTTPs,
        status,
        responseTime,
        statusCode,
        uptime
    });

    console.log(`[${new Date().toLocaleString()}] - HTTP Logs - ${attribute.hostname} (${ip}), Uptime: ${uptime}, Status: ${status}, Response Time: ${responseTime}ms, Code: ${statusCode}`);
};



