import IncidentsHTTPs from "../models/incidentsHTTP.js";
import LogsHTTPs from "../models/logsHTTP.js";
import LogsPorts from "../models/logsPort.js";
import LogsDevices from "../models/logsDevices.js";
import MonitorHTTPs from "../models/monitorHTTP.js";
import MonitorPorts from "../models/monitorPorts.js";
import MonitorDevices from "../models/monitorDevices.js";

export const ClearLogs = async (req, res) => {
    const { uuid, type } = req.body;
    let LogModel = null;
    let where = {};

    try {
        // Choose the appropriate log model and set the where clause based on the type
        if (type === "http" || type === "https") {
            LogModel = LogsHTTPs; // Assumed log model for HTTP/HTTPS monitors
            where = { uuidHTTPs: uuid };
        } else if (type === "ports") {
            LogModel = LogsPorts; // Assumed log model for port monitors
            where = { uuidPorts: uuid };
        } else if (type === "devices") {
            LogModel = LogsDevices; // Assumed log model for Devices monitors
            where = { uuidDevices: uuid };
        } else {
            return res.status(400).json({ msg: "Tipe monitor tidak valid." });
        }

        // Delete all logs that match the criteria
        const deletedCount = await LogModel.destroy({ where });

        if (deletedCount === 0) {
            return res.status(404).json({ msg: "Tidak ada log yang ditemukan untuk monitor tersebut." });
        }

        res.status(200).json({ msg: "Semua log berhasil dihapus." });
    } catch (error) {
        console.error(`[${new Date().toLocaleString()}] - ClearLogs - Error:`, error.message);
        res.status(500).json({ msg: "Gagal menghapus log." });
    }
};

export const AvgResponseTime = async (req, res) => {
    const monitorTypes = [
        {
            model: MonitorHTTPs,
            uuidKey: 'uuidHTTPs',
            type: 'https',
            logModel: LogsHTTPs
        },
        {
            model: MonitorDevices,
            uuidKey: 'uuidDevices',
            type: 'devices',
            logModel: LogsDevices
        },
        {
            model: MonitorPorts,
            uuidKey: 'uuidPorts',
            type: 'ports',
            logModel: LogsPorts
        }
    ];

    try {
        let allValidResponseTimes = [];

        for (const { logModel } of monitorTypes) {
            const logs = await logModel.findAll({
                attributes: ['responseTime']
            });

            logs.forEach(log => {
                const responseTime = log.responseTime;
                if (responseTime >= 5) {
                    allValidResponseTimes.push(responseTime);
                }
            });
        }

        if (allValidResponseTimes.length === 0) {
            return res.status(200).json({
                averageResponseTime: 0,
                highestResponseTime: 0,
                lowestResponseTime: 0
            });
        }

        const sum = allValidResponseTimes.reduce((acc, time) => acc + time, 0);
        const averageResponseTime = sum / allValidResponseTimes.length;
        const highestResponseTime = Math.max(...allValidResponseTimes);
        const lowestResponseTime = Math.min(...allValidResponseTimes);

        res.status(200).json({
            averageResponseTime,
            highestResponseTime,
            lowestResponseTime
        });
    } catch (error) {
        console.error(`[${new Date().toLocaleString()}] - AvgResponseTime - Error:`, error.message);
        res.status(500).json({ msg: "Failed to calculate response times" });
    }
};

