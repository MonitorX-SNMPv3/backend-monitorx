import LogsHTTPs from "../../models/logsHTTP.js";
import MonitorHTTPs from "../../models/monitorHTTP.js";

export const createLogsManualHTTPs = async (req, res) => {
    const { uuidHTTPs } = req.body;

    try {
        const selectedHTTP = await MonitorHTTPs.findOne({ where: { uuidHTTPs: uuidHTTPs } });
        if (!selectedHTTP) return res.status(404).json({ msg: "monitors not found" });

        await ServiceHTTPs(selectedHTTP);
        res.status(201).json({ msg: "Log created successfully" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const HTTPGetLogsALL = async (req, res) => {
    try {
        const monitor = await LogsHTTPs.findAll({});
        res.status(200).json(monitor);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch HTTPs Logs" })
    }
}