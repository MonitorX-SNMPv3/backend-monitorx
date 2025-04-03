import ping from "ping";
import path from "path";
import { spawn } from "child_process";
import LogsServers from "../models/logsServer.js";
import { createIncidentsServers } from "../controllers/incidents/incidentsServer.js";

export const ServiceServers = async (attribute) => {
    const ip = attribute.ipaddress;
    let responseTime = 0, statusCode = 502;
    let status = "DOWN", uptime = "N/A", cpuUsage = "N/A", ramUsage = "N/A", diskUsage = "N/A";
    let result = null;
    
    try {
        const serverResponse = await ping.promise.probe(ip, { timeout: 2 });
        // status = serverResponse.alive ? "UP" : "DOWN";  
    
        if (status === "UP") {
            responseTime = serverResponse.time;
            statusCode = 200;
    
            result = await ServiceSNMPGetStatus(attribute);
            console.log(`[${new Date().toLocaleString()}] - CPU: ${result.cpu_usage}, RAM: ${result.ram_usage}, DISK: ${result.disk_usage}, UPTIME: ${result.uptime}`);
            
            uptime = result.uptime;
            cpuUsage = result.cpu_usage;
            ramUsage = result.ram_usage;
            diskUsage = result.disk_usage;
        } else {
            statusCode = 502;
            responseTime = 0;
            console.log(serverResponse.output);
            
            console.log(`[${new Date().toLocaleString()}] - Server Down, Creating Incidents  (${attribute.ipaddress})`);
            await createIncidentsServers(attribute, statusCode);
        }
    } catch (error) {
        console.log(error);
        
        statusCode = error.response?.status || 502;
    }

    // await LogsServers.create({
    //     uuidServers: attribute.uuidServers,
    //     status: status,
    //     responseTime: responseTime,
    //     uptime: uptime,
    //     cpuUsage: cpuUsage,
    //     ramUsage: ramUsage,
    //     diskUsage: diskUsage,
    //     statusCode: statusCode,
    // });
    
    console.log(`[${new Date().toLocaleString()}] - Server SNMP - (${attribute.ipaddress}) - Status: ${status}, Response Time: ${responseTime}, Code: ${statusCode}`);
};

export const ServiceSNMPGetStatus = async (attribute) => {
    return new Promise((resolve, reject) => {
        const pythonPath = path.resolve("script/SNMPGetInfo.py");
        const processPy = spawn("python", [pythonPath]);

        const serverAttribute = JSON.stringify({
            uuidServers: attribute.uuidServers,
            ipaddress: attribute.ipaddress,
            snmp_username: attribute.snmp_username,
            snmp_authkey: attribute.snmp_authkey,
            snmp_privkey: attribute.snmp_privkey,
            snmp_port: attribute.snmp_port,
        });
        
        // Send input to Python script
        processPy.stdin.write(serverAttribute);
        processPy.stdin.end();

        let output = "";
        let errorOutput = "";

        // Collect stdout data
        processPy.stdout.on("data", (data) => {
            output += data.toString();
        });

        // Collect stderr data
        processPy.stderr.on("data", (data) => {
            errorOutput += data.toString();
        });

        // Handle process exit
        processPy.on("close", (code) => {
            if (code === 0) {
                try {
                    const jsonData = JSON.parse(output);
                    resolve(jsonData);
                } catch (parseError) {
                    reject(`JSON Parse Error: ${parseError.message}`);
                }
            } else {
                reject(`Python script exited with code ${code}. Error: ${errorOutput}`);
            }
        });

        // Handle errors in spawning the process
        processPy.on("error", (err) => {
            reject(`Failed to start Python process: ${err.message}`);
        });
    });
};