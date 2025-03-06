import MonitorServers from "../../models/monitorServer.js";
import Users from "../../models/userModels.js";

export const createMonitorServers = async (req, res) => {
    const { uuidUsers, hostname, ipaddress, 
        snmp_username, snmp_authkey, snmp_privkey, snmp_port } = req.body;

    if ( !uuidUsers || !hostname || !ipaddress || 
        !snmp_username || !snmp_authkey || !snmp_privkey || !snmp_port ) {
        return res.status(400).json({ msg: "Data ada yang kosong!" });
    }
    
    try {
        const users = Users.findOne({ where: {uuidUsers: uuidUsers } });
        if (!users) return res.status(404).json({ msg: "ID User tidak ditemukan" });
        
        await MonitorServers.create({ 
            uuidUsers: uuidUsers, 
            hostname: hostname, 
            ipaddress: ipaddress, 
            snmp_username: snmp_username,
            snmp_authkey: snmp_authkey,
            snmp_privkey: snmp_privkey,
            snmp_port: snmp_port,
        });

        res.status(201).json({ msg: "Data Server Berhasil ditambahkan"})

    } catch (error) {
        res.status(400).json({ msg: error.message })
    }
};