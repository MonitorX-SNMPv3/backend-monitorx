import ping from "ping";
import LogsHTTPs from "../models/logsHTTP.js";

export const ServiceHTTPs = async (attribute) => {
    const ip = attribute.ipaddress;
    let status = "DOWN";
    let responseTime = 0;
    let statusCode = 502;

    let cleanIP = ip.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    try {
        const pingResponse = await ping.promise.probe(cleanIP, { timeout: 2 });
        status = pingResponse.alive ? "UP" : "DOWN";
        responseTime = pingResponse.time;
        
        if ( status === "UP" && responseTime > 10 ) {
            let formatURL = ip.startsWith("http") ? ip : `http://${cleanIP}`;

            const HTTPResponse = await axios.get(formatURL, { timeout: 5000 });
            statusCode = HTTPResponse.status;
        } else {
            statusCode = 502;
            responseTime = 0;
            status = "DOWN";
        }
    } catch (error) {
        statusCode = error.response?.status || 502;
    }

    await LogsHTTPs.create({
        uuidHTTPs: attribute.uuidHTTPs,
        status: status,
        responseTime: responseTime,
        statusCode: statusCode,
    });

    console.log(`[${new Date().toLocaleString()}] - HTTP Logs - ${attribute.hostname} (${ip}), Status: ${status}, Response Time: ${responseTime}ms, Code: ${statusCode}`);
} 