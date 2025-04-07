import PdfPrinter from "pdfmake";
import LogsServers from "../../models/logsServer.js";
import MonitorServers from "../../models/monitorServer.js";
import Users from "../../models/userModels.js";
import { ArrayUptimeLogs } from "../../utils/logsHelper.js";
import { ServerPDFTemplates } from "../../utils/templates/monitorSummary.js";
import { fonts } from "../../utils/templates/fonts.js";

export const createMonitorServers = async (req, res) => {
    const { uuidUsers, hostname, ipaddress, 
        snmp_username, snmp_authkey, snmp_privkey, snmp_port, statusCheck } = req.body;

    if ( !uuidUsers || !hostname || !ipaddress || 
        !snmp_username || !snmp_authkey || !snmp_privkey || !snmp_port || !statusCheck ) {
        return res.status(400).json({ msg: "Data ada yang kosong!" });
    }
    
    try {
        const users = Users.findOne({ where: {uuidUsers: uuidUsers } });
        if (!users) return res.status(404).json({ msg: "ID User tidak ditemukan" });
        
        await MonitorServers.create({ 
            uuidUsers: uuidUsers, 
            hostname: hostname, 
            ipaddress: ipaddress, 
            snmp_username: snmp_username,
            snmp_authkey: snmp_authkey,
            snmp_privkey: snmp_privkey,
            snmp_port: snmp_port,
            statusCheck: statusCheck,
            running: "STARTED",
        });

        console.log(`[${new Date().toLocaleString()}] - Monitor ${hostname} berhasil ditambahkan`);
        res.status(201).json({ msg: "Data Server Berhasil ditambahkan"})
    } catch (error) {
        res.status(400).json({ msg: error.message })
    }
};

export const updateMonitorServer = async (req, res) => {
    const {
        uuidServers,
        hostname,
        ipaddress,
        snmp_username,
        snmp_authkey,
        snmp_privkey,
        snmp_port,
        statusCheck,
        running,
    } = req.body;

    try {
        const monitor = await MonitorServers.findOne({
            where: { uuidServers },
        });

        if (!monitor) {
            return res.status(404).json({ msg: 'Monitor server tidak ditemukan.' });
        }

        // Update field-field
        monitor.hostname = hostname ?? monitor.hostname;
        monitor.ipaddress = ipaddress ?? monitor.ipaddress;
        monitor.snmp_username = snmp_username ?? monitor.snmp_username;
        monitor.snmp_authkey = snmp_authkey ?? monitor.snmp_authkey;
        monitor.snmp_privkey = snmp_privkey ?? monitor.snmp_privkey;
        monitor.snmp_port = snmp_port ?? monitor.snmp_port;
        monitor.statusCheck = statusCheck ?? monitor.statusCheck;
        monitor.running = running ?? monitor.running;

        await monitor.save();

        res.status(200).json({ msg: 'Monitor server berhasil diperbarui.', data: monitor });
    } catch (error) {
        console.error(`[${new Date().toLocaleString()}] - updateMonitorServer Error:`, error.message);
        res.status(500).json({ msg: 'Gagal memperbarui monitor server.' });
    }
};

export const MonitorServerPDF = async (req, res) => {
    const { uuid } = req.body;
    const printer = new PdfPrinter(fonts);

    try {
        if ( !uuid ) { return res.status(400).json({ msg: 'UUID Undefined' })};

        const monitorData = await MonitorServers.findOne({ where: { uuidServers: uuid } });

        if (!monitorData) {
            return res.status(404).json({ msg: 'Monitor not found' });
        }

        const logs = await LogsServers.findAll({
            where: { uuidServers: monitorData.uuidServers },
            order: [['createdAt', 'ASC']]
        });

        const monitor = monitorData.toJSON();
        monitor.logs = await ArrayUptimeLogs(logs, 'server');

        const docDefinition = ServerPDFTemplates(monitor);
        const pdfDoc = printer.createPdfKitDocument(docDefinition);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=monitor-summary.pdf');

        pdfDoc.pipe(res);
        pdfDoc.end();
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};


