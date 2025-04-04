import LogsServers from "../../models/logsServer.js";
import MonitorServers from "../../models/monitorServer.js";
import { ServiceServers } from "../../services/serverServices.js";

export const createLogsManualServers = async (req, res) => {
    const { uuidServers } = req.body;

    try {
        const monitors = await MonitorServers.findOne({ where: { uuidServers: uuidServers } });
        if (!monitors) return res.status(404).json({ msg: "monitors not found" });

        const serverAttribute = {
            uuidServers: monitors.uuidServers,
            hostname: monitors.hostname,
            ipaddress: monitors.ipaddress,
            snmp_username: monitors.snmp_username,
            snmp_authkey: monitors.snmp_authkey,
            snmp_privkey: monitors.snmp_privkey,
            snmp_port: monitors.snmp_port,
        }
        
        console.log('Creating log server...');
        
        await ServiceServers(serverAttribute);
        res.status(201).json({ msg: "Log created successfully" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const ServerGetLogsALL = async (req, res) => {
    try {
        const monitor = await LogsServers.findAll({});
        res.status(200).json(monitor);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch HTTPs Logs" })
    }
}

export const SelectedServerGetLogs = async (req, res) => {
    const { uuidServers } =  req.body;

    try {
        const monitor = await LogsServers.findAll({ where: { uuidServers: uuidServers } });
        res.status(200).json(monitor);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch HTTPs Logs" })
    }
}

