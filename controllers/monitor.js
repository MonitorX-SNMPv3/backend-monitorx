import LogsHTTPs from "../models/logsHTTP.js";
import LogsServers from "../models/logsServer.js";
import MonitorHTTPs from "../models/monitorHTTP.js";
import MonitorServers from "../models/monitorServer.js";

const GetLogs = async (attribute) => {
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
    for(let i = 0; i < attribute?.length - 1; i++){
        let dataPrev = dateFormat.format(attribute[i]?.createdAt).split(" at ");
        let dataNow = dateFormat.format(attribute[i+1]?.createdAt).split(" at ");

        let timePrev = `${dataPrev[1].split(":")[0]}:${dataPrev[1].split(":")[1]}`;
        let timeNow = `${dataNow[1].split(":")[0]}:${dataNow[1].split(":")[1]}`;
        

        uptimeLogs.push({
            status: attribute[i]?.status,
            responseTime: attribute[i]?.responseTime,
            date: `${dataPrev[0]}`,
            timeRange: `${timePrev} - ${timeNow}`
        });
    };
    
    return uptimeLogs;
}


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
        
        monitorFinal = [...monitorHTTPs, ...monitorServers];
        for(const monitor of monitorFinal){
            if (monitor.type === "https"){
                let uptimeData = await LogsHTTPs.findAll({ 
                    where: { uuidHTTPs: monitor.uuidHTTPs },
                    order: [['createdAt', 'ASC']],
                });

                monitor.logs = await GetLogs(uptimeData);
            }
            else if (monitor.type ==="server"){
                let uptimeData = await LogsServers.findAll({ 
                    where: { uuidServers: monitor.uuidServers },
                    order: [['createdAt', 'ASC']],
                });
                monitor.logs = await GetLogs(uptimeData);
            }
        }
        // console.log(monitorTest);

        res.status(200).json(monitorFinal);
    } catch (error) {
        console.log(error);
        res.status(502).json({ msg: error.msg })
    }
}