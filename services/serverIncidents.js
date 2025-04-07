import ActivityServer from "../models/activityServer.js";
import IncidentsServers from "../models/incidentsServer.js";
import MonitorServers from "../models/monitorServer.js";
import { calculateDuration, getFormattedCurrentTime } from "../utils/time.js";
import { NotifyEmailActivity } from "./notifyEmail.js";

export const HandleOngoingIncidentsServer = async ( attribute ) => {
    const durations = {
        "15S": "1m",
        "1M": "1m",
        "5M": "5m",
        "10M": "10m",
        "15M": "15m",
    };

    try {
        const incidents = await IncidentsServers.findOne({ where: { status: "Ongoing", uuidServers: attribute.uuidServers }});
        
        if (!incidents) {
            const server = await MonitorServers.findOne({ where: { uuidServers: attribute.uuidServers }});
            const duration = durations[server.statusCheck] || undefined;
            
            console.log(`[${new Date().toLocaleString()}] - Incidents not found! Creating Incidents...`);
            
            await IncidentsServers.create({
                uuidServers: attribute.uuidServers,
                status: "Ongoing",
                rootcause: "Connection Timeout",
                started: Date.now(),
                resolved: "-",
                duration: duration,
            });
            
            const incidents = await IncidentsServers.findOne({ where: { status: "Ongoing", uuidServers: attribute.uuidServers }});
            
            await ActivityServer.create({
                uuidIncidents: incidents.uuidIncidents,
                description: "Connection timeout. The server attempted to reach the target 3 times but received no response."
            });
            
            await NotifyEmailActivity( server, incidents, 'server' );
            return;
        }
        
        let calculatedDuration = calculateDuration(incidents.started);
        
        incidents.duration = calculatedDuration;
        await incidents.save();

        console.log(`[${new Date().toLocaleString()}] - Updating duration of server incidents ${calculatedDuration}`);
        return;
    } catch (error) {
        console.log(`[${new Date().toLocaleString()}] - ${error.message}`);
    }   
}

export const HandleResolvedIncidentsServer = async ( attribute ) => {
    try {
        const incidents = await IncidentsServers.findOne({ where: { status: "Ongoing", uuidServers: attribute.uuidServers }});
        
        if (!incidents) { return console.log('Incidents not Found!') };
        
        let durationNow = calculateDuration(incidents.started);

        incidents.resolved = Date.now();
        incidents.duration = durationNow;
        incidents.status = "Resolved";

        await incidents.save();

        await ActivityServer.create({
            uuidIncidents: incidents.uuidIncidents,
            description: "Server Responses UP! Resolving incidents Successfully."
        })

        console.log(`[${new Date().toLocaleString()}] - Incidents Resolved! Downtime: ${durationNow}`);
        return;
    } catch (error) {
        console.log(`[${new Date().toLocaleString()}] - ${error.message}`);
    }
}