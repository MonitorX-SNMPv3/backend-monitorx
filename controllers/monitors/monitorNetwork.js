import MonitorNetworks from "../../models/monitorNetwork.js";
import Users from "../../models/userModels.js";

export const createMonitorNetworks = async (req, res) => {
    const { uuidUsers, hostname, ipaddress, type } = req.body;

    if ( !uuidUsers || !hostname || !ipaddress || !type ) {
        return res.status(400).json({ msg: "Data ada yang kosong!" });
    }

    try {
        const users = Users.findOne({ where: {uuidUsers: uuidUsers } });
        if (!users) return res.status(404).json({ msg: "ID User tidak ditemukan" });
        
        await MonitorNetworks.create({
            uuidUsers, 
            hostname, 
            ipaddress,
            type,
        });

        res.status(201).json({ msg: "Data Port Berhasil ditambahkan"})
        
    } catch (error) {
        res.status(400).json({ msg: error.message })
    }
};