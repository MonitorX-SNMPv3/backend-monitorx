import express from "express";
import { createMonitorHTTPs } from "../controllers/monitors/monitorHTTP.js";
import { createMonitorServers, MonitorServerPDF } from "../controllers/monitors/monitorServer.js";
import { createMonitorPorts } from "../controllers/monitors/monitorPort.js";
import { Calculate24HourSummary, CalculateGlobalSLA24h, CalculateWeeklySLA, DeleteMonitor, GetAllMonitorWithLogs, GetMonitorStatusCount, PauseMonitor, StartMonitor, TestAlertEmail } from "../controllers/monitor.js";
import { CalculateGlobalSLA } from "../controllers/monitor.js";

const router = express.Router();

router.post('/api/add_monitor_http', createMonitorHTTPs);
router.post('/api/add_monitor_server', createMonitorServers);
router.post('/api/add_monitor_port', createMonitorPorts);
router.post('/api/calculate_24h_summary', Calculate24HourSummary);
router.post('/api/monitor_server_pdf', MonitorServerPDF);
router.post('/api/test_alert', TestAlertEmail);

router.get('/api/get_monitor_with_logs', GetAllMonitorWithLogs);
router.get('/api/get_monitor_status_count', GetMonitorStatusCount);
router.get('/api/calculate_global_sla', CalculateGlobalSLA);
router.get('/api/calculate_global_sla_24h', CalculateGlobalSLA24h);
router.get('/api/calculate_weekly_sla', CalculateWeeklySLA);

router.delete('/api/delete_monitor', DeleteMonitor);

router.patch('/api/pause_monitor', PauseMonitor);
router.patch('/api/start_monitor', StartMonitor);

export default router;