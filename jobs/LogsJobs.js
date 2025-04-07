import MonitorHTTPs from "../models/monitorHTTP.js";
import MonitorServers from "../models/monitorServer.js";
import { ServiceHTTPs } from "../services/httpServices.js";
import { ServiceServers } from "../services/serverServices.js";

export const StartBackgroundLogs = async () => {
    const intervalMapping = {
        "15S": 15000,
        "30S": 30000,
        "1M": 60000,
        "5M": 300000,
        "10M": 600000,
        "15M": 900000,
        "30M": 1800000,
        "1H": 3600000,
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

