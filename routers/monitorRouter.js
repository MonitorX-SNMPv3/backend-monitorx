import express from "express";
import { createMonitorHTTPs, MonitorHTTPsPDF, UpdateMonitorHTTPs } from "../controllers/monitors/monitorHTTP.js";
import { createMonitorDevices, MonitorDevicesPDF, UpdateMonitorDevices } from "../controllers/monitors/monitorDevices.js";
import { createMonitorPorts, MonitorPortsPDF, UpdateMonitorPorts } from "../controllers/monitors/monitorPort.js";
import { Calculate24HourSummary, CalculateGlobalSLA24h, CalculateWeeklySLA, DeleteMonitor, GetAllMonitorWithLogs, GetMonitorStatusCount, PauseMonitor, StartMonitor, TestAlertEmail } from "../controllers/monitor.js";
import { CalculateGlobalSLA } from "../controllers/monitor.js";

const router = express.Router();

router.post('/api/add_monitor_http', createMonitorHTTPs);
router.post('/api/add_monitor_devices', createMonitorDevices);
router.post('/api/add_monitor_port', createMonitorPorts);
router.post('/api/calculate_24h_summary', Calculate24HourSummary);
router.post('/api/monitor_devices_pdf', MonitorDevicesPDF);
router.post('/api/monitor_https_pdf', MonitorHTTPsPDF);
router.post('/api/monitor_ports_pdf', MonitorPortsPDF);
router.post('/api/test_alert', TestAlertEmail);

router.get('/api/get_monitor_with_logs', GetAllMonitorWithLogs);
router.get('/api/get_monitor_status_count', GetMonitorStatusCount);
router.get('/api/calculate_global_sla', CalculateGlobalSLA);
router.get('/api/calculate_global_sla_24h', CalculateGlobalSLA24h);
router.get('/api/calculate_weekly_sla', CalculateWeeklySLA);

router.delete('/api/delete_monitor', DeleteMonitor);

router.patch('/api/pause_monitor', PauseMonitor);
router.patch('/api/start_monitor', StartMonitor);

router.patch('/api/edit_monitor_https', UpdateMonitorHTTPs);
router.patch('/api/edit_monitor_devices', UpdateMonitorDevices);
router.patch('/api/edit_monitor_ports', UpdateMonitorPorts);


export default router;