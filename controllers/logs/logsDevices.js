import LogsDevices from "../../models/logsDevices.js";
import MonitorDevices from "../../models/monitorDevices.js";
import { ServiceDevices } from "../../services/devicesServices.js";

export const createLogsManualDevices = async (req, res) => {
    const { uuidDevices } = req.body;

    try {
        const monitors = await MonitorDevices.findOne({ where: { uuidDevices: uuidDevices } });
        if (!monitors) return res.status(404).json({ msg: "monitors not found" });

        const deviceAttribute = {
            uuidDevices: monitors.uuidDevices,
            hostname: monitors.hostname,
            ipaddress: monitors.ipaddress,
            snmp_username: monitors.snmp_username,
            snmp_authkey: monitors.snmp_authkey,
            snmp_privkey: monitors.snmp_privkey,
            snmp_port: monitors.snmp_port,
            running: monitors.running,
        }
        
        console.log(`[${new Date().toLocaleString()}] - Creating log Devices...`);
        
        await ServiceDevices(deviceAttribute);
        res.status(201).json({ msg: "Log created successfully" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const DevicesGetLogsALL = async (req, res) => {
    try {
        const monitor = await LogsDevices.findAll({});
        res.status(200).json(monitor);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch HTTPs Logs" })
    }
}

export const SelectedDevicesGetLogs = async (req, res) => {
    const { uuidDevices } =  req.body;

    try {
        const monitor = await LogsDevices.findAll({ where: { uuidDevices: uuidDevices } });
        res.status(200).json(monitor);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch HTTPs Logs" })
    }
}

