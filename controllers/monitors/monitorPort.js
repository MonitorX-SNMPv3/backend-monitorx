import PdfPrinter from "pdfmake";
import MonitorPorts from "../../models/monitorPorts.js";
import Users from "../../models/userModels.js";
import { fonts } from "../../utils/templates/fonts.js";
import LogsPorts from "../../models/logsPort.js";
import { ArrayUptimeLogs } from "../../utils/logsHelper.js";
import IncidentsPorts from "../../models/incidentsPort.js";
import { GlobalPDFTemplates } from "../../utils/templates/monitorSummary.js";

export const createMonitorPorts = async (req, res) => {
    const { uuidUsers, hostname, ipaddress, port, protocol, statusCheck } = req.body;

    if ( !uuidUsers || !hostname || !ipaddress || !port || !protocol ) {
        return res.status(400).json({ msg: "Data ada yang kosong! Isi semua kolom yang ada!" });
    }

    try {
        const users = Users.findOne({ where: {uuidUsers: uuidUsers } });
        if (!users) return res.status(404).json({ msg: "ID User tidak ditemukan" });
        
        await MonitorPorts.create({
            uuidUsers: uuidUsers, 
            hostname: hostname, 
            ipaddress: ipaddress,
            port: port,
            protocol: protocol,
            statusCheck: statusCheck,
            running: "STARTED",
        });


        console.log(`[${new Date().toLocaleString()}] - Monitor ${hostname} berhasil ditambahkan`);
        res.status(201).json({ msg: "Data Port Berhasil ditambahkan"})
        
    } catch (error) {
        res.status(400).json({ msg: error.message })
    }
};

export const UpdateMonitorPorts = async (req, res) => {
    const { uuid, hostname, ipaddress, port, protocol, statusCheck } = req.body;

    try {
        const monitor = await MonitorPorts.findOne({ where: { uuidPorts: uuid } });
        
        if (!monitor) {
            return res.status(404).json({ msg: "Monitor tidak ditemukan" });
        }

        monitor.hostname = hostname ?? monitor.hostname;
        monitor.ipaddress = ipaddress ?? monitor.ipaddress;
        monitor.statusCheck = statusCheck ?? monitor.statusCheck;
        monitor.port = port ?? monitor.port;
        monitor.protocol = protocol ?? monitor.protocol;

        await monitor.save();

        console.log(`[${new Date().toLocaleString()}] - Monitor ${hostname} berhasil diperbarui`);
        res.status(200).json({ msg: "Data Port berhasil diperbarui" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};


export const MonitorPortsPDF = async (req, res) => {
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
        if (!uuid) { 
            return res.status(400).json({ msg: 'UUID Undefined' });
        }

        const monitorData = await MonitorPorts.findOne({ 
            where: { uuidPorts: uuid } 
        });

        if (!monitorData) {
            return res.status(404).json({ msg: 'Monitor not found' });
        }

        const logs = await LogsPorts.findAll({
            where: { uuidPorts: monitorData.uuidPorts },
            order: [['createdAt', 'ASC']]
        });

        const monitor = monitorData.toJSON();
        monitor.logs = await ArrayUptimeLogs(logs, 'ports');

        const incidentsData = await IncidentsPorts.findAll({
            where: { uuidPorts: uuid },
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

        const docDefinition = GlobalPDFTemplates(monitor);
        const pdfDoc = printer.createPdfKitDocument(docDefinition);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=monitor-summary.pdf');

        pdfDoc.pipe(res);
        pdfDoc.end();
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};
