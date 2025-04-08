import MonitorHTTPs from "../../models/monitorHTTP.js";
import Users from "../../models/userModels.js";

export const createMonitorHTTPs = async (req, res) => {
    const { uuidUsers, hostname, ipaddress, statusCheck } = req.body;

    if ( !uuidUsers || !hostname || !ipaddress || !statusCheck ) {
        return res.status(400).json({ msg: "Pastikan Hostname dan IP Address tidak kosong!" });
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

    // Validate required fields
    if (!uuid || !hostname || !ipaddress || !statusCheck) {
        return res.status(400).json({ msg: "Pastikan UUID, Hostname, IP Address, dan statusCheck tidak kosong!" });
    }

    // Validate IP address format
    if (!ipaddress.startsWith("http://") && !ipaddress.startsWith("https://")) {
        return res.status(400).json({ msg: "IP Address harus dimulai dengan 'http://' atau 'https://'" });
    }

    try {
        // Find the monitor using the provided uuid (assuming the field name in the database is uuidHTTPs)
        const monitor = await MonitorHTTPs.findOne({ where: { uuidHTTPs: uuid } });
        if (!monitor) {
            return res.status(404).json({ msg: "Monitor tidak ditemukan" });
        }

        // Update the monitor record
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
