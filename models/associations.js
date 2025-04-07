import ActivityHTTPs from "./activityHTTP.js";
import ActivityPort from "./activityPort.js";
import ActivityServer from "./activityServer.js";
import IncidentsHTTPs from "./incidentsHTTP.js";
import IncidentsPorts from "./incidentsPort.js";
import IncidentsServers from "./incidentsServer.js";
import LogsHTTPs from "./logsHTTP.js";
import LogsPorts from "./logsPort.js";
import LogsServers from "./logsServer.js";
import MonitorHTTPs from "./monitorHTTP.js";
import MonitorPorts from "./monitorPorts.js";
import MonitorServers from "./monitorServer.js";
import Users from "./userModels.js";

//? Relasi Users */
Users.hasMany(MonitorHTTPs, {
    foreignKey: "uuidUsers",
    as: "monitor_https",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});
Users.hasMany(MonitorServers, {
    foreignKey: "uuidUsers",
    as: "monitor_servers",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});
Users.hasMany(MonitorPorts, {
    foreignKey: "uuidUsers",
    as: "monitor_ports",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});


//? Relasi HTTPs */
MonitorHTTPs.belongsTo(Users, {
    foreignKey: "uuidUsers",
    as: "users"
});
MonitorHTTPs.hasMany(LogsHTTPs, {
    foreignKey: "uuidHTTPs",
    as: "logs_https",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});
MonitorHTTPs.hasMany(IncidentsHTTPs, {
    foreignKey: "uuidHTTPs",
    as: "incidents_https",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});

//? Relasi Ports */
MonitorPorts.belongsTo(Users, {
    foreignKey: "uuidUsers",
    as: "users"
});
MonitorPorts.hasMany(LogsPorts, {
    foreignKey: "uuidPorts",
    as: "logs_ports",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});
MonitorPorts.hasMany(IncidentsPorts, {
    foreignKey: "uuidPorts",
    as: "incidents_ports",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});

//? Relasi Servers */
MonitorServers.belongsTo(Users, {
    foreignKey: "uuidUsers",
    as: "users"
});
MonitorServers.hasMany(LogsServers, {
    foreignKey: "uuidServers",
    as: "logs_servers",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});
MonitorServers.hasMany(IncidentsServers, {
    foreignKey: "uuidServers",
    as: "incidents_servers",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});

//? Relasi Logs */
LogsHTTPs.belongsTo(MonitorHTTPs, {
    foreignKey: "uuidHTTPs",
    as: "logs_https",
});
LogsPorts.belongsTo(MonitorPorts, {
    foreignKey: "uuidPorts",
    as: "logs_ports",
});
LogsServers.belongsTo(MonitorServers, {
    foreignKey: "uuidServers",
    as: "logs_servers",
});

//? Relasi Incidents */
IncidentsHTTPs.belongsTo(MonitorHTTPs, {
    foreignKey: "uuidHTTPs",
    as: "incidents_https",
});
IncidentsHTTPs.hasMany(ActivityHTTPs, {
    foreignKey: "uuidIncidents",
    as: "activity_https",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});


IncidentsPorts.belongsTo(MonitorPorts, {
    foreignKey: "uuidPorts",
    as: "incidents_ports",
});
IncidentsPorts.hasMany(ActivityPort, {
    foreignKey: "uuidIncidents",
    as: "activity_port",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});


IncidentsServers.belongsTo(MonitorServers, {
    foreignKey: "uuidServers",
    as: "incidents_servers",
});
IncidentsServers.hasMany(ActivityServer, {
    foreignKey: "uuidIncidents",
    as: "activity_servers",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});

ActivityServer.belongsTo(IncidentsServers, {
    foreignKey: "uuidIncidents",
    as: "incidents_servers",
});
ActivityPort.belongsTo(IncidentsPorts, {
    foreignKey: "uuidIncidents",
    as: "incidents_ports",
});
ActivityHTTPs.belongsTo(IncidentsHTTPs, {
    foreignKey: "uuidIncidents",
    as: "incidents_https",
});

export { 
    Users, 
    MonitorHTTPs, 
    MonitorPorts, 
    MonitorServers, 
    LogsHTTPs, 
    LogsPorts, 
    LogsServers, 
    IncidentsHTTPs, 
    IncidentsPorts, 
    IncidentsServers, 
    ActivityHTTPs, 
    ActivityPort, 
    ActivityServer 
};