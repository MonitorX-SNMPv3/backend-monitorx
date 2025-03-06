import express from "express";
import { createLogsManualHTTPs, HTTPGetLogsALL } from "../controllers/logs/logsHTTPs.js";
import { createLogsManualServers, ServerGetLogsALL } from "../controllers/logs/logsServer.js";

const router = express.Router();

//** ROUTER HTTPs */
router.post('/api/add_logs_http', createLogsManualHTTPs);
router.get('/api/get_logs_http', HTTPGetLogsALL);

//** ROUTER SERVER */
router.post('/api/add_logs_server', createLogsManualServers);
router.get('/api/get_logs_server', ServerGetLogsALL);

//** ROUTER Network */
// router.post('/api/add_logs_server', createLogsManualServers);

//** ROUTER Port */
// router.post('/api/add_logs_server', createLogsManualServers);

export default router;