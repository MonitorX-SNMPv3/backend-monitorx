import PdfPrinter from "pdfmake";
import MonitorHTTPs from "../../models/monitorHTTP.js";
import Users from "../../models/userModels.js";
import LogsHTTPs from "../../models/logsHTTP.js";
import { GlobalPDFTemplates } from "../../utils/templates/monitorSummary.js";
import IncidentsHTTPs from "../../models/incidentsHTTP.js";
import { fonts } from "../../utils/templates/fonts.js";
import { ArrayUptimeLogs } from "../../utils/logsHelper.js";

export const createMonitorHTTPs = async (req, res) => {
    const { uuidUsers, hostname, ipaddress, statusCheck } = req.body;

    if ( !uuidUsers || !hostname || !ipaddress ) {
        return res.status(400).json({ msg: "Pastikan Hostname dan IP Address tidak kosong!" });
    }

    if ( !statusCheck ) {
        return res.status(400).json({ msg: "Status Check Kosong!"});
    }
    
    if (!ipaddress.startsWith("http://") && !ipaddress.startsWith("https://")) {
        return res.status(400).json({ msg: "IP Address harus dimulai dengan 'http://' atau 'https://'" });
    }
    

    try {
        const users = Users.findOne({ where: {uuidUsers: uuidUsers } });
        if (!users) return res.status(404).json({ msg: "ID User tidak ditemukan" });
        
        await MonitorHTTPs.create({ 
            uuidUsers: uuidUsers, 
            hostname: hostname, 
            ipaddress: ipaddress,
            statusCheck: statusCheck,
            running: "STARTED",
        });
        
        console.log(`[${new Date().toLocaleString()}] - Devicee ${hostname} berhasil ditambahkan ke DB`);
        res.status(201).json({ msg: "Data HTTP/HTTPS Berhasil ditambahkan"})

    } catch (error) {
        res.status(400).json({ msg: error.message })
    }
};

export const UpdateMonitorHTTPs = async (req, res) => {
    const { uuid, hostname, ipaddress, statusCheck } = req.body;

    try {
        const monitor = await MonitorHTTPs.findOne({ where: { uuidHTTPs: uuid } });
        if (!monitor) {
            return res.status(404).json({ msg: "Monitor tidak ditemukan" });
        }

        monitor.hostname = hostname ?? monitor.hostname;
        monitor.ipaddress = ipaddress ?? monitor.ipaddress;
        monitor.statusCheck = statusCheck ?? monitor.statusCheck;

        await monitor.save();

        console.log(`[${new Date().toLocaleString()}] - Monitor ${hostname} berhasil diperbarui`);
        res.status(200).json({ msg: "Data HTTP/HTTPS berhasil diperbarui" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

export const MonitorHTTPsPDF = async (req, res) => {
    const { uuid } = req.body;
    const printer = new PdfPrinter(fonts);

    try {
        if (!uuid) { 
            return res.status(400).json({ msg: 'UUID Undefined' });
        }

        const monitorData = await MonitorHTTPs.findOne({ 
            where: { uuidHTTPs: uuid } 
        });

        if (!monitorData) {
            return res.status(404).json({ msg: 'Monitor not found' });
        }

        const logs = await LogsHTTPs.findAll({
            where: { uuidHTTPs: monitorData.uuidHTTPs },
            order: [['createdAt', 'ASC']]
        });

        const monitor = monitorData.toJSON();
        monitor.logs = await ArrayUptimeLogs(logs, 'https');

        const incidentsData = await IncidentsHTTPs.findAll({
            where: { uuidHTTPs: uuid },
            order: [['createdAt', 'DESC']]
        });

        const incidents = incidentsData.map(incident => {
            const inc = incident.toJSON();
            if (inc.started) {
                const dateObj = new Date(Number(inc.started));
                inc.started = new Date(dateObj.getTime() + 7 * 60 * 60 * 1000)
                    .toLocaleString("id-ID", { timeZone: "Asia/Bangkok" });
            }
            if (inc.resolved && inc.resolved !== "-") {
                const dateObj = new Date(Number(inc.resolved));
                inc.resolved = new Date(dateObj.getTime() + 7 * 60 * 60 * 1000)
                    .toLocaleString("id-ID", { timeZone: "Asia/Bangkok" });
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


