import express from "express";
import { createMonitorHTTPs } from "../controllers/monitors/monitorHTTP.js";
import { createMonitorServers } from "../controllers/monitors/monitorServer.js";
import { createMonitorPorts } from "../controllers/monitors/monitorPort.js";
import { createMonitorNetworks } from "../controllers/monitors/monitorNetwork.js";

const router = express.Router();

router.post('/api/add_monitor_http', createMonitorHTTPs);
router.post('/api/add_monitor_server', createMonitorServers);
router.post('/api/add_monitor_port', createMonitorPorts);
router.post('/api/add_monitor_network', createMonitorNetworks);

export default router;