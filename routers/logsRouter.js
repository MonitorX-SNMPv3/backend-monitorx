import express from "express";
import { createLogsManualHTTPs, HTTPGetLogsALL, SelectedHTTPsGetLogs } from "../controllers/logs/logsHTTPs.js";
import { createLogsManualServers, SelectedServerGetLogs, ServerGetLogsALL } from "../controllers/logs/logsServer.js";

const router = express.Router();

//** ROUTER HTTPs */
router.post('/api/add_logs_http', createLogsManualHTTPs);
router.get('/api/get_logs_http', HTTPGetLogsALL);
router.get('/api/get_logs_http_specific', SelectedHTTPsGetLogs);

//** ROUTER SERVER */
router.post('/api/add_logs_server', createLogsManualServers);
router.get('/api/get_logs_server', ServerGetLogsALL);
router.get('/api/get_logs_server_specific', SelectedServerGetLogs);

//** ROUTER Network */
// router.post('/api/add_logs_server', createLogsManualServers);

//** ROUTER Port */
// router.post('/api/add_logs_server', createLogsManualServers);

export default router;