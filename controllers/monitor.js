import IncidentsHTTPs from "../models/incidentsHTTP.js";
import IncidentsPorts from "../models/incidentsPort.js";
import IncidentsDevices from "../models/incidentsDevices.js";
import LogsHTTPs from "../models/logsHTTP.js";
import LogsPorts from "../models/logsPort.js";
import LogsDevices from "../models/logsDevices.js";
import MonitorHTTPs from "../models/monitorHTTP.js";
import MonitorPorts from "../models/monitorPorts.js";
import MonitorDevices from "../models/monitorDevices.js";
import Users from "../models/userModels.js";
import { SendEmail } from "../services/notifyEmail.js";
import { ArraySummaryLogs, ArrayUptimeLogs } from "../utils/logsHelper.js";
import { emailTemplate } from "../utils/templates/emailTemplate.js";
import { getFormattedCurrentTime, parseDuration } from "../utils/time.js";
import { Op } from "sequelize";

export const GetAllMonitorWithLogs = async (req, res) => {
    try {
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

        const monitorFinal = [];

        for (const { model, uuidKey, type, logModel } of monitorTypes) {
            const monitors = await model.findAll({ order: [['createdAt', 'ASC']] });

            for (const monitor of monitors) {
                const jsonMonitor = monitor.toJSON();
                const uuid = jsonMonitor[uuidKey];

                const logs = await logModel.findAll({
                    where: { [uuidKey]: uuid },
                    order: [['createdAt', 'ASC']]
                });

                monitorFinal.push({
                    ...jsonMonitor,
                    uuidMonitors: uuid,
                    type,
                    logs: await ArrayUptimeLogs(logs, type),
                    summary: await ArraySummaryLogs(logs, type)
                });
            }
        }

        res.status(200).json(monitorFinal);
    } catch (error) {
        console.error(`[${new Date().toLocaleString()}] - ${error.message}`);
        res.status(502).json({ msg: error.message });
    }
};

export const Calculate24HourSummary = async (req, res) => {
    const { uuidMonitors, type } = req.body;
    let data = [];
    
    try {
        let model = null;
        let whereClause = {};
        let attributes = ["createdAt", "responseTime"]; // Default attributes

        if (type === "https") {
            model = LogsHTTPs;
            whereClause = { uuidHTTPs: uuidMonitors };
        } else if (type === "devices") {
            model = LogsDevices;
            whereClause = { uuidDevices: uuidMonitors };
            attributes = [...attributes, "cpuUsage", "ramUsage", "diskUsage"]; // Tambahkan kolom tambahan
        } else if (type === "ports") {
            model = LogsPorts;
            whereClause = { uuidPorts: uuidMonitors };
        } 

        if (!model) {
            return res.status(400).json({ msg: "Invalid type" });
        }

        // Ambil semua data dalam hari yang sama
        const logs = await model.findAll({
            where: whereClause,
            attributes: attributes,
        });

        // Rentang waktu 2 jam
        const timeRanges = [
            "00:00", "02:00", "04:00", "06:00", "08:00", "10:00",
            "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"
        ];
        
        let result = timeRanges.map((startTime, index) => {
            let startHour = parseInt(startTime.split(":")[0]); // Ambil jam sebagai integer
            let endHour = startHour + 2; // Rentang waktu 2 jam

            // Filter logs yang masuk dalam rentang waktu ini
            let filteredLogs = logs.filter(log => {
                let logHour = new Date(log.createdAt).getHours();
                return logHour >= startHour && logHour < endHour;
            });

            // Hitung rata-rata responseTime
            let validPingLogs = filteredLogs.filter(log => log.responseTime !== "N/A");
            let avgPing = validPingLogs.length
                ? (validPingLogs.reduce((sum, log) => sum + parseFloat(log.responseTime), 0) / validPingLogs.length).toFixed(2) + "ms"
                : "0ms";

            if (type === "devices") {
                // Hitung rata-rata untuk cpuUsage, ramUsage, diskUsage (tanpa "N/A")
                let validCpuLogs = filteredLogs.filter(log => log.cpuUsage !== "N/A");
                let validRamLogs = filteredLogs.filter(log => log.ramUsage !== "N/A");
                let validDiskLogs = filteredLogs.filter(log => log.diskUsage !== "N/A");

                let avgCpu = validCpuLogs.length
                    ? (validCpuLogs.reduce((sum, log) => sum + parseFloat(log.cpuUsage), 0) / validCpuLogs.length).toFixed(2) + "%"
                    : "0%";

                let avgRam = validRamLogs.length
                    ? (validRamLogs.reduce((sum, log) => sum + parseFloat(log.ramUsage), 0) / validRamLogs.length).toFixed(2) + "%"
                    : "0%";

                let avgDisk = validDiskLogs.length
                    ? (validDiskLogs.reduce((sum, log) => sum + parseFloat(log.diskUsage), 0) / validDiskLogs.length).toFixed(2) + "%"
                    : "0%";

                return { AvgPing: avgPing, AvgCpu: avgCpu, AvgRam: avgRam, AvgDisk: avgDisk };
            }

            return { AvgPing: avgPing };
        });

        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

export const GetMonitorStatusCount = async (req, res) => {
    try {
        const monitorTypes = [
            {
                monitorModel: MonitorHTTPs,
                logModel: LogsHTTPs,
                uuidField: 'uuidHTTPs'
            },
            {
                monitorModel: MonitorDevices,
                logModel: LogsDevices,
                uuidField: 'uuidDevices'
            },
            {
                monitorModel: MonitorPorts,
                logModel: LogsPorts,
                uuidField: 'uuidPorts'
            }
        ];

        const statusCount = {
            UP: 0,
            DOWN: 0,
            PAUSED: 0
        };

        // Iterate over each monitor type
        for (const { monitorModel, logModel, uuidField } of monitorTypes) {
            const monitors = await monitorModel.findAll();

            for (const monitor of monitors) {
                // If the monitor is paused (i.e. running state is not "STARTED"), count as paused.
                if (monitor.running !== "STARTED") {
                    statusCount.PAUSED++;
                } else {
                    // Otherwise, fetch the latest log for this monitor by UUID.
                    const latestLog = await logModel.findOne({
                        where: { [uuidField]: monitor[uuidField] },
                        order: [['createdAt', 'DESC']]
                    });

                    // If a log entry exists, increment the corresponding counter based on its status.
                    if (latestLog) {
                        const logStatus = latestLog.status;
                        
                        if (logStatus && (logStatus === 'UP' || logStatus === 'DOWN')) {
                            statusCount[logStatus]++;
                        }
                    }
                }
            }
        }

        const result = [
            { status: 'UP', total: statusCount.UP },
            { status: 'DOWN', total: statusCount.DOWN },
            { status: 'PAUSED', total: statusCount.PAUSED }
        ];

        res.status(200).json(result);
    } catch (error) {
        console.error(`[${new Date().toLocaleString()}] - ${error.message}`);
        res.status(502).json({ msg: error.message });
    }
};


export const DeleteMonitor = async (req, res) => {
    const { uuid, type } = req.body;
    let model = null;
    let where = {};
    let nameField = "hostname"; // default field nama monitor (ubah sesuai model)

    try {
        if (type === "https" || type === "http") {
            model = MonitorHTTPs;
            where = { uuidHTTPs: uuid };
        } else if (type === "ports") {
            model = MonitorPorts;
            where = { uuidPorts: uuid };
        } else if (type === "devices") {
            model = MonitorDevices;
            where = { uuidDevices: uuid };
        } else {
            return res.status(400).json({ msg: "Invalid monitor type." });
        }

        const monitor = await model.findOne({ where });

        if (!monitor) {
            return res.status(404).json({ msg: "Monitor not found." });
        }

        const monitorName = monitor[nameField] || monitor.hostname || monitor.name || "Unnamed";

        await monitor.destroy();

        res.status(200).json({
            message: `Monitor '${monitorName}' berhasil dihapus.`,
            uuid,
            type,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Failed to delete monitor." });
    }
};

export const PauseMonitor = async (req, res) => {
    const { uuid, type } = req.body;
    let model = null;
    let where = {};

    try {
        if (type === "http" || type === "https") {
            model = MonitorHTTPs;
            where = { uuidHTTPs: uuid };
        } else if (type === "ports") {
            model = MonitorPorts;
            where = { uuidPorts: uuid };
        } else if (type === "devices") {
            model = MonitorDevices;
            where = { uuidDevices: uuid };
        } else {
            return res.status(400).json({ msg: "Tipe monitor tidak valid." });
        }

        const monitor = await model.findOne({ where });

        if (!monitor) {
            return res.status(404).json({ msg: "Monitor tidak ditemukan." });
        }

        if ( monitor.running === "PAUSED" ){
            return res.status(400).json({ msg: "Monitor telah dijeda sebelumnya."})
        }
        monitor.running = "PAUSED";
        await monitor.save();

        res.status(200).json({
            msg: `Monitor '${monitor.hostname || monitor.name || "unknown"}' berhasil di-pause.`,
        });

    } catch (error) {
        console.error(`[${new Date().toLocaleString()}] - PauseMonitor Error:`, error.message);
        res.status(500).json({ msg: "Gagal pause monitor." });
    }
};

export const StartMonitor = async (req, res) => {
    const { uuid, type } = req.body;
    let model = null;
    let where = {};

    try {
        if (type === "http" || type === "https") {
            model = MonitorHTTPs;
            where = { uuidHTTPs: uuid };
        } else if (type === "ports") {
            model = MonitorPorts;
            where = { uuidPorts: uuid };
        } else if (type === "devices") {
            model = MonitorDevices;
            where = { uuidDevices: uuid };
        } else {
            return res.status(400).json({ msg: "Tipe monitor tidak valid." });
        }

        const monitor = await model.findOne({ where });

        if (!monitor) {
            return res.status(404).json({ msg: "Monitor tidak ditemukan." });
        }

        if ( monitor.running === "STARTED" ){
            return res.status(400).json({ msg: "Monitor telah dimulai sebelumnya." })
        }
        monitor.running = "STARTED";
        await monitor.save();

        res.status(200).json({
            msg: `Monitor '${monitor.hostname || monitor.name || "unknown"}' berhasil di-mulai kembali.`,
        });

    } catch (error) {
        console.error(`[${new Date().toLocaleString()}] - StartMonitor - Error:`, error.message);
        res.status(500).json({ msg: "Gagal memulai kembali monitor." });
    }
};

export const TestAlertEmail = async (req, res) => {
    const { uuidUsers, uuidMonitors, type } = req.body;
    let monitor = null;

    try {
        const user = await Users.findOne({ where: { uuidUsers: uuidUsers }});
        
        if ( type === "devices" ) {
            monitor = await MonitorDevices.findOne({
                where: { uuidDevices: uuidMonitors },
            });
        } else if ( type === "https" ) {
            monitor = await MonitorHTTPs.findOne({
                where: { uuidHTTPs: uuidMonitors }
            })
        } else if (type === "ports" ){
            monitor = await MonitorPorts.findOne({
                where: { uuidPorts: uuidMonitors }
            });
        } else {
            res.status(404).json({ msg: "Monitor not Found!" });
        }
        
        const subject = `Monitor ${monitor.hostname} DOWN!`;
        
        const info = {
            name: user.name,
            hostname: monitor.hostname,
            ipaddress: monitor.ipaddress,
            rootcause: "Connection Timeout",
            date: getFormattedCurrentTime(),
        };

        const mailsend = await SendEmail(user.email, subject, emailTemplate(info));
        console.log(mailsend);
        
        res.status(200).json({ msg: "Email Successfully Send!" });
    } catch (error) {
        console.log(error.message);
        
        res.status(500).json({ msg: error.message });
    }
};

export const CalculateGlobalSLA = async (req, res) => {
    try {
        const monitorTypes = [
            {
                monitorModel: MonitorHTTPs,
                logModel: LogsHTTPs,
                incidentModel: IncidentsHTTPs,
                uuidField: 'uuidHTTPs'
            },
            {
                monitorModel: MonitorDevices,
                logModel: LogsDevices,
                incidentModel: IncidentsDevices,
                uuidField: 'uuidDevices'
            },
            {
                monitorModel: MonitorPorts,
                logModel: LogsPorts,
                incidentModel: IncidentsPorts,
                uuidField: 'uuidPorts'
            }
        ];
        
        let globalUptime = 0;
        let globalDowntime = 0;
        let globalIncidents = 0;
        
        for (const typeObj of monitorTypes) {
            const { monitorModel, logModel, incidentModel, uuidField } = typeObj;
            
            const monitors = await monitorModel.findAll({
                order: [['createdAt', 'ASC']]
            });
            
            for (const monitor of monitors) {
                const uuidValue = monitor[uuidField];
                
                const logs = await logModel.findAll({
                    where: { [uuidField]: uuidValue },
                    order: [['createdAt', 'ASC']]
                });
                const incidents = await incidentModel.findAll({
                    where: { [uuidField]: uuidValue },
                    order: [['createdAt', 'ASC']]
                });
                
                let totalUptime = 0;
                let currentBlockUptime = 0;
                
                logs.forEach((log, index) => {
                    if (log.uptime === "N/A") {
                        totalUptime += currentBlockUptime;
                        currentBlockUptime = 0;
                    } else {
                        currentBlockUptime = parseDuration(log.uptime);
                    }
                });
                totalUptime += currentBlockUptime;
                
                let totalDowntime = 0;
                incidents.forEach(incident => {
                    globalIncidents += 1
                    totalDowntime += parseDuration(incident.duration);
                });
                
                globalUptime += totalUptime;
                globalDowntime += totalDowntime;
            }
        }
        
        const globalPeriod = globalUptime + globalDowntime;
        const globalSLA = globalPeriod ? (globalUptime / globalPeriod) * 100 : 0;
        
        res.status(200).json({
            globalUptime,    
            globalDowntime,  
            globalPeriod,    
            globalSLA,
            globalIncidents   
        });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const CalculateGlobalSLA24h = async (req, res) => {
    try {
        const monitorTypes = [
            {
                monitorModel: MonitorHTTPs,
                logModel: LogsHTTPs,
                incidentModel: IncidentsHTTPs,
                uuidField: 'uuidHTTPs'
            },
            {
                monitorModel: MonitorDevices,
                logModel: LogsDevices,
                incidentModel: IncidentsDevices,
                uuidField: 'uuidDevices'
            },
            {
                monitorModel: MonitorPorts,
                logModel: LogsPorts,
                incidentModel: IncidentsPorts,
                uuidField: 'uuidPorts'
            }
        ];

        const date24 = new Date(Date.now() - 24 * 60 * 60 * 1000);

        let globalUptime = 0;
        let globalDowntime = 0;
        let globalIncidents = 0;

        for (const typeObj of monitorTypes) {
            const { monitorModel, logModel, incidentModel, uuidField } = typeObj;

            const monitors = await monitorModel.findAll({
                order: [['createdAt', 'ASC']]
            });

            for (const monitor of monitors) {
                const uuidValue = monitor[uuidField];

                const logs = await logModel.findAll({
                    where: {
                        [uuidField]: uuidValue,
                        createdAt: { [Op.gte]: date24 }
                    },
                    order: [['createdAt', 'ASC']]
                });

                const incidents = await incidentModel.findAll({
                    where: {
                        [uuidField]: uuidValue,
                        createdAt: { [Op.gte]: date24 }
                    },
                    order: [['createdAt', 'ASC']]
                });

                let totalUptime = 0;
                let currentBlockUptime = 0;

                logs.forEach(log => {
                    if (log.uptime === "N/A") {
                        totalUptime += currentBlockUptime;
                        currentBlockUptime = 0;
                    } else {
                        currentBlockUptime = parseDuration(log.uptime);
                    }
                });
                totalUptime += currentBlockUptime;

                let totalDowntime = 0;
                incidents.forEach(incident => {
                    globalIncidents += 1;
                    totalDowntime += parseDuration(incident.duration);
                });

                globalUptime += totalUptime;
                globalDowntime += totalDowntime;
            }
        }

        const globalPeriod = globalUptime + globalDowntime;
        const globalSLA = globalPeriod ? (globalUptime / globalPeriod) * 100 : 0;

        res.status(200).json({
            globalSLA,
            globalIncidents
        });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const CalculateWeeklySLA = async (req, res) => {
    try {
        const monitorTypes = [
            {
                monitorModel: MonitorHTTPs,
                logModel: LogsHTTPs,
                incidentModel: IncidentsHTTPs,
                uuidField: 'uuidHTTPs'
            },
            {
                monitorModel: MonitorDevices,
                logModel: LogsDevices,
                incidentModel: IncidentsDevices,
                uuidField: 'uuidDevices'
            },
            {
                monitorModel: MonitorPorts,
                logModel: LogsPorts,
                incidentModel: IncidentsPorts,
                uuidField: 'uuidPorts'
            }
        ];

        const results = [];

        // Loop from 6 days ago down to today (offset 0)
        for (let offset = 6; offset >= 0; offset--) {
            const dayDate = new Date();
            dayDate.setHours(0, 0, 0, 0);
            dayDate.setDate(dayDate.getDate() - offset);

            const dayStart = new Date(dayDate);
            const dayEnd = new Date(dayDate);
            dayEnd.setHours(23, 59, 59, 999);

            let dayUptime = 0;
            let dayDowntime = 0;

            for (const { monitorModel, logModel, incidentModel, uuidField } of monitorTypes) {
                const monitors = await monitorModel.findAll();

                for (const monitor of monitors) {
                    const uuidValue = monitor[uuidField];

                    const logs = await logModel.findAll({
                        where: {
                            [uuidField]: uuidValue,
                            createdAt: { [Op.between]: [dayStart, dayEnd] }
                        },
                        order: [['createdAt', 'ASC']]
                    });

                    let totalUptime = 0;
                    let currentBlockUptime = 0;

                    logs.forEach(log => {
                        if (log.uptime === "N/A") {
                            totalUptime += currentBlockUptime;
                            currentBlockUptime = 0;
                        } else {
                            currentBlockUptime = parseDuration(log.uptime);
                        }
                    });
                    totalUptime += currentBlockUptime;

                    const incidents = await incidentModel.findAll({
                        where: {
                            [uuidField]: uuidValue,
                            createdAt: { [Op.between]: [dayStart, dayEnd] }
                        },
                        order: [['createdAt', 'ASC']]
                    });

                    let totalDowntime = 0;
                    incidents.forEach(incident => {
                        totalDowntime += parseDuration(incident.duration);
                    });

                    dayUptime += totalUptime;
                    dayDowntime += totalDowntime;
                }
            }

            const dayPeriod = dayUptime + dayDowntime;
            const uptimePercent = dayPeriod ? (dayUptime / dayPeriod) * 100 : 0;
            const downtimePercent = dayPeriod ? (dayDowntime / dayPeriod) * 100 : 0;

            // For today, use "Today" as the day key; otherwise, use the weekday name.
            const dayKey =
                offset === 0
                    ? "today"
                    : dayStart.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

            results.push({
                day: dayKey,
                uptimePercent,
                downtimePercent
            });
        }

        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};


