import MonitorPorts from "../../models/monitorPorts.js";
import { ServicePorts } from "../../services/portServices.js";

export const createLogsManualPorts = async (req, res) => {
    const { uuidPorts } = req.body;

    try {
        const selectedPort = await MonitorPorts.findOne({ where: { uuidPorts: uuidPorts } });
        if (!selectedPort) return res.status(404).json({ msg: "monitors not found" });

        await ServicePorts(selectedPort);
        res.status(201).json({ msg: "Log created successfully" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};