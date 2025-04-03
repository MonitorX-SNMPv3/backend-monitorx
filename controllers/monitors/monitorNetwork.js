import MonitorNetworks from "../../models/monitorNetwork.js";
import Users from "../../models/userModels.js";

export const createMonitorNetworks = async (req, res) => {
    const { uuidUsers, hostname, ipaddress, type, statusCheck } = req.body;

    if ( !uuidUsers || !hostname || !ipaddress || !type || !statusCheck ) {
        return res.status(400).json({ msg: "Data Kosong! Pastikan telah mengisi Hostname dan IP Address!" });
    }
    
    try {
        const users = Users.findOne({ where: {uuidUsers: uuidUsers } });
        if (!users) return res.status(404).json({ msg: "ID User tidak ditemukan" });
        
        await MonitorNetworks.create({
            uuidUsers: uuidUsers, 
            hostname: hostname, 
            ipaddress: ipaddress,
            type: type,
            statusCheck: statusCheck,
        });

        res.status(201).json({ msg: "Data Network Berhasil ditambahkan"})
        
    } catch (error) {
        res.status(400).json({ msg: error.message })
    }
};