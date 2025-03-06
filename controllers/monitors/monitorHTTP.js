import MonitorHTTPs from "../../models/monitorHTTP.js";
import Users from "../../models/userModels.js";

export const createMonitorHTTPs = async (req, res) => {
    const { uuidUsers, hostname, ipaddress } = req.body;

    if ( !uuidUsers || !hostname || !ipaddress ) {
        return res.status(400).json({ msg: "Data ada yang kosong!" });
    }

    try {
        const users = Users.findOne({ where: {uuidUsers: uuidUsers } });
        if (!users) return res.status(404).json({ msg: "ID User tidak ditemukan" });
        
        await MonitorHTTPs.create({ 
            uuidUsers, 
            hostname, 
            ipaddress 
        });
        
        res.status(201).json({ msg: "Data HTTP/HTTPS Berhasil ditambahkan"})

    } catch (error) {
        res.status(400).json({ msg: error.message })
    }
};