import LogsHTTPs from "../models/logsHTTP.js";
import { HandleUptimeWithStatusCheck, fetchHTTPWithRetry, pingHTTPWithRetry, ConvertLocaleStringToMS, ConvertUptimeToMs, ConvertMStoFormatUptime } from "../utils/logsHelper.js";
import { HandleOngoingIncidentsHTTPs, HandleResolvedIncidentsHTTPs } from "./httpIncidents.js";
import MonitorHTTPs from "../models/monitorHTTP.js";

const CalculateUptimeHTTPs = async (attribute) => {
    const LogsData = await LogsHTTPs.findOne({ 
        where: {uuidHTTPs: attribute.uuidHTTPs}, 
        order: [['createdAt', 'DESC']] });

    if (!LogsData) {
        return HandleUptimeWithStatusCheck(attribute.statusCheck);
    }

    let uptimePrev = LogsData.uptime;
    
    let prevCreatedLogs = LogsData.createdAt.toLocaleString("id-ID", {timezone: "Asia/Bangkok"});
    let nowCreatedLogs = new Date().toLocaleString("id-ID", {timezone: "Asia/Bangkok"});

    let prevCreatedTimeMS = ConvertLocaleStringToMS(prevCreatedLogs);
    let nowCreatedTimeMS = ConvertLocaleStringToMS(nowCreatedLogs);

    if ( uptimePrev !== "N/A" ){
        uptimePrev = ConvertUptimeToMs(uptimePrev);
        let uptimeNow = (nowCreatedTimeMS - prevCreatedTimeMS) + uptimePrev
        
        //Convert Again To xxd xxh xxm atau contoh 2d 2h 2m
        return ConvertMStoFormatUptime(uptimeNow);
    } 

    else if ( uptimePrev === "N/A" ) {
        return HandleUptimeWithStatusCheck(attribute.statusCheck);
    }
}

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
            console.log(`[${new Date().toLocaleString()}] - HTTPs Logs - Condition one`);
            
            const HTTPResponse = await fetchHTTPWithRetry(formatURL);

            if ( logs[0]?.status === "DOWN" && HTTPResponse ) {
                status = "UP";
                statusCode = HTTPResponse.status;
                uptime = await CalculateUptimeHTTPs(attribute);
                
                console.log(`[${new Date().toLocaleString()}] - Server UP, Solving Incidents (${attribute.ipaddress})`);
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
            console.log(`[${new Date().toLocaleString()}] - HTTPs Logs - Condition two`);

            const HTTPResponse = await fetchHTTPWithRetry(formatURL);
            
            if ( HTTPResponse ) {
                status = "UP";
                statusCode = HTTPResponse.status;
                responseTime = HTTPResponse.responseTime || 0;
                uptime = await CalculateUptimeHTTPs(attribute);
                
                if ( logs[0]?.status === "DOWN" ) {
                    console.log(`[${new Date().toLocaleString()}] - Server UP, Solving Incidents (${attribute.ipaddress})`);
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



