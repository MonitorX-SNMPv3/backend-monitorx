import MonitorPorts from "../../models/monitorPorts.js";
import Users from "../../models/userModels.js";

export const createMonitorPorts = async (req, res) => {
    const { uuidUsers, hostname, ipaddress, port, protocol } = req.body;

    if ( !uuidUsers || !hostname || !ipaddress || !port || !protocol ) {
        return res.status(400).json({ msg: "Data ada yang kosong!" });
    }

    try {
        const users = Users.findOne({ where: {uuidUsers: uuidUsers } });
        if (!users) return res.status(404).json({ msg: "ID User tidak ditemukan" });
        
        await MonitorPorts.create({
            uuidUsers, 
            hostname, 
            ipaddress,
            port,
            protocol,
        });

        res.status(201).json({ msg: "Data Port Berhasil ditambahkan"})
        
    } catch (error) {
        res.status(400).json({ msg: error.message })
    }
};