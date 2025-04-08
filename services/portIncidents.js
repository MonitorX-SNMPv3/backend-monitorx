import ActivityPorts from "../models/activityPorts.js";
import IncidentsPorts from "../models/incidentsPort.js";
import MonitorPorts from "../models/monitorPorts.js";
import { calculateDuration } from "../utils/time.js";
import { NotifyEmailActivity } from "./notifyEmail.js";

export const HandleOngoingIncidentsPorts = async ( attribute ) => {
    const durations = {
        "15S": "1m",
        "1M": "1m",
        "5M": "5m",
        "10M": "10m",
        "15M": "15m",
    };

    try {
        const incidents = await IncidentsPorts.findOne({ where: { status: "Ongoing", uuidPorts: attribute.uuidPorts }});
        
        if (!incidents) {
            const monitor = await MonitorPorts.findOne({ where: { uuidPorts: attribute.uuidPorts }});
            const duration = durations[monitor.statusCheck] || undefined;
            
            console.log(`[${new Date().toLocaleString()}] - Incidents not found! Creating Incidents...`);

            await IncidentsPorts.create({
                uuidPorts: attribute.uuidPorts,
                status: "Ongoing",
                rootcause: "Connection Timeout",
                started: Date.now(),
                resolved: '-',
                duration: duration,
            });
            
            const incidents = await IncidentsPorts.findOne({ where: { status: "Ongoing", uuidPorts: attribute.uuidPorts }});
            
            await ActivityPorts.create({
                uuidIncidents: incidents.uuidIncidents,
                description: "Connection timeout. Ports logs attempted to reach the target 3 times but received no response."
            });
            
            await NotifyEmailActivity(monitor, incidents, 'ports');
            return;
        }
        
        let calculatedDuration = calculateDuration(incidents.started);
        
        incidents.duration = calculatedDuration;
        await incidents.save();

        console.log(`[${new Date().toLocaleString()}] - Updating duration of Ports incidents ${calculatedDuration}`);
        return;
    } catch (error) {
        console.log(`[${new Date().toLocaleString()}] - ${error.message}`);
    }   
}

export const HandleResolvedIncidentsPorts = async ( attribute ) => {
    try {
        const incidents = await IncidentsPorts.findOne({ where: { status: "Ongoing" , uuidPorts: attribute.uuidPorts }});
        
        if (!incidents) { return console.log('Incidents not Found!') };
        
        let durationNow = calculateDuration(incidents.started);

        incidents.resolved = Date.now();
        incidents.duration = durationNow;
        incidents.status = "Resolved";

        await incidents.save();

        await ActivityPorts.create({
            uuidIncidents: incidents.uuidIncidents,
            description: "Ports Responses UP! Resolving incidents Successfully."
        });
        console.log(`[${new Date().toLocaleString()}] - Incidents Resolved! Downtime: ${durationNow}`);
        return;
    } catch (error) {
        console.log(`[${new Date().toLocaleString()}] - Resolve Incidents -  ${error.message}`);
    }
}