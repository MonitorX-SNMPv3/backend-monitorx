import IncidentsServers from "../../models/incidentsServer.js";
import MonitorServers from "../../models/monitorServer.js";
import { recordIncidentsActivity } from "./incidents.js";

export const createIncidentsServers = async ( attribute ) => {
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
            
            console.log(`[${new Date().toLocaleString()}] - Incidents Not Found Creating New`);
            
            await IncidentsServers.create({
                uuidServers: attribute.uuidServers,
                status: "Ongoing",
                rootcause: "Connection Timeout",
                started: Date.now(),
                resolved: null,
                duration: duration,
            });
            
            const incidents = await IncidentsServers.findOne({ where: { status: "Ongoing", uuidServers: attribute.uuidServers }});
            await recordIncidentsActivity(incidents);
            return;
        }
        
        let calculatedDuration = calculateDuration(incidents.started);
        
        let result = {
            uuidServers: attribute.uuidServers,
            status: incidents.status,
            rootcause: incidents.rootcause,
            started: incidents.started,
            resolved: null,
            duration: calculatedDuration, 
        }
        console.log(`Result ${result}`);
    } catch (error) {
        console.log(error.message);
    }
}

const calculateDuration = (date) => {
    const now = Date.now();
    let diff = now - date;
    
    if (diff <= 0) return "0m"; 
    
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const hours = Math.floor((diff / 1000 / 60 / 60) % 24);
    const days = Math.floor(diff / 1000 / 60 / 60 / 24);
    
    let result = [];
    if (days > 0) result.push(`${days}d`);
    if (hours > 0) result.push(`${hours}h`);
    if (minutes > 0 || result.length === 0) result.push(`${minutes}m`);
    
    return result.join(" ");
};