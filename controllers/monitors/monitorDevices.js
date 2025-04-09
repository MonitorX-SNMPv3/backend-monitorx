import PdfPrinter from "pdfmake";
import LogsDevices from "../../models/logsDevices.js";
import MonitorDevices from "../../models/monitorDevices.js";
import Users from "../../models/userModels.js";
import { ArrayUptimeLogs } from "../../utils/logsHelper.js";
import { DevicesPDFTemplates } from "../../utils/templates/monitorSummary.js";
import { fonts } from "../../utils/templates/fonts.js";
import IncidentsDevices from "../../models/incidentsDevices.js";

export const createMonitorDevices = async (req, res) => {
    const { uuidUsers, hostname, ipaddress, 
        snmp_username, snmp_authkey, snmp_privkey, snmp_port, statusCheck } = req.body;

    if ( !uuidUsers || !hostname || !ipaddress || 
        !snmp_username || !snmp_authkey || !snmp_privkey || !snmp_port || !statusCheck ) {
        return res.status(400).json({ msg: "Data ada yang kosong!" });
    }
    
    try {
        const users = Users.findOne({ where: {uuidUsers: uuidUsers } });
        if (!users) return res.status(404).json({ msg: "ID User tidak ditemukan" });
        
        await MonitorDevices.create({ 
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
        res.status(201).json({ msg: "Data Device Berhasil ditambahkan"})
    } catch (error) {
        res.status(400).json({ msg: error.message })
    }
};

export const UpdateMonitorDevices = async (req, res) => {
    const {
        uuidDevices,
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
        const monitor = await MonitorDevices.findOne({
            where: { uuidDevices },
        });

        if (!monitor) {
            return res.status(404).json({ msg: 'Monitor devices tidak ditemukan.' });
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

        res.status(200).json({ msg: 'Monitor devices berhasil diperbarui.', data: monitor });
    } catch (error) {
        console.error(`[${new Date().toLocaleString()}] - updateMonitorDevice Error:`, error.message);
        res.status(500).json({ msg: 'Gagal memperbarui monitor devices.' });
    }
};

export const MonitorDevicesPDF = async (req, res) => {
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

    const { uuid } = req.body;
    const printer = new PdfPrinter(fonts);

    try {
        if ( !uuid ) { return res.status(400).json({ msg: 'UUID Undefined' })};

        const monitorData = await MonitorDevices.findOne({ where: { uuidDevices: uuid } });

        if (!monitorData) {
            return res.status(404).json({ msg: 'Monitor not found' });
        }

        const logs = await LogsDevices.findAll({
            where: { uuidDevices: monitorData.uuidDevices },
            order: [['createdAt', 'ASC']]
        });

        const monitor = monitorData.toJSON();
        monitor.logs = await ArrayUptimeLogs(logs, 'devices');

        const incidentsData = await IncidentsDevices.findAll({
            where: { uuidDevices: uuid },
            order: [['createdAt', 'DESC']]
        });

        const incidents = incidentsData.map(incident => {
            const inc = incident.toJSON();
            if (inc.started) {
                const dateObj = new Date(Number(inc.started));
                // add 7 hours
                const adjustedStarted = new Date(dateObj.getTime() + 7 * 60 * 60 * 1000);
                inc.started = dateFormat.format(adjustedStarted);
            }
            if (inc.resolved && inc.resolved !== "-") {
                const dateObj = new Date(Number(inc.resolved));
                const adjustedResolved = new Date(dateObj.getTime() + 7 * 60 * 60 * 1000);
                inc.resolved = dateFormat.format(adjustedResolved);
            }
            return inc;
        });
        monitor.incidents = incidents;

        const docDefinition = DevicesPDFTemplates(monitor);
        const pdfDoc = printer.createPdfKitDocument(docDefinition);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=monitor-summary.pdf');

        pdfDoc.pipe(res);
        pdfDoc.end();
    } catch (error) {
        console.log(error.message);
        
        res.status(500).json({ msg: error.message });
    }
};


