import express from "express";
import { CalculateMTTRSummary, GetAllIncidents, GetIncidentsByUUID, GetIncidentsCount } from "../controllers/incidents.js";

const router = express.Router();

router.get('/api/get_all_incidents', GetAllIncidents);
router.get('/api/get_incidents_count', GetIncidentsCount);
router.get('/api/calculate_mttr_summary', CalculateMTTRSummary);


router.post('/api/get_specific_incidents', GetIncidentsByUUID);

export default router;