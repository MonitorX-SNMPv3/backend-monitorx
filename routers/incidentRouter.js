import express from "express";
import { GetAllIncidents, GetIncidentsByUUID, GetIncidentsCount } from "../controllers/incidents.js";

const router = express.Router();

router.get('/api/get_all_incidents', GetAllIncidents);
router.get('/api/get_incidents_count', GetIncidentsCount);

router.post('/api/get_specific_incidents', GetIncidentsByUUID);

export default router;