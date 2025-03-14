import ping from "ping";
import LogsHTTPs from "../models/logsHTTP.js";
import axios from "axios";

const TestCalculate = async (attribute) => {
    const uptimePrevTemp = await LogsHTTPs.findOne({ where: {uuidHTTPs: attribute.uuidHTTPs}, order: [['createdAt', 'DESC']] });
    let uptimePrevArr = uptimePrevTemp.uptime.split(" "); 
    let uptimeNow = null;
    let statusCheck = attribute.statusCheck;
    let statusCheckTime = statusCheck.replace(/[^a-zA-z]/g, "");
    let statusCheckNumber = statusCheck.replace(/\D/g, "");
    console.log(`Status Check ${JSON.stringify(uptimePrevArr)}`);

    if (statusCheckTime === "M"){
        uptimeNow = statusCheckNumber * 60 * 1000;
    } else if (statusCheckTime === "S"){
        uptimeNow = statusCheckNumber * 1000;
    }
    

    if (uptimePrevTemp.uptime !== "N/A"){
        let tempDay = uptimePrevArr[0].replace(/\D/g, ""); 
        let tempHour = uptimePrevArr[1].replace(/\D/g, ""); 
        let tempMin = uptimePrevArr[2].replace(/\D/g, "");

        let day = (parseInt(tempDay, 10) * 24 * 60 * 60 * 1000);
        let hour = (parseInt(tempHour, 10) * 60 * 60 * 1000);
        let min = (parseInt(tempMin, 10) * 60 * 1000);

        let total = day + hour + min
        console.log(`${total} dan ${total + uptimeNow}`);
        console.log('A');
    }
    
    // console.log(`${JSON.stringify(logsHTTPs[logsHTTPs.length - 1 ].createdAt)}`);
}

const ConvertLocaleStringToMS = (data) => {
    let [ datePart, timePart ] = data.split(", ");

    let [day, month, year] = datePart.split("/").map(Number);

    let [hour, minute, second] = timePart.split(".").map(Number);

    let timeZone = "Asia/Bangkok";
    let dateInUTC7 = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

    let timestamp = dateInUTC7.getTime();

    return timestamp;
};

const ConvertUptimeToMs = (data) => {
    let str = data.replace(/\D/g, " ")
    let [ day, hour, min ] = str.split("  ").map(String);

    day = day * 24 * 60 * 60 * 1000;
    hour = hour * 60 * 60 * 1000;
    min = min * 60 * 1000;

    let total = day + hour + min;
    return total;
}

const ConvertMStoFormatUptime = (ms) => {
    let days = Math.floor(ms / (24 * 60 * 60 * 1000));
    ms %= (24 * 60 * 60 * 1000);

    let hours = Math.floor(ms / (60 * 60 * 1000));
    ms %= (60 * 60 * 1000);

    let minutes = Math.floor(ms / (60 * 1000));

    return `${days}d ${hours}h ${minutes}m`;
};

const HandleUptimeWithStatusCheck = (data) => {
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
        const pingResponse = await ping.promise.probe(cleanIP, { timeout: 2 });
        status = pingResponse.alive ? "UP" : "DOWN";
        responseTime = pingResponse.time;
        
        if ( status === "UP" && responseTime > 10 ) {
            let formatURL = ip.startsWith("http") ? ip : `http://${cleanIP}`;

            const HTTPResponse = await axios.get(formatURL, { timeout: 5000 });
            uptime = await CalculateUptimeHTTPs(attribute);            
            statusCode = HTTPResponse.status;
        } else {
            statusCode = 502;
            responseTime = 0;
            status = "DOWN";
            uptime = "N/A";
        }
    } catch (error) {
        console.log(error.message);
        statusCode = error.response?.status || 502;
    }
    
    // await LogsHTTPs.create({
    //     uuidHTTPs: attribute.uuidHTTPs,
    //     status: status,
    //     responseTime: responseTime,
    //     statusCode: statusCode,
    //     uptime: uptime,
    // });

    console.log(`[${new Date().toLocaleString()}] - HTTP Logs - ${attribute.hostname} (${ip}), Uptime: ${uptime}, Status: ${status}, Response Time: ${responseTime}ms, Code: ${statusCode}`);
} 