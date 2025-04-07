import ActivityHTTPs from "../models/activityHTTP.js";
import IncidentsHTTPs from "../models/incidentsHTTP.js";
import MonitorHTTPs from "../models/monitorHTTP.js";
import { calculateDuration } from "../utils/time.js";
import { NotifyEmailActivity } from "./notifyEmail.js";

export const HandleOngoingIncidentsHTTPs = async ( attribute ) => {
    const durations = {
        "15S": "1m",
        "1M": "1m",
        "5M": "5m",
        "10M": "10m",
        "15M": "15m",
    };

    try {
        const incidents = await IncidentsHTTPs.findOne({ where: { status: "Ongoing", uuidHTTPs: attribute.uuidHTTPs }});
        
        if (!incidents) {
            const monitor = await MonitorHTTPs.findOne({ where: { uuidHTTPs: attribute.uuidHTTPs }});
            const duration = durations[monitor.statusCheck] || undefined;
            
            console.log(`[${new Date().toLocaleString()}] - Incidents not found! Creating Incidents...`);

            await IncidentsHTTPs.create({
                uuidHTTPs: attribute.uuidHTTPs,
                status: "Ongoing",
                rootcause: "Connection Timeout",
                started: Date.now(),
                resolved: '-',
                duration: duration,
            });
            
            const incidents = await IncidentsHTTPs.findOne({ where: { status: "Ongoing", uuidHTTPs: attribute.uuidHTTPs }});
            
            await ActivityHTTPs.create({
                uuidIncidents: incidents.uuidIncidents,
                description: "Connection timeout. HTTPs logs attempted to reach the target 3 times but received no response."
            });
            
            await NotifyEmailActivity( monitor, incidents, 'https');
            return;
        }
        
        let calculatedDuration = calculateDuration(incidents.started);
        
        incidents.duration = calculatedDuration;
        await incidents.save();

        console.log(`[${new Date().toLocaleString()}] - Updating duration of HTTPs incidents ${calculatedDuration}`);
        return;
    } catch (error) {
        console.log(`[${new Date().toLocaleString()}] - ${error.message}`);
    }   
}

export const HandleResolvedIncidentsHTTPs = async ( attribute ) => {
    try {
        const incidents = await IncidentsHTTPs.findOne({ where: { status: "Ongoing" , uuidHTTPs: attribute.uuidHTTPs }});
        
        if (!incidents) { return console.log('Incidents not Found!') };
        
        let durationNow = calculateDuration(incidents.started);

        incidents.resolved = Date.now();
        incidents.duration = durationNow;
        incidents.status = "Resolved";

        await incidents.save();

        await ActivityHTTPs.create({
            uuidIncidents: incidents.uuidIncidents,
            description: "HTTPs Responses UP! Resolving incidents Successfully."
        });
        console.log(`[${new Date().toLocaleString()}] - Incidents Resolved! Downtime: ${durationNow}`);
        return;
    } catch (error) {
        console.log(`[${new Date().toLocaleString()}] - Resolve Incidents -  ${error.message}`);
    }
}