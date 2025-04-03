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
        });
        
        res.status(201).json({ msg: "Data HTTP/HTTPS Berhasil ditambahkan"})

    } catch (error) {
        res.status(400).json({ msg: error.message })
    }
};