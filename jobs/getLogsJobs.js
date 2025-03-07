import MonitorHTTPs from "../models/monitorHTTP.js";
import MonitorServers from "../models/monitorServer.js";
import { ServiceHTTPs } from "../services/httpServices.js";
import { ServiceServers } from "../services/serverServices.js";

// import MonitorNetworks from "../models/monitorNetwork.js";
// import MonitorPorts from "../models/monitorPORT.js";

// export const StartBackgroundLogs1M = async () => {
//     setInterval(async () => {
//         const monitorHTTPs = await MonitorHTTPs.findAll({ where: { statusCheck: "1M" } });
//         const monitorServers = await MonitorServers.findAll({ where: { statusCheck: "1M" } });
//         // const monitorPorts = await MonitorPorts.findAll({});
//         // const monitorRouter = await MonitorNetworks.findAll({});

//         for (const monitor of monitorHTTPs) {
//             await ServiceHTTPs(monitor);
//         };
        
//         for (const monitor of monitorServers) {
//             await ServiceServers(monitor);
//         };
        
//     }, 60000);
// };

export const StartBackgroundLogs = async () => {
    const intervalMapping = {
        "15S": 15000,
        "1M": 60000,
        "5M": 300000,
        "10M": 600000,
        "15M": 900000,
    };

    const startMonitoring = (interval, statusCheck) => {
        setInterval(async () => {
            const monitorHTTPs = await MonitorHTTPs.findAll({ where: { statusCheck } });
            const monitorServers = await MonitorServers.findAll({ where: { statusCheck } });

            for (const monitor of monitorHTTPs) {
                await ServiceHTTPs(monitor);
            }
            
            for (const monitor of monitorServers) {
                await ServiceServers(monitor);
            }
        }, interval);
    };

    // Jalankan monitoring berdasarkan statusCheck yang ditemukan di database
    for (const [statusCheck, interval] of Object.entries(intervalMapping)) {
        startMonitoring(interval, statusCheck);
    }
};

