import path from "path";
import { spawn } from "child_process";
import LogsDevices from "../models/logsDevices.js";
import { pingDevicesWithRetry } from "../utils/logsHelper.js";
import MonitorDevices from "../models/monitorDevices.js";
import { HandleOngoingIncidentsDevices, HandleResolvedIncidentsDevices } from "./devicesIncidents.js";

export const ServiceDevices = async ( attribute ) => {
    const ip = attribute.ipaddress;
    let responseTime = 0, statusCode = 502;
    let status = "DOWN", uptime = "N/A", cpuUsage = "N/A", ramUsage = "N/A", diskUsage = "N/A";
    let result = null;

    try {
        const monitor = await MonitorDevices.findOne({
            where: { uuidDevices: attribute.uuidDevices },
            order: [['createdAt', 'DESC']],
        });

        const logs = await LogsDevices.findAll({
            where: { uuidDevices: attribute.uuidDevices },
            order: [['createdAt', 'DESC']]
        });

        if (monitor && monitor.running === "PAUSED") {
            console.log(`[${new Date().toLocaleString()}] - Devices Logs - ${attribute.ipaddress} Running Status PAUSED.`);
            return;
        }

        const devicesResponse = await pingDevicesWithRetry(ip);
        status = devicesResponse.alive ? "UP" : "DOWN";

        if (status === "UP") {
            responseTime = devicesResponse.time;
            statusCode = 200;

            result = await getValidSNMPStatus(attribute);
            console.log(`[${new Date().toLocaleString()}] - CPU: ${result.cpu_usage}, RAM: ${result.ram_usage}, DISK: ${result.disk_usage}, UPTIME: ${result.uptime}`);

            if ( logs[0]?.status === "DOWN" && result ){
                console.log(`[${new Date().toLocaleString()}] - Devices UP, Solving Incidents (${attribute.ipaddress})`);
                await HandleResolvedIncidentsDevices(attribute);
            }

            uptime = result.uptime;
            cpuUsage = result.cpu_usage;
            ramUsage = result.ram_usage;
            diskUsage = result.disk_usage;
        } else {
            statusCode = 502;
            responseTime = 0;

            console.log(`[${new Date().toLocaleString()}] - Devices Down, incidents (${attribute.ipaddress}) checked`);
            await HandleOngoingIncidentsDevices(attribute);
        }
    } catch (error) {
        console.log(`[${new Date().toLocaleString()}] - Devices Logs - ${error.message}`);
        statusCode = error.response?.status || 502;
    }

    await LogsDevices.create({
        uuidDevices: attribute.uuidDevices,
        status,
        responseTime,
        uptime,
        cpuUsage,
        ramUsage,
        diskUsage,
        statusCode,
    });

    console.log(`[${new Date().toLocaleString()}] - Devices SNMP - (${attribute.ipaddress}) - Status: ${status}, Response Time: ${responseTime}, Code: ${statusCode}`);
};


const getValidSNMPStatus = async (attribute, retries = 3, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
        const result = await ServiceSNMPGetStatus(attribute);
        
        if (result.cpu_usage !== "N/A" && result.ram_usage !== "N/A" && result.disk_usage !== "N/A") {
            return result;
        }

        console.log(`[${new Date().toLocaleString()}] - Retry ${i + 1}: SNMP data belum lengkap, mencoba lagi...`);
        await new Promise(res => setTimeout(res, delay));
    }
    return result;
};

export const ServiceSNMPGetStatus = async (attribute) => {
    return new Promise((resolve, reject) => {
        const pythonPath = path.resolve("script/SNMPGetInfo.py");
        const processPy = spawn("python", [pythonPath]);

        const devicesAttribute = JSON.stringify({
            uuidDevices: attribute.uuidDevices,
            ipaddress: attribute.ipaddress,
            snmp_username: attribute.snmp_username,
            snmp_authkey: attribute.snmp_authkey,
            snmp_privkey: attribute.snmp_privkey,
            snmp_port: attribute.snmp_port,
        });
        
        // Send input to Python script
        processPy.stdin.write(devicesAttribute);
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