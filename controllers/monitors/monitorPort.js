import MonitorPorts from "../../models/monitorPorts.js";
import Users from "../../models/userModels.js";

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

    // Validate required fields
    if (!uuid || !hostname || !ipaddress || !port || !protocol || !statusCheck) {
        return res.status(400).json({ msg: "Data ada yang kosong! Isi semua kolom yang ada!" });
    }

    // Validate ipaddress format if necessary (e.g., must start with http:// or https://)
    if (!ipaddress.startsWith("http://") && !ipaddress.startsWith("https://")) {
        return res.status(400).json({ msg: "IP Address harus dimulai dengan 'http://' atau 'https://'" });
    }

    try {
        // Find the port monitor record using the provided uuid (assuming the field in the DB is uuidPorts)
        const monitor = await MonitorPorts.findOne({ where: { uuidPorts: uuid } });
        if (!monitor) {
            return res.status(404).json({ msg: "Monitor tidak ditemukan" });
        }

        // Update the monitor record with new values
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
