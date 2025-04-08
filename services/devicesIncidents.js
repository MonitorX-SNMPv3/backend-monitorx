import ActivityDevices from "../models/activityDevices.js";
import IncidentsDevices from "../models/incidentsDevices.js";
import MonitorDevices from "../models/monitorDevices.js";
import { calculateDuration, getFormattedCurrentTime } from "../utils/time.js";
import { NotifyEmailActivity } from "./notifyEmail.js";

export const HandleOngoingIncidentsDevices = async ( attribute ) => {
    const durations = {
        "15S": "1m",
        "1M": "1m",
        "5M": "5m",
        "10M": "10m",
        "15M": "15m",
    };

    try {
        const incidents = await IncidentsDevices.findOne({ where: { status: "Ongoing", uuidDevices: attribute.uuidDevices }});
        
        if (!incidents) {
            const devices = await MonitorDevices.findOne({ where: { uuidDevices: attribute.uuidDevices }});
            const duration = durations[devices.statusCheck] || undefined;
            
            console.log(`[${new Date().toLocaleString()}] - Incidents not found! Creating Incidents...`);
            
            await IncidentsDevices.create({
                uuidDevices: attribute.uuidDevices,
                status: "Ongoing",
                rootcause: "Connection Timeout",
                started: Date.now(),
                resolved: "-",
                duration: duration,
            });
            
            const incidents = await IncidentsDevices.findOne({ where: { status: "Ongoing", uuidDevices: attribute.uuidDevices }});
            
            await ActivityDevices.create({
                uuidIncidents: incidents.uuidIncidents,
                description: "Connection timeout. The devices attempted to reach the target 3 times but received no response."
            });
            
            await NotifyEmailActivity( devices, incidents, 'devices' );
            return;
        }
        
        let calculatedDuration = calculateDuration(incidents.started);
        
        incidents.duration = calculatedDuration;
        await incidents.save();

        console.log(`[${new Date().toLocaleString()}] - Updating duration of devices incidents ${calculatedDuration}`);
        return;
    } catch (error) {
        console.log(`[${new Date().toLocaleString()}] - ${error.message}`);
    }   
}

export const HandleResolvedIncidentsDevices = async ( attribute ) => {
    try {
        const incidents = await IncidentsDevices.findOne({ where: { status: "Ongoing", uuidDevices: attribute.uuidDevices }});
        
        if (!incidents) { return console.log('Incidents not Found!') };
        
        let durationNow = calculateDuration(incidents.started);

        incidents.resolved = Date.now();
        incidents.duration = durationNow;
        incidents.status = "Resolved";

        await incidents.save();

        await ActivityDevices.create({
            uuidIncidents: incidents.uuidIncidents,
            description: "Devices Responses UP! Resolving incidents Successfully."
        })

        console.log(`[${new Date().toLocaleString()}] - Incidents Resolved! Downtime: ${durationNow}`);
        return;
    } catch (error) {
        console.log(`[${new Date().toLocaleString()}] - ${error.message}`);
    }
}