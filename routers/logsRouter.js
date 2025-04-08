import express from "express";
import { createLogsManualHTTPs, HTTPGetLogsALL, SelectedHTTPsGetLogs } from "../controllers/logs/logsHTTPs.js";
import { createLogsManualDevices, SelectedDevicesGetLogs, DevicesGetLogsALL } from "../controllers/logs/logsDevices.js";
import { AvgResponseTime, ClearLogs } from "../controllers/logs.js";
import { createLogsManualPorts } from "../controllers/logs/logsPort.js";

const router = express.Router();

//** ROUTER HTTPs */
router.post('/api/add_logs_http', createLogsManualHTTPs);
router.get('/api/get_logs_http', HTTPGetLogsALL);
router.get('/api/get_logs_http_specific', SelectedHTTPsGetLogs);

//** ROUTER DEVICE */
router.post('/api/add_logs_devices', createLogsManualDevices);
router.get('/api/get_logs_devices', DevicesGetLogsALL);
router.get('/api/get_logs_devices_specific', SelectedDevicesGetLogs);

router.post('/api/add_logs_ports', createLogsManualPorts);


router.get('/api/avg_response_time', AvgResponseTime);

router.delete('/api/clear_logs', ClearLogs);

//** ROUTER Port */


export default router;